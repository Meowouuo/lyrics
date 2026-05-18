// 处理歌词纠错：解析 Issue → 修改歌词文件 → 创建 PR
// 支持三种纠错模式：逐行修改、整首替换、插入行
// 本脚本由 GitHub Actions 调用，自动处理用户提交的歌词纠错请求

// ============================================
// 引入依赖模块
// ============================================
const fs = require('fs');      // 文件系统模块，用于读写歌词文件
const path = require('path');  // 路径处理模块，用于构建文件路径

// 从 utils.js 引入工具函数
const {
    getIssueInfo,    // 获取 Issue 信息
    parseField,      // 解析字段值
    parseTable,      // 解析表格数据
    findSongFile,    // 查找歌曲文件
    createBranch,    // 创建 Git 分支
    commitAndPush,   // 提交并推送更改
    createPR,        // 创建 Pull Request
    addComment,      // 添加 Issue 评论
} = require('./utils');

// 加载粤拼字典和匹配函数（用于整首替换时重新匹配粤拼）
const { matchJyutping } = require('../jyutping-dict');
// 加载繁简转换和分段计数工具
const { toSimplified, countSegments } = require('./t2s-converter');

// ============================================
// 智能分割歌词行函数
// 功能：将用户输入的歌词文本智能分割为适合显示的行
// 
// 分割规则：
// 规则1：连续重复词（如"等 等 等"），中间空格保留不换行，重复序列之后的空格换行
// 规则2：非重复序列，空格前的词字数 >= 3 则换行，< 3 则保留空格不换行
// 规则3：空格保留，不消除；空格不匹配粤拼
// 规则4：英文句子间的空格不换行（连续英文字词）
//
// 参数：
//   - text: 字符串，用户输入的歌词文本
//
// 返回值：
//   - 数组，分割后的歌词行数组
// ============================================
function smartSplitLines(text) {
    // 按换行符分割原始文本，并过滤掉空行
    const rawLines = text.split('\n').filter(l => l.trim());
    // 存储最终结果的数组
    const result = [];
    
    // 遍历每一行原始文本
    rawLines.forEach(line => {
        // 将行按词和空格分割为片段数组
        // 每个片段标记为 'word'（词）或 'space'（空格）
        const segments = [];
        let buf = '';        // 临时缓冲区
        let inSpace = false; // 标记当前是否在空格序列中
        
        // 遍历行中的每个字符，分类为词或空格
        for (const ch of line) {
            if (/\s/.test(ch)) {
                // 当前字符是空白字符
                if (!inSpace) {
                    // 从词切换到空格，先保存之前的词
                    if (buf) segments.push({ type: 'word', value: buf });
                    buf = '';
                    inSpace = true;
                }
                buf += ch; // 累加空格字符
            } else {
                // 当前字符是非空白字符
                if (inSpace) {
                    // 从空格切换到词，先保存之前的空格
                    if (buf) segments.push({ type: 'space', value: buf });
                    buf = '';
                    inSpace = false;
                }
                buf += ch; // 累加词字符
            }
        }
        // 处理缓冲区中剩余的内容
        if (buf) segments.push({ type: inSpace ? 'space' : 'word', value: buf });
        
        // 提取所有词的数组，用于后续判断
        const words = segments.filter(s => s.type === 'word').map(s => s.value);
        
        // 遍历每个片段，根据规则决定是否换行
        let currentLine = ''; // 当前正在构建的行
        for (let i = 0; i < segments.length; i++) {
            const seg = segments[i];
            
            if (seg.type === 'word') {
                // 词片段：直接追加到当前行
                currentLine += seg.value;
            } else if (seg.type === 'space') {
                // 空格片段：根据规则决定是否换行
                
                // 计算当前空格前后的词索引
                const prevWordIdx = segments.slice(0, i).filter(s => s.type === 'word').length - 1;
                const nextWordIdx = prevWordIdx + 1;
                const prevWord = words[prevWordIdx] || '';
                const nextWord = words[nextWordIdx] || '';
                
                // 规则1：连续重复词处理
                // 如果下一个词与当前词相同，说明是重复序列，保留空格不换行
                if (nextWord && prevWord === nextWord) {
                    currentLine += seg.value;
                } 
                // 如果当前词是重复序列的最后一个，在其后换行
                else if (prevWordIdx >= 1 && words[prevWordIdx] === words[prevWordIdx - 1]) {
                    result.push(currentLine);
                    currentLine = '';
                } else {
                    // 规则2：非重复序列处理
                    // 规则2.1：英文句子间的空格不换行
                    const isPrevEnglish = /^[a-zA-Z]/.test(prevWord);
                    const isNextEnglish = /^[a-zA-Z]/.test(nextWord);
                    if (isPrevEnglish && isNextEnglish) {
                        // 连续英文单词，保留空格
                        currentLine += seg.value;
                    } else {
                        // 规则2.2：中文词，按字数判断
                        // 统计前一个词中的汉字数量
                        const prevLen = prevWord.replace(/[^\u4e00-\u9fff\u3400-\u4dbf]/g, '').length;
                        if (prevLen >= 3) {
                            // 3个及以上汉字，换行
                            result.push(currentLine);
                            currentLine = '';
                        } else {
                            // 少于3个汉字，保留空格
                            currentLine += seg.value;
                        }
                    }
                }
            }
        }
        
        // 处理当前行剩余的内容
        if (currentLine.trim()) {
            result.push(currentLine);
        }
    });
    
    // 过滤掉空行后返回结果
    return result.filter(l => l.trim());
}

