// 处理歌词纠错：解析 Issue → 修改歌词文件 → 创建 PR
// 支持：逐行修改、整首替换、插入行

const fs = require('fs');
const path = require('path');
const {
    getIssueInfo,
    parseField,
    parseTable,
    findSongFile,
    createBranch,
    commitAndPush,
    createPR,
    addComment,
} = require('./utils');

// 加载粤拼字典和匹配函数
const { matchJyutping } = require('../jyutping-dict');
const { toSimplified, countSegments } = require('./t2s-converter');

// 智能分割歌词行
// 规则1：连续重复词（如"等 等 等"），中间空格保留不换行，重复序列之后的空格换行
// 规则2：非重复序列，空格前的词字数 >= 3 则换行，< 3 则保留空格不换行
// 规则3：空格保留，不消除；空格不匹配粤拼
function smartSplitLines(text) {
    const rawLines = text.split('\n').filter(l => l.trim());
    const result = [];
    
    rawLines.forEach(line => {
        // 按空格分割为词和空格的数组
        const segments = [];
        let buf = '';
        let inSpace = false;
        for (const ch of line) {
            if (/\s/.test(ch)) {
                if (!inSpace) {
                    if (buf) segments.push({ type: 'word', value: buf });
                    buf = '';
                    inSpace = true;
                }
                buf += ch;
            } else {
                if (inSpace) {
                    if (buf) segments.push({ type: 'space', value: buf });
                    buf = '';
                    inSpace = false;
                }
                buf += ch;
            }
        }
        if (buf) segments.push({ type: inSpace ? 'space' : 'word', value: buf });
        
        // 提取词的数组
        const words = segments.filter(s => s.type === 'word').map(s => s.value);
        
        // 对每个空格位置，判断是否换行
        let currentLine = '';
        for (let i = 0; i < segments.length; i++) {
            const seg = segments[i];
            
            if (seg.type === 'word') {
                currentLine += seg.value;
            } else if (seg.type === 'space') {
                const prevWordIdx = segments.slice(0, i).filter(s => s.type === 'word').length - 1;
                const nextWordIdx = prevWordIdx + 1;
                const prevWord = words[prevWordIdx] || '';
                const nextWord = words[nextWordIdx] || '';
                
                // 规则1：连续重复词
                if (nextWord && prevWord === nextWord) {
                    // 连续重复，空格保留不换行
                    currentLine += seg.value;
                } else if (prevWordIdx >= 1 && words[prevWordIdx] === words[prevWordIdx - 1]) {
                    // 在连续重复序列之后，换行
                    result.push(currentLine);
                    currentLine = '';
                } else {
                    // 规则2：非重复序列
                    // 规则2.1：英文句子间的空格不换行
                    const isPrevEnglish = /^[a-zA-Z]/.test(prevWord);
                    const isNextEnglish = /^[a-zA-Z]/.test(nextWord);
                    if (isPrevEnglish && isNextEnglish) {
                        // 英文单词之间的空格，保留不换行
                        currentLine += seg.value;
                    } else {
                        // 规则2.2：中文词，按字数判断
                        const prevLen = prevWord.replace(/[^\u4e00-\u9fff\u3400-\u4dbf]/g, '').length;
                        if (prevLen >= 3) {
                            result.push(currentLine);
                            currentLine = '';
                        } else {
                            currentLine += seg.value;
                        }
                    }
                }
            }
        }
        
        if (currentLine.trim()) {
            result.push(currentLine);
        }
    });
    
    return result.filter(l => l.trim());
}

