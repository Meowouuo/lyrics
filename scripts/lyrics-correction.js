// ============================================
// 歌词纠错处理模块
// 功能：处理用户通过 Issue 提交的歌词纠错请求
// ============================================

const { toSimplified, countSegments } = require('./t2s-converter');
const { matchJyutping } = require('./utils');

// ============================================
// 解析表格数据
// 功能：从 Issue body 中提取纠错表格
//
// 参数：
//   - body: Issue 的 body 内容
//
// 返回值：二维数组，每行包含 [行号, 原歌词, 正确歌词]
// ============================================
function parseTable(body) {
    const rows = [];
    const lines = body.split('\n');
    
    for (const line of lines) {
        // 匹配表格行：| 第X行 | 原歌词 | 正确歌词 |
        const match = line.match(/\|\s*第?(\d+)行?\s*\|\s*([^|]+)\|\s*([^|]+)\|/);
        if (match) {
            const [, lineNum, original, corrected] = match;
            rows.push([lineNum.trim(), original.trim(), corrected.trim()]);
        }
    }
    
    return rows;
}

// ============================================
// 逐行纠错处理
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
                // 计算这行歌词有多少个segment
                const charsMatch = lines[i].match(/chars:\s*\[([^\]]+)\]/);
                let segments = 1;
                if (charsMatch) {
                    const chars = charsMatch[1].match(/"([^"]*)"/g) || [];
                    const charsArray = chars.map(c => c.replace(/"/g, ''));
                    segments = countSegments(charsArray);
                }
                
                // 检查目标行号是否在当前行的segment范围内
                if (lineNum >= lineCount && lineNum < lineCount + segments) {
                    targetIndex = i;
                    break;
                }
                
                lineCount += segments;
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
        
        // 提取当前行的歌词文本（去除引号和逗号，但保留字符之间的空格）
        const currentChars = charsMatch[1].replace(/"/g, '').replace(/,/g, '');
        
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
        let newChars, newJp;
        if (isSegmentEdit) {
            // segment 编辑：只替换 segment 部分，保留其他字符的粤拼
            const jpMatch = line.match(/jp:\s*\[([^\]]+)\]/);
            if (!jpMatch) {
                failedRows.push(row);
                continue;
            }
            const originalJp = jpMatch[1].match(/"([^"]*)"/g) || [];
            
            // 找到 segment 在 chars 数组中的起始和结束索引
            let charPos = 0;
            let arrayStart = -1, arrayEnd = -1;
            const charsArray = charsMatch[1].match(/"([^"]*)"/g) || [];
            for (let i = 0; i < charsArray.length; i++) {
                const char = charsArray[i].replace(/"/g, '');
                if (charPos === segmentStart && arrayStart === -1) {
                    arrayStart = i;
                }
                if (charPos < segmentEnd) {
                    arrayEnd = i;
                }
                charPos += char.length;
            }
            
            if (arrayStart === -1 || arrayEnd === -1) {
                // 回退到整行重新匹配
                const finalText = currentChars.substring(0, segmentStart) + simplifiedNew + currentChars.substring(segmentEnd);
                const matched = matchJyutping(finalText);
                newChars = matched.map(m => `"${m.char}"`).join(', ');
                newJp = matched.map(m => /[\u4e00-\u9fff\u3400-\u4dbfa-zA-Z0-9]/.test(m.char) ? `"${m.jp}"` : `""`).join(', ');
            } else {
                // 只替换 segment 部分，重新匹配新文本的粤拼
                const matched = matchJyutping(simplifiedNew);
                const newSegmentChars = matched.map(m => `"${m.char}"`);
                const newSegmentJp = matched.map(m => /[\u4e00-\u9fff\u3400-\u4dbfa-zA-Z0-9]/.test(m.char) ? `"${m.jp}"` : `""`);
                
                // 构建新的 chars 和 jp 数组
                const beforeChars = charsArray.slice(0, arrayStart);
                const beforeJp = originalJp.slice(0, arrayStart);
                const afterChars = charsArray.slice(arrayEnd + 1);
                const afterJp = originalJp.slice(arrayEnd + 1);
                
                newChars = [...beforeChars, ...newSegmentChars, ...afterChars].join(', ');
                newJp = [...beforeJp, ...newSegmentJp, ...afterJp].join(', ');
            }
        } else {
            // 整行编辑：重新匹配整行粤拼
            const matched = matchJyutping(simplifiedNew);
            newChars = matched.map(m => `"${m.char}"`).join(', ');
            newJp = matched.map(m => /[\u4e00-\u9fff\u3400-\u4dbfa-zA-Z0-9]/.test(m.char) ? `"${m.jp}"` : `""`).join(', ');
        }
        
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
    const correctionsTable = rows.map(r => `| ${r.join(' | ')} |`).join('\n');
    
    return {
        success: true,
        content: newContent,
        commitMsg: `fix: 歌词纠错 (${appliedCount}处)`,
        prTitle: `[歌词纠错] ${songTitle}（${appliedCount}处）`,
        prBody: `## 纠错内容\n\n**歌曲名称：** ${songTitle}\n\n### 纠错详情\n\n| 行号 | 原歌词 | 正确歌词 |\n|------|--------|----------|\n${correctionsTable}`,
        comment: `✅ 已成功应用 ${appliedCount} 处歌词纠错。\n\n${failedRows.length > 0 ? `以下行未能应用（请检查行号、原歌词是否正确）：\n${failedRows.map(r => `- 第${r[0]}行: ${r[1]} → ${r[2]}`).join('\n')}` : ''}`
    };
}


// ============================================
// 主处理函数：处理歌词纠错请求
// 功能：解析 Issue，修改对应歌词，创建 PR
//
// 流程：
// 1. 获取 Issue 信息
// 2. 解析歌曲名称
// 3. 查找对应歌曲文件
// 4. 调用 processLineByLine 修改歌词
// 5. 创建分支、提交、推送、创建 PR
// ============================================
function processLyricsCorrection() {
    const fs = require('fs');
    const path = require('path');
    
    const {
        getIssueInfo,
        parseField,
        findSongFile,
        createBranch,
        commitAndPush,
        createPR,
        addComment,
    } = require('./utils');
    
    // 获取当前 Issue 的完整信息
    const issue = getIssueInfo();
    
    // 从 Issue 正文中提取歌曲名称字段
    const songTitle = parseField(issue.body, '歌曲名称').trim();
    if (!songTitle) {
        addComment(issue.number, '❌ 未找到歌曲名称，请确保填写了**歌曲名称**。');
        return;
    }
    
    // 根据歌曲名称在歌词库中查找对应的歌曲文件
    const song = findSongFile(songTitle);
    if (!song) {
        addComment(issue.number, `❌ 未找到歌曲「${songTitle}」，请确认歌曲名称是否正确。`);
        return;
    }
    
    // 构建歌词文件的完整路径并读取内容
    const filePath = path.join(__dirname, '..', 'lyrics', `${song.fileName}.js`);
    let content = fs.readFileSync(filePath, 'utf8');
    
    // 调用 processLineByLine 处理歌词纠错
    const result = processLineByLine(content, issue.body, songTitle);
    
    if (!result.success) {
        addComment(issue.number, result.message);
        return;
    }
    
    // 将修改后的内容写回歌词文件
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

module.exports = {
    processLyricsCorrection,
    processLineByLine,
    parseTable
};