// ============================================
// 主处理函数：处理歌词纠错请求
// 功能：解析 GitHub Issue，根据纠错类型执行相应处理，创建 PR
//
// 流程：
// 1. 获取 Issue 信息
// 2. 解析歌曲名称
// 3. 查找对应歌曲文件
// 4. 检测纠错类型（逐行/整首/插入）
// 5. 执行对应处理逻辑
// 6. 写入修改后的文件
// 7. 创建分支、提交、推送、创建 PR
// ============================================
function processLyricsCorrection() {
    // 获取当前 Issue 的完整信息
    const issue = getIssueInfo();

    // 从 Issue 内容中解析歌曲名称
    // 去除可能的星号标记并清理空白
    const songTitle = parseField(issue.body, '歌曲名称').replace(/\*+/g, '').trim();
    if (!songTitle) {
        // 未找到歌曲名称，添加错误评论并退出
        addComment(issue.number, '❌ 未找到歌曲名称');
        return;
    }

    // 在歌词目录中查找对应歌曲文件
    const song = findSongFile(songTitle);
    if (!song) {
        // 未找到歌曲文件，添加错误评论并退出
        addComment(issue.number, `❌ 未找到歌曲「${songTitle}」`);
        return;
    }

    // 构建歌曲文件的完整路径
    const filePath = path.join(__dirname, '..', 'lyrics', `${song.fileName}.js`);
    // 读取当前歌曲文件内容
    let content = fs.readFileSync(filePath, 'utf8');

    // 检测纠错类型（整首替换/插入行/逐行修改）
    const correctionType = detectCorrectionType(issue.body);
    
    // 根据纠错类型执行对应处理逻辑
    let result;
    switch (correctionType) {
        case 'full':
            // 整首替换模式
            result = processFullReplacement(content, issue.body, songTitle);
            break;
        case 'insert':
            // 插入行模式
            result = processInsertLine(content, issue.body, songTitle);
            break;
        default:
            // 默认：逐行修改模式
            result = processLineByLine(content, issue.body, songTitle);
    }

    // 处理失败，添加错误评论并退出
    if (!result.success) {
        addComment(issue.number, result.message);
        return;
    }

    // 将修改后的内容写入文件
    fs.writeFileSync(filePath, result.content, 'utf8');

    // 创建 Git 分支并提交更改
    const branchName = `fix/lyrics-${issue.number}`;
    createBranch(branchName);
    commitAndPush(branchName, result.commitMsg);
    // 创建 Pull Request
    createPR(result.prTitle, result.prBody, branchName, issue.number);
    // 在 Issue 中添加成功评论
    addComment(issue.number, result.comment);
}

// ============================================
// 检测纠错类型
// 功能：根据 Issue 内容判断用户请求的纠错类型
//
// 参数：
//   - body: Issue 的 body 内容
//
// 返回值：
//   - 'full': 整首替换
//   - 'insert': 插入行
//   - 'line': 逐行修改（默认）
// ============================================
function detectCorrectionType(body) {
    // 检测整首替换关键词
    if (body.includes('完整歌词') || body.includes('整首替换')) return 'full';
    // 检测插入行关键词
    if (body.includes('插入位置') || body.includes('在第') || body.includes('**位置：**')) return 'insert';
    // 默认为逐行修改
    return 'line';
}