function processLyricsCorrection() {
    const issue = getIssueInfo();

    const songTitle = parseField(issue.body, '歌曲名称').replace(/\*+/g, '').trim();
    if (!songTitle) {
        addComment(issue.number, '❌ 未找到歌曲名称');
        return;
    }

    const song = findSongFile(songTitle);
    if (!song) {
        addComment(issue.number, `❌ 未找到歌曲「${songTitle}」`);
        return;
    }

    const filePath = path.join(__dirname, '..', 'lyrics', `${song.fileName}.js`);
    let content = fs.readFileSync(filePath, 'utf8');

    // 检测纠错类型
    const correctionType = detectCorrectionType(issue.body);
    
    let result;
    switch (correctionType) {
        case 'full':
            result = processFullReplacement(content, issue.body, songTitle);
            break;
        case 'insert':
            result = processInsertLine(content, issue.body, songTitle);
            break;
        default:
            result = processLineByLine(content, issue.body, songTitle);
    }

    if (!result.success) {
        addComment(issue.number, result.message);
        return;
    }

    fs.writeFileSync(filePath, result.content, 'utf8');

    const branchName = `fix/lyrics-${issue.number}`;
    createBranch(branchName);
    commitAndPush(branchName, result.commitMsg);
    createPR(result.prTitle, result.prBody, branchName, issue.number);
    addComment(issue.number, result.comment);
}

function detectCorrectionType(body) {
    if (body.includes('完整歌词') || body.includes('整首替换')) return 'full';
    if (body.includes('插入位置') || body.includes('在第') || body.includes('**位置：**')) return 'insert';
    return 'line';
}

