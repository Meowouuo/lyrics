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

    // 解析歌词为段落
    const paragraphs = fullLyrics.replace(/\\r\\n/g, '\n').split(/\\n{2,}/).filter(p => p.trim());
    
    const lyricsArray = [];
    paragraphs.forEach((para, pIdx) => {
        const lines = para.split('\n').filter(l => l.trim());
        lines.forEach(line => {
            const matched = matchJyutping(line.trim());
            // 保留所有字符，但符号的粤拼设为空字符串
            lyricsArray.push({
                chars: matched.map(m => `"${m.char}"`).join(', '),
                jp: matched.map(m => {
                    // 汉字、字母、数字保留粤拼，符号设为空字符串
                    if (/[\u4e00-\u9fff\u3400-\u4dbfa-zA-Z0-9]/.test(m.char)) {
                        return `"${m.jp || '?'}"`;
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
                insertions.push({ line, position, lyrics: codeBlockMatch[1].trim() });
            } else {
                // 尝试匹配 - **歌词：** XXX
                const lyricsMatch = afterPos.match(/-\s*\*\*歌词：\*\*\s*(.+?)(?=\n|$)/);
                if (lyricsMatch) {
                    insertions.push({ line, position, lyrics: lyricsMatch[1].trim() });
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
            insertLyrics = codeBlockMatch[1].trim();
        }
        
        // 格式2: ## 要插入的歌词 标题后的内容
        if (!insertLyrics) {
            const headingMatch = body.match(/##\s*要插入的歌词\s*\n([\s\S]*?)(?=\n##\s|$)/);
            if (headingMatch) {
                insertLyrics = headingMatch[1].trim();
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
        const insertLines = insertion.lyrics.split('\n').filter(l => l.trim());
        const insertArray = insertLines.map(line => {
            const matched = matchJyutping(line.trim());
            if (matched.length === 0) return null;
            return {
                chars: matched.map(m => `"${m.char}"`).join(', '),
                jp: matched.map(m => {
                    if (/[\u4e00-\u9fff\u3400-\u4dbfa-zA-Z0-9]/.test(m.char)) {
                        return `"${m.jp || '?'}"`;
                    }
                    return `""`;
                }).join(', ')
            };
        }).filter(Boolean);
        
        const lines = newContent.split('\n');
        // 行号计算与前端一致：paragraphBreak 也算一行
        let lineCount = 0;
        let insertIndex = -1;
        
        for (let i = 0; i < lines.length; i++) {
            if (lines[i].includes('paragraphBreak')) {
                lineCount++;
                continue;
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
                lineCount++;
            }
        }
        
        if (insertIndex === -1) {
            return { success: false, message: `❌ 未找到第 ${insertion.line} 行歌词` };
        }
        
        const insertContent = insertArray.map(item => 
            `            { chars: [${item.chars}], jp: [${item.jp}] },`
        );
        
        const spliceIndex = insertion.position === 'before' ? insertIndex : insertIndex + 1;
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
        // 行号计算与前端一致：paragraphBreak 也算一行
        const lines = newContent.split('\n');
        let lineCount = 0;
        let targetIndex = -1;
        
        for (let i = 0; i < lines.length; i++) {
            if (lines[i].includes('paragraphBreak')) {
                lineCount++;
                continue;
            }
            if (lines[i].includes('chars:') && lines[i].includes('jp:')) {
                if (lineCount === lineNum) {
                    targetIndex = i;
                    break;
                }
                lineCount++;
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
        
        // 检查原歌词是否匹配
        if (currentChars !== originalText.toString().trim()) {
            failedRows.push(row);
            continue;
        }
        
        // 替换歌词并重新匹配粤拼
        const matched = matchJyutping(newText.toString().trim());
        const newChars = matched.map(m => `"${m.char}"`).join(', ');
        const newJp = matched.map(m => {
            if (/[\u4e00-\u9fff\u3400-\u4dbfa-zA-Z0-9]/.test(m.char)) {
                return `"${m.jp || '?'}"`;
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