// ============================================
// 整首替换处理函数
// 功能：将整首歌曲的歌词替换为用户提供的新歌词
//
// 参数：
//   - content: 当前歌曲文件的内容
//   - body: Issue 的 body 内容
//   - songTitle: 歌曲名称
//
// 返回值：
//   - 对象，包含 success、content、commitMsg、prTitle、prBody、comment 等字段
// ============================================
function processFullReplacement(content, body, songTitle) {
    // 尝试多种格式匹配用户提供的完整歌词
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
    
    // 未找到歌词内容，返回错误
    if (!fullLyrics) {
        return { success: false, message: '❌ 未找到完整歌词，请使用代码块(```)或##完整歌词标题提供歌词' };
    }

    // 繁体→简体转换（确保歌词统一为简体）
    fullLyrics = toSimplified(fullLyrics);

    // 解析歌词为段落 - 智能换行逻辑
    // 规则：超过3个相同字的连续重复，中间空格不视为换行
    const normalizedLyrics = fullLyrics.replace(/\r\n/g, '\n');
    
    // 先按段落分割（两个以上换行视为段落分隔）
    const rawParagraphs = normalizedLyrics.split(/\n{2,}/).filter(p => p.trim());
    
    // 存储解析后的歌词数组
    const lyricsArray = [];
    
    // 遍历每个段落，使用 pIdx 追踪段落索引
    rawParagraphs.forEach((para, pIdx) => {
        // 智能分割行：处理"等 等 等 等不到月圆"这种情况
        const lines = smartSplitLines(para);
        lines.forEach(line => {
            // 为每行歌词匹配粤拼
            const matched = matchJyutping(line.trim());
            // 过滤掉空格字符：空格保留在歌词文本中，但不作为独立的 chars/jp 元素
            const filtered = matched.filter(m => m.char !== ' ' && m.char !== '\t');
            // 保留所有字符，但符号的粤拼设为空字符串
            lyricsArray.push({
                chars: filtered.map(m => `"${m.char}"`).join(', '),
                jp: filtered.map(m => {
                    // 汉字、字母、数字保留粤拼，符号设为空字符串
                    if (/[\u4e00-\u9fff\u3400-\u4dbfa-zA-Z0-9]/.test(m.char)) {
                        return `"${m.jp}"`;
                    }
                    return `""`;
                }).join(', ')
            });
        });
        // 在段落之间添加段落分隔符（最后一个段落除外）
        if (pIdx < rawParagraphs.length - 1) {
            lyricsArray.push({ isBreak: true });
        }
    });

    // 构建新的歌词字符串
    const newLyricsStr = lyricsArray.map(item => {
        if (item.isBreak) return '            { paragraphBreak: true }';
        return `            { chars: [${item.chars}], jp: [${item.jp}] }`;
    }).join(',\n');

    // 替换原文件中的歌词部分
    const newContent = content.replace(
        /lyrics:\s*\[[\s\S]*\n\s*\](?=\s*};?)/,
        `lyrics: [\n${newLyricsStr}\n        ]`
    );

    // 检查替换是否成功
    if (newContent === content) {
        return { success: false, message: '❌ 替换歌词失败' };
    }

    // 统计歌词行数（不包括段落分隔符）
    const lineCount = lyricsArray.filter(i => !i.isBreak).length;

    // 返回成功结果
    return {
        success: true,
        content: newContent,
        commitMsg: `fix: 整首替换歌词《${songTitle}》`,
        prTitle: `fix: 整首替换歌词《${songTitle}》`,
        prBody: `## 整首歌词替换\\n\\n**歌曲：** ${songTitle}\\n**新歌词行数：** ${lineCount} 行`,
        comment: `✅ 已创建整首歌词替换的 Pull Request，共 ${lineCount} 行歌词。`
    };
}