// 整首替换
function processFullReplacement(content, body, songTitle) {
    // 尝试多种格式匹配歌词
    let fullLyrics = null;
    
    // 格式1: 代码块 ```歌词```
    const codeBlockMatch = body.match(/完整歌词[\s\S]*?```\s*([\s\S]*?)\s*```/);
    if (codeBlockMatch) {
        fullLyrics = codeBlockMatch[1].trim();
    }
    
    // 格式2: ## 完整歌词 标题后的内容（直到下一个 ## 或结尾）
    if (!fullLyrics) {
        const headingMatch = body.match(/##\s*完整歌词\s*\n([\s\S]*?)(?=\n##\s|$)/);
        if (headingMatch) {
            fullLyrics = headingMatch[1].trim();
        }
    }
    
    // 格式3: 整首歌词替换 后的任意内容
    if (!fullLyrics) {
        const simpleMatch = body.match(/整首歌词替换[\s\S]*?\n([\s\S]*?)(?=\n##\s|$)/);
        if (simpleMatch) {
            fullLyrics = simpleMatch[1].trim();
        }
    }
    
    if (!fullLyrics) {
        return { success: false, message: '❌ 未找到完整歌词，请使用代码块(```)或##完整歌词标题提供歌词' };
    }

    // 繁体→简体转换
    fullLyrics = toSimplified(fullLyrics);

    // 解析歌词为段落 - 智能换行逻辑
    // 规则：超过3个相同字的连续重复，中间空格不视为换行
    const normalizedLyrics = fullLyrics.replace(/\r\n/g, '\n');
    
    // 先按段落分割（两个以上换行）
    const rawParagraphs = normalizedLyrics.split(/\n{2,}/).filter(p => p.trim());
    
    const lyricsArray = [];
    
    rawParagraphs.forEach((para) => {
        // 智能分割行：处理"等 等 等 等不到月圆"这种情况
        // 如果一行中有连续3个以上相同汉字用空格连接，不分割
        const lines = smartSplitLines(para);
        lines.forEach(line => {
            const matched = matchJyutping(line.trim());
            // 保留所有字符，但符号的粤拼设为空字符串
            lyricsArray.push({
                chars: matched.map(m => `"${m.char}"`).join(', '),
                jp: matched.map(m => {
                    // 汉字、字母、数字保留粤拼，符号设为空字符串
                    if (/[\u4e00-\u9fff\u3400-\u4dbfa-zA-Z0-9]/.test(m.char)) {
                        return `"${m.jp}"`;
                    }
                    return `""`;
                }).join(', ')
            });
        });
        if (pIdx < paragraphs.length - 1) {
            lyricsArray.push({ isBreak: true });
        }
    });

    const newLyricsStr = lyricsArray.map(item => {
        if (item.isBreak) return '            { paragraphBreak: true }';
        return `            { chars: [${item.chars}], jp: [${item.jp}] }`;
    }).join(',\n');

    const newContent = content.replace(
        /lyrics:\s*\[[\s\S]*\n\s*\](?=\s*\};?)/,
        `lyrics: [\n${newLyricsStr}\n        ]`
    );

    if (newContent === content) {
        return { success: false, message: '❌ 替换歌词失败' };
    }

    const lineCount = lyricsArray.filter(i => !i.isBreak).length;

    return {
        success: true,
        content: newContent,
        commitMsg: `fix: 整首替换歌词《${songTitle}》`,
        prTitle: `fix: 整首替换歌词《${songTitle}》`,
        prBody: `## 整首歌词替换\\n\\n**歌曲：** ${songTitle}\\n**新歌词行数：** ${lineCount} 行`,
        comment: `✅ 已创建整首歌词替换的 Pull Request，共 ${lineCount} 行歌词。`
    };
}

// 插入行 - 支持多处插入
function processInsertLine(content, body, songTitle) {
    // 解析多处插入（支持新格式：多处 **位置：** 和 **歌词：**）
    const insertions = [];
    
    // 新格式：多处 - **位置：** 第X行前/后 和 - **歌词：** XXX（支持代码块）
    const positionMatches = [...body.matchAll(/-\s*\*\*位置：\*\*\s*第\s*(\d+)\s*行\s*(前|后)/g)];
    
    if (positionMatches.length > 0) {
        for (let i = 0; i < positionMatches.length; i++) {
            const line = parseInt(positionMatches[i][1]);
            const position = positionMatches[i][2] === '前' ? 'before' : 'after';
            
            // 查找对应的歌词（在位置匹配之后的代码块或行内文本）
            const posIndex = positionMatches[i].index;
            const afterPos = body.slice(posIndex + positionMatches[i][0].length);
            
            // 尝试匹配代码块 ```歌词```
            const codeBlockMatch = afterPos.match(/[\s\S]*?```\s*([\s\S]*?)\s*```/);
            if (codeBlockMatch) {
                insertions.push({ line, position, lyrics: codeBlockMatch[1] });
            } else {
                // 尝试匹配 - **歌词：** XXX
                const lyricsMatch = afterPos.match(/-\s*\*\*歌词：\*\*\s*(.+?)(?=\n|$)/);
                if (lyricsMatch) {
                    insertions.push({ line, position, lyrics: lyricsMatch[1] });
                }
            }
        }
    }
    
    // 旧格式：单处插入
    if (insertions.length === 0) {
        // 尝试多种格式匹配要插入的歌词
        let insertLyrics = null;
        
        // 格式1: 代码块 ```歌词```
        const codeBlockMatch = body.match(/要插入的歌词[\s\S]*?```\s*([\s\S]*?)\s*```/);
        if (codeBlockMatch) {
            insertLyrics = codeBlockMatch[1];
        }
        
        // 格式2: ## 要插入的歌词 标题后的内容
        if (!insertLyrics) {
            const headingMatch = body.match(/##\s*要插入的歌词\s*\n([\s\S]*?)(?=\n##\s|$)/);
            if (headingMatch) {
                insertLyrics = headingMatch[1];
            }
        }
        
        if (insertLyrics) {
            // 解析行号
            let insertLine = 1;
            let position = 'after';
            const lineMatch = body.match(/第\s*(\d+)\s*行/);
            if (lineMatch) insertLine = parseInt(lineMatch[1]);
            if (body.includes('前')) position = 'before';
            
            insertions.push({ line: insertLine, position, lyrics: insertLyrics });
        }
    }
    
    if (insertions.length === 0) {
        return { success: false, message: '❌ 未找到要插入的歌词，请使用 **位置：** 第X行前/后 和 **歌词：** XXX 格式' };
    }
    
    // 处理所有插入（从后往前插入，避免行号变化）
    const sortedInsertions = [...insertions].sort((a, b) => b.line - a.line);
    let newContent = content;
    let totalInsertedLines = 0;
    
    for (const insertion of sortedInsertions) {
        // 繁体→简体转换
        const simplifiedLyrics = toSimplified(insertion.lyrics);
        // 按换行分割，保留空行用于段落分隔
        const rawLines = simplifiedLyrics.split('\n');
        const insertArray = rawLines.map(line => {
            if (!line.trim()) {
                // 空行转为段落分隔
                return { isBreak: true };
            }
            const matched = matchJyutping(line.trim());
            if (matched.length === 0) return null;
            return {
                chars: matched.map(m => `"${m.char}"`).join(', '),
                jp: matched.map(m => {
                    if (/[\u4e00-\u9fff\u3400-\u4dbfa-zA-Z0-9]/.test(m.char)) {
                        return `"${m.jp}"`;
                    }
                    return `""`;
                }).join(', ')
            };
        }).filter(Boolean);
        
        const lines = newContent.split('\n');
        // 行号计算与前端一致：每个segment算一行（按空格分割），从1开始（与用户看到的行号一致）
        let lineCount = 1;
        let insertIndex = -1;
        
        for (let i = 0; i < lines.length; i++) {
            if (lines[i].includes('paragraphBreak')) {
                continue; // paragraphBreak 不算行
            }
            if (lines[i].includes('chars:') && lines[i].includes('jp:')) {
                if (lineCount === insertion.line) {
                    insertIndex = i;
                    if (insertion.position === 'after') {
                        while (i < lines.length && !lines[i].includes('}')) i++;
                        insertIndex = i;
                    }
                    break;
                }
                // 计算这行歌词有多少个segment（书名号和括号内的空格不分割）
                const charsMatch = lines[i].match(/chars:\s*\[([^\]]+)\]/);
                if (charsMatch) {
                    const chars = charsMatch[1].match(/"([^"]*)"/g) || [];
                    const charsArray = chars.map(c => c.replace(/"/g, ''));
                    lineCount += countSegments(charsArray);
                } else {
                    lineCount++;
                }
            }
        }
        
        if (insertIndex === -1) {
            return { success: false, message: `❌ 未找到第 ${insertion.line} 行歌词` };
        }
        
        const insertContent = insertArray.map(item => {
            if (item.isBreak) {
                return '            { paragraphBreak: true },';
            }
            return `            { chars: [${item.chars}], jp: [${item.jp}] },`;
        });
        
        const spliceIndex = insertion.position === 'before' ? insertIndex : insertIndex + 1;
        // 如果是 after 插入，检查目标行末尾是否有逗号，没有则补上（避免在数组末尾插入时语法错误）
        if (insertion.position === 'after' && insertIndex < lines.length) {
            const targetLine = lines[insertIndex].trimEnd();
            if (targetLine.endsWith('}') && !targetLine.endsWith('},')) {
                lines[insertIndex] = targetLine.slice(0, -1) + '},';
            }
        }
        lines.splice(spliceIndex, 0, ...insertContent);
        newContent = lines.join('\n');
        totalInsertedLines += insertArray.length;
    }
    
    const insertionsDesc = insertions.map(ins => `第${ins.line}行${ins.position === 'before' ? '前' : '后'}`).join('、');
    
    return {
        success: true,
        content: newContent,
        commitMsg: `fix: 插入歌词《${songTitle}》`,
        prTitle: `fix: 插入歌词《${songTitle}》`,
        prBody: `## 插入歌词\\n\\n**歌曲：** ${songTitle}\\n**插入位置：** ${insertionsDesc}\\n**插入行数：** ${totalInsertedLines} 行`,
        comment: `✅ 已创建插入歌词的 Pull Request，在 ${insertionsDesc} 插入 ${totalInsertedLines} 行歌词。`
    };
}

// 逐行修改（完整实现）
function processLineByLine(content, body, songTitle) {
    const rows = parseTable(body);
    if (rows.length === 0) {
        return { success: false, message: '❌ 未检测到纠错表格' };
    }
    
    let newContent = content;
    let appliedCount = 0;
    let failedRows = [];
    
    for (const row of rows) {
        // 解析表格行：行号、原歌词、正确歌词
        const [lineNumStr, originalText, newText] = row;
        const lineNum = parseInt(lineNumStr.toString().replace(/[^0-9]/g, ''));
        
        if (isNaN(lineNum) || !originalText || !newText) {
            failedRows.push(row);
            continue;
        }
        
        // 查找并替换歌词
        // 行号计算与前端一致：每个segment算一行（按空格分割），从1开始（与用户看到的行号一致）
        const lines = newContent.split('\n');
        let lineCount = 1;
        let targetIndex = -1;
        
        for (let i = 0; i < lines.length; i++) {
            if (lines[i].includes('paragraphBreak')) {
                continue; // paragraphBreak 不算行
            }
            if (lines[i].includes('chars:') && lines[i].includes('jp:')) {
                if (lineCount === lineNum) {
                    targetIndex = i;
                    break;
                }
                // 计算这行歌词有多少个segment（书名号和括号内的空格不分割）
                const charsMatch = lines[i].match(/chars:\s*\[([^\]]+)\]/);
                if (charsMatch) {
                    const chars = charsMatch[1].match(/"([^"]*)"/g) || [];
                    const charsArray = chars.map(c => c.replace(/"/g, ''));
                    lineCount += countSegments(charsArray);
                } else {
                    lineCount++;
                }
            }
        }
        
        if (targetIndex === -1) {
            failedRows.push(row);
            continue;
        }
        
        // 获取当前行的 chars
        const line = lines[targetIndex];
        const charsMatch = line.match(/chars:\s*\[([^\]]+)\]/);
        if (!charsMatch) {
            failedRows.push(row);
            continue;
        }
        
        const currentChars = charsMatch[1].replace(/"/g, '').replace(/,\s*/g, '');
        
        // 繁体→简体转换
        const simplifiedOriginal = toSimplified(originalText.toString().trim());
        const simplifiedNew = toSimplified(newText.toString().trim());
        
        // 检查原歌词是否匹配（简体比较）
        if (currentChars !== simplifiedOriginal) {
            failedRows.push(row);
            continue;
        }
        
        // 替换歌词并重新匹配粤拼（使用简体）
        const matched = matchJyutping(simplifiedNew);
        const newChars = matched.map(m => `"${m.char}"`).join(', ');
        const newJp = matched.map(m => {
            if (/[\u4e00-\u9fff\u3400-\u4dbfa-zA-Z0-9]/.test(m.char)) {
                return `"${m.jp}"`;
            }
            return `""`;
        }).join(', ');
        
        // 替换行内容
        lines[targetIndex] = line.replace(
            /chars:\s*\[[^\]]+\]/,
            `chars: [${newChars}]`
        ).replace(
            /jp:\s*\[[^\]]+\]/,
            `jp: [${newJp}]`
        );
        
        newContent = lines.join('\n');
        appliedCount++;
    }
    
    if (appliedCount === 0) {
        return { 
            success: false, 
            message: `❌ 未能应用任何纠错。请检查行号、原歌词是否正确。\n\n失败的行：\n${failedRows.map(r => r.join(' | ')).join('\n')}` 
        };
    }
    
    const correctionsTable = rows.map(r => `| ${r.join(' | ')} |`).join('\\n');
    
    return {
        success: true,
        content: newContent,
        commitMsg: `fix: 歌词纠错《${songTitle}》(${appliedCount}处)`,
        prTitle: `fix: 歌词纠错《${songTitle}》(${appliedCount}处)`,
        prBody: `## 歌词纠错\\n\\n**歌曲：** ${songTitle}\\n**修改数量：** ${appliedCount} 处\\n\\n| 行号 | 原歌词 | 正确歌词 |\\n|------|--------|----------|\\n${correctionsTable}`,
        comment: `✅ 已自动修改 ${appliedCount} 处歌词并创建 Pull Request。${failedRows.length > 0 ? `\\n\\n⚠️ 以下 ${failedRows.length} 处纠错未能自动应用：\\n${failedRows.map(r => `- ${r.join(' | ')}`).join('\\n')}` : ''}`
    };
}

module.exports = { processLyricsCorrection };
