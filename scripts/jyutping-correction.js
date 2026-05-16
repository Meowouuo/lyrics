// 处理粤拼纠错：解析 Issue → 修改歌词文件 → 创建 PR

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

function processJyutpingCorrection() {
    const issue = getIssueInfo();

    // 提取歌曲名称
    const songTitle = parseField(issue.body, '歌曲名称');
    if (!songTitle) {
        addComment(issue.number, '❌ 未找到歌曲名称，请确保填写了**歌曲名称**。');
        return;
    }

    // 查找歌曲文件
    const song = findSongFile(songTitle);
    if (!song) {
        addComment(issue.number, `❌ 未找到歌曲「${songTitle}」，请确认歌曲名称是否正确。`);
        return;
    }

    // 解析纠错表格
    const rows = parseTable(issue.body);
    if (rows.length === 0) {
        addComment(issue.number, '❌ 未检测到纠错表格，请使用模板中的表格格式。');
        return;
    }

    // 读取歌词文件
    const filePath = path.join(__dirname, '..', 'lyrics', `${song.fileName}.js`);
    let content = fs.readFileSync(filePath, 'utf8');

    // 应用纠错
    let appliedCount = 0;
    let failedRows = [];

    for (const row of rows) {
        // 表格格式：行号 | 字 | 原粤拼 | 正确粤拼
        const lineNumStr = row[0]?.replace(/第|行/g, '') || '';
        const lineNum = parseInt(lineNumStr) - 1; // 转为 0-based
        const char = row[1] || '';
        const originalJp = row[2] || '';
        const newJp = row[3] || '';

        if (isNaN(lineNum) || !newJp) {
            failedRows.push(row);
            continue;
        }

        // 在文件中查找对应的行并替换粤拼
        // 查找包含原粤拼的 lyrics 行
        const lines = content.split('\n');
        let lyricsLineIndex = -1;
        let charCount = 0;

        for (let i = 0; i < lines.length; i++) {
            if (lines[i].includes('paragraphBreak')) {
                continue;
            }
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

        // 替换粤拼
        const line = lines[lyricsLineIndex];
        const jpArrayMatch = line.match(/jp:\s*\[([^\]]+)\]/);
        if (!jpArrayMatch) {
            failedRows.push(row);
            continue;
        }

        const jpArray = jpArrayMatch[1].split(',').map(j => j.trim().replace(/"/g, ''));
        const charsArrayMatch = line.match(/chars:\s*\[([^\]]+)\]/);
        const charsArray = charsArrayMatch ? charsArrayMatch[1].split(',').map(c => c.trim().replace(/"/g, '')) : [];

        // 找到需要修改的字的位置
        let modified = false;
        if (char) {
            // 按字匹配
            for (let i = 0; i < charsArray.length; i++) {
                if (charsArray[i] === char && jpArray[i] === originalJp) {
                    jpArray[i] = newJp;
                    modified = true;
                    break;
                }
            }
        } else {
            // 按原粤拼匹配（整行替换第一个匹配的）
            const idx = jpArray.indexOf(originalJp);
            if (idx > -1) {
                jpArray[idx] = newJp;
                modified = true;
            }
        }

        if (modified) {
            const newJpStr = jpArray.map(j => `"${j}"`).join(', ');
            lines[lyricsLineIndex] = line.replace(
                /jp:\s*\[[^\]]+\]/,
                `jp: [${newJpStr}]`
            );
            appliedCount++;
        } else {
            failedRows.push(row);
        }
    }

    if (appliedCount === 0) {
        addComment(issue.number, `❌ 未能应用任何纠错。请检查行号、字和粤拼是否正确。\n\n失败的行：\n${failedRows.map(r => r.join(' | ')).join('\n')}`);
        return;
    }

    // 写入修改后的文件
    fs.writeFileSync(filePath, lines.join('\n'), 'utf8');

    // 创建分支、提交、PR
    const branchName = `fix/jyutping-${issue.number}`;
    createBranch(branchName);

    const commitMsg = `fix: 粤拼纠错《${songTitle}》(${appliedCount}处)`;
    commitAndPush(branchName, commitMsg);

    const prBody = `## 粤拼纠错 #${issue.number}

**歌曲：** ${songTitle}
**修改数量：** ${appliedCount} 处

| 行号 | 字 | 原粤拼 | 正确粤拼 |
|------|-----|--------|----------|
${rows.filter(r => !failedRows.includes(r)).map(r => `| ${r.join(' | ')} |`).join('\n')}

${failedRows.length > 0 ? `\n### ⚠️ 未能应用的纠错\n${failedRows.map(r => `| ${r.join(' | ')} |`).join('\n')}\n` : ''}
> ⚠️ 请审核修改是否正确，确认无误后合并。
`;

    const prTitle = `fix: 粤拼纠错《${songTitle}》(${appliedCount}处)`;
    createPR(prTitle, prBody, branchName, issue.number);

    addComment(issue.number, `✅ 已自动修改 ${appliedCount} 处粤拼并创建 [Pull Request](${prTitle})。

${failedRows.length > 0 ? `\n⚠️ 以下 ${failedRows.length} 处纠错未能自动应用，请手动处理：\n${failedRows.map(r => `- ${r.join(' | ')}`).join('\n')}` : ''}

请等待管理员审核合并。`);

}

module.exports = { processJyutpingCorrection };