// ============================================
// 插入行处理函数
// 功能：在指定位置插入新歌词行，支持多处插入
//
// 参数：
//   - content: 当前歌曲文件的内容
//   - body: Issue 的 body 内容
//   - songTitle: 歌曲名称
//
// 返回值：
//   - 对象，包含 success、content、commitMsg、prTitle、prBody、comment 等字段
// ============================================
function processInsertLine(content, body, songTitle) {
    // 解析多处插入（支持新格式：多处 **位置：** 和 **歌词：**）
    const insertions = [];
    
    // 新格式：多处 - **位置：** 第X行前/后 和 - **歌词：** XXX（支持代码块）
    const positionMatches = [...body.matchAll(/-\s*\*\*位置：\*\*\s*第\s*(\d+)\s*行\s*(前|后)/g)];
    
    if (positionMatches.length > 0) {
        // 处理多处插入
        for (let i = 0; i < positionMatches.length; i++) {
            // 解析行号
            const line = parseInt(positionMatches[i][1]);
            // 解析位置（前/后）
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
    
    // 未找到插入内容，返回错误
    if (insertions.length === 0) {
        return { success: false, message: '❌ 未找到要插入的歌词，请使用 **位置：** 第X行前/后 和 **歌词：** XXX 格式' };
    }
    
    // 处理所有插入（从后往前插入，避免行号变化）
    const sortedInsertions = [...insertions].sort((a, b) => b.line - a.line);
    let newContent = content;
    let totalInsertedLines = 0;
    
    // 遍历每个插入点进行处理
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
            // 为插入的歌词匹配粤拼
            const matched = matchJyutping(line.trim());
            // 空格保留在 chars 数组中，粤拼为空字符串
            // 前端渲染时会跳过空格字符，不为其创建显示列
            if (matched.length === 0) return null;
            return {
                chars: matched.map(m => `"${m.char}"`).join(', '),
                jp: matched.map(m => {
                    // 汉字、字母、数字保留粤拼，空格和符号设为空字符串
                    if (/[\u4e00-\u9fff\u3400-\u4dbfa-zA-Z0-9]/.test(m.char)) {
                        return `"${m.jp}"`;
                    }
                    return `""`;
                }).join(', ')
            };
        }).filter(Boolean); // 过滤掉 null 值
        
        // 将文件内容按行分割
        const lines = newContent.split('\n');
        // 行号计算与前端一致：每个segment算一行（按空格分割），从1开始
        let lineCount = 1;
        let insertIndex = -1;
        
        // 遍历文件行，找到插入位置
        for (let i = 0; i < lines.length; i++) {
            if (lines[i].includes('paragraphBreak')) {
                continue; // paragraphBreak 不算行
            }
            if (lines[i].includes('chars:') && lines[i].includes('jp:')) {
                if (lineCount === insertion.line) {
                    insertIndex = i;
                    if (insertion.position === 'after') {
                        // 找到当前行的结束位置（即包含 } 的行）
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
        
        // 未找到插入位置，返回错误
        if (insertIndex === -1) {
            return { success: false, message: `❌ 未找到第 ${insertion.line} 行歌词` };
        }
        
        // 构建插入内容
        const insertContent = insertArray.map(item => {
            if (item.isBreak) {
                return '            { paragraphBreak: true },';
            }
            return `            { chars: [${item.chars}], jp: [${item.jp}] },`;
        });
        
        // 确定插入索引
        const spliceIndex = insertion.position === 'before' ? insertIndex : insertIndex + 1;
        // 如果是 after 插入，检查目标行末尾是否有逗号，没有则补上（避免在数组末尾插入时语法错误）
        if (insertion.position === 'after' && insertIndex < lines.length) {
            const targetLine = lines[insertIndex].trimEnd();
            if (targetLine.endsWith('}') && !targetLine.endsWith('},')) {
                lines[insertIndex] = targetLine.slice(0, -1) + '},';
            }
        }
        // 插入新内容
        lines.splice(spliceIndex, 0, ...insertContent);
        newContent = lines.join('\n');
        totalInsertedLines += insertArray.length;
    }
    
    // 构建插入位置描述字符串
    const insertionsDesc = insertions.map(ins => `第${ins.line}行${ins.position === 'before' ? '前' : '后'}`).join('、');
    
    // 返回成功结果
    return {
        success: true,
        content: newContent,
        commitMsg: `fix: 插入歌词《${songTitle}》`,
        prTitle: `fix: 插入歌词《${songTitle}》`,
        prBody: `## 插入歌词\\n\\n**歌曲：** ${songTitle}\\n**插入位置：** ${insertionsDesc}\\n**插入行数：** ${totalInsertedLines} 行`,
        comment: `✅ 已创建插入歌词的 Pull Request，在 ${insertionsDesc} 插入 ${totalInsertedLines} 行歌词。`
    };
}

// ============================================
// 逐行修改处理函数
// 功能：根据用户提供的表格，逐行修改歌词
//
// 参数：
//   - content: 当前歌曲文件的内容
//   - body: Issue 的 body 内容
//   - songTitle: 歌曲名称
//
// 返回值：
//   - 对象，包含 success、content、commitMsg、prTitle、prBody、comment 等字段
// ============================================
function processLineByLine(content, body, songTitle) {
    // 解析 Issue 中的表格数据
    const rows = parseTable(body);
    if (rows.length === 0) {
        return { success: false, message: '❌ 未检测到纠错表格' };
    }
    
    let newContent = content;
    let appliedCount = 0;   // 成功应用的修改数
    let failedRows = [];    // 失败的行
    
    // 遍历表格中的每一行纠错请求
    for (const row of rows) {
        // 解析表格行：行号、原歌词、正确歌词
        const [lineNumStr, originalText, newText] = row;
        // 提取行号数字
        const lineNum = parseInt(lineNumStr.toString().replace(/[^0-9]/g, ''));
        
        // 验证行号有效性
        if (isNaN(lineNum) || !originalText || !newText) {
            failedRows.push(row);
            continue;
        }
        
        // 查找并替换歌词
        // 行号计算与前端一致：每个segment算一行（按空格分割），从1开始
        const lines = newContent.split('\n');
        let lineCount = 1;
        let targetIndex = -1;
        
        // 遍历文件行，找到目标行
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
        
        // 未找到目标行，记录失败
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
        
        // 提取当前行的歌词文本（去除引号和逗号）
        const currentChars = charsMatch[1].replace(/"/g, '').replace(/,\s*/g, '');
        
        // 繁体→简体转换
        const simplifiedOriginal = toSimplified(originalText.toString().trim());
        const simplifiedNew = toSimplified(newText.toString().trim());
        
        // 检查原歌词是否匹配（简体比较）
        // 支持两种模式：整行匹配 或 segment 匹配
        let isSegmentEdit = false;
        let segmentStart = -1;
        let segmentEnd = -1;
        
        if (currentChars === simplifiedOriginal) {
            // 整行匹配
            isSegmentEdit = false;
        } else if (currentChars.includes(simplifiedOriginal)) {
            // 可能是 segment 编辑：originalText 是某行的一部分
            segmentStart = currentChars.indexOf(simplifiedOriginal);
            segmentEnd = segmentStart + simplifiedOriginal.length;
            isSegmentEdit = true;
        } else {
            // 完全不匹配
            failedRows.push(row);
            continue;
        }
        
        // 替换歌词并重新匹配粤拼（使用简体）
        let finalText;
        if (isSegmentEdit) {
            // segment 编辑：只替换 segment 部分
            finalText = currentChars.substring(0, segmentStart) + simplifiedNew + currentChars.substring(segmentEnd);
        } else {
            // 整行编辑
            finalText = simplifiedNew;
        }
        const matched = matchJyutping(finalText);
        // 空格保留在 chars 数组中，粤拼为空字符串
        // 前端渲染时会跳过空格字符，不为其创建显示列
        const newChars = matched.map(m => `"${m.char}"`).join(', ');
        const newJp = matched.map(m => {
            // 汉字、字母、数字保留粤拼，空格和符号设为空字符串
            if (/[\u4e00-\u9fff\u3400-\u4dbfa-zA-Z0-9]/.test(m.char)) {
                return `"${m.jp}"`;
            }
            return `""`;
        }).join(', ');
        
        // 替换行内容：更新 chars 和 jp 数组
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
    
    // 没有任何修改成功，返回错误
    if (appliedCount === 0) {
        return { 
            success: false, 
            message: `❌ 未能应用任何纠错。请检查行号、原歌词是否正确。\n\n失败的行：\n${failedRows.map(r => r.join(' | ')).join('\n')}` 
        };
    }
    
    // 构建纠错表格字符串（用于 PR 描述）
    const correctionsTable = rows.map(r => `| ${r.join(' | ')} |`).join('\\n');
    
    // 返回成功结果
    return {
        success: true,
        content: newContent,
        commitMsg: `fix: 歌词纠错《${songTitle}》(${appliedCount}处)`,
        prTitle: `fix: 歌词纠错《${songTitle}》(${appliedCount}处)`,
        prBody: `## 歌词纠错\\n\\n**歌曲：** ${songTitle}\\n**修改数量：** ${appliedCount} 处\\n\\n| 行号 | 原歌词 | 正确歌词 |\\n|------|--------|----------|\\n${correctionsTable}`,
        comment: `✅ 已自动修改 ${appliedCount} 处歌词并创建 Pull Request。${failedRows.length > 0 ? `\\n\\n⚠️ 以下 ${failedRows.length} 处纠错未能自动应用：\\n${failedRows.map(r => `- ${r.join(' | ')}`).join('\\n')}` : ''}`
    };
}

// ============================================
// 模块导出
// 供其他脚本（如 process-issue.js）调用
// ============================================
module.exports = { processLyricsCorrection };
