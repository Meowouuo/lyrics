// 处理歌词纠错：解析 Issue → 修改歌词文件 → 创建 PR

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

function processLyricsCorrection() {
    const issue = getIssueInfo();

    const songTitle = parseField(issue.body, '歌曲名称');
    if (!songTitle) {
        addComment(issue.number, '❌ 未找到歌曲名称，请确保填写了**歌曲名称**。');
        return;
    }

    const song = findSongFile(songTitle);
    if (!song) {
        addComment(issue.number, `❌ 未找到歌曲「${songTitle}」，请确认歌曲名称是否正确。`);
        return;
    }

    const rows = parseTable(issue.body);
    if (rows.length === 0) {
        addComment(issue.number, '❌ 未检测到纠错表格，请使用模板中的表格格式。');
        return;
    }

    const filePath = path.join(__dirname, '..', 'lyrics', `${song.fileName}.js`);
    let content = fs.readFileSync(filePath, 'utf8');

    let appliedCount = 0;
    let failedRows = [];

    for (const row of rows) {
        // 表格格式：行号 | 原歌词 | 正确歌词
        const lineNumStr = row[0]?.replace(/第|行/g, '') || '';
        const lineNum = parseInt(lineNumStr) - 1;
        const originalText = row[1] || '';
        const newText = row[2] || '';

        if (isNaN(lineNum) || !newText) {
            failedRows.push(row);
            continue;
        }

        // 查找对应的歌词行
        const lines = content.split('\n');
        let lyricsLineIndex = -1;
        let charCount = 0;

        for (let i = 0; i < lines.length; i++) {
            if (lines[i].includes('paragraphBreak')) continue;
            if (lines[i].includes('chars:') && lines[i].includes('jp:')) {
                if (charCount === lineNum) {
                    lyricsLineIndex = i;
                    break;
                }
                charCount++;
            }
        }

        if (lyricsLineIndex === -1) {
            failedRows.push(row);
            continue;
        }

        // 替换歌词文字（保持粤拼音节数一致）
        const line = lines[lyricsLineIndex];
        const charsArrayMatch = line.match(/chars:\s*\[([^\]]+)\]/);
        const jpArrayMatch = line.match(/jp:\s*\[([^\]]+)\]/);
        if (!charsArrayMatch || !jpArrayMatch) {
            failedRows.push(row);
            continue;
        }

        const charsArray = charsArrayMatch[1].split(',').map(c => c.trim().replace(/"/g, ''));
        const jpArray = jpArrayMatch[1].split(',').map(j => j.trim().replace(/"/g, ''));

        // 将原歌词文字转为字符数组
        const originalChars = [...originalText];
        const newChars = [...newText];

        // 找到原歌词在 chars 数组中的位置
        let startPos = -1;
        for (let i = 0; i <= charsArray.length - originalChars.length; i++) {
            let match = true;
            for (let k = 0; k < originalChars.length; k++) {
                if (charsArray[i + k] !== originalChars[k]) {
                    match = false;
                    break;
                }
            }
            if (match) {
                startPos = i;
                break;
            }
        }

        if (startPos === -1) {
            failedRows.push(row);
            continue;
        }

        // 替换字符
        if (newChars.length === originalChars.length) {
            // 长度相同，直接替换
            for (let k = 0; k < newChars.length; k++) {
                charsArray[startPos + k] = newChars[k];
            }
        } else {
            // 长度不同，替换并调整 jp 数组
            // 移除旧字符和对应的 jp
            charsArray.splice(startPos, originalChars.length, ...newChars);
            jpArray.splice(startPos, originalChars.length, ...newChars.map(() => ''));
        }

        const newCharsStr = charsArray.map(c => `"${c}"`).join(', ');
        const newJpStr = jpArray.map(j => `"${j}"`).join(', ');
        lines[lyricsLineIndex] = line
            .replace(/chars:\s*\[[^\]]+\]/, `chars: [${newCharsStr}]`)
            .replace(/jp:\s*\[[^\]]+\]/, `jp: [${newJpStr}]`);

        appliedCount++;
    }

    if (appliedCount === 0) {
        addComment(issue.number, `❌ 未能应用任何歌词修改。请检查行号和歌词内容是否正确。`);
        return;
    }

    fs.writeFileSync(filePath, lines.join('\n'), 'utf8');

    const branchName = `fix/lyrics-${issue.number}`;
    createBranch(branchName);

    const commitMsg = `fix: 歌词纠错《${songTitle}》(${appliedCount}处)`;
    commitAndPush(branchName, commitMsg);

    const prBody = `## 歌词纠错 #${issue.number}

**歌曲：** ${songTitle}
**修改数量：** ${appliedCount} 处

| 行号 | 原歌词 | 正确歌词 |
|------|--------|----------|
${rows.filter(r => !failedRows.includes(r)).map(r => `| ${r.join(' | ')} |`).join('\n')}

> ⚠️ 请审核修改是否正确，**合并后需要手动补充被修改歌词的粤拼**。
`;

    const prTitle = `fix: 歌词纠错《${songTitle}》(${appliedCount}处)`;
    createPR(prTitle, prBody, branchName);

    addComment(issue.number, `✅ 已自动修改 ${appliedCount} 处歌词并创建 [Pull Request](${prTitle})。

⚠️ 注意：被修改的歌词行的粤拼已被清空，合并后需要手动补充正确的粤拼。`);

}

module.exports = { processLyricsCorrection };
