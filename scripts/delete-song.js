// 处理删除歌曲：解析 Issue → 删除文件 → 创建 PR

const fs = require('fs');
const path = require('path');
const {
    getIssueInfo,
    parseTable,
    getAllSongs,
    createBranch,
    commitAndPush,
    createPR,
    addComment,
    addLabel,
} = require('./utils');

function processDeleteSong() {
    const issue = getIssueInfo();

    // 解析要删除的歌曲列表
    const rows = parseTable(issue.body);
    if (rows.length === 0) {
        // 尝试从标题中提取
        addComment(issue.number, '❌ 未检测到要删除的歌曲列表，请使用模板中的格式。');
        return;
    }

    const allSongs = getAllSongs();
    let deletedFiles = [];
    let notFound = [];

    for (const row of rows) {
        // 格式：序号. **歌曲名称** - 歌手（ID: X）
        const fullText = row.join(' ');
        const titleMatch = fullText.match(/\*\*(.+?)\*\*/);
        const title = titleMatch ? titleMatch[1] : row[0];

        const song = allSongs.find(s => s.title === title);
        if (song) {
            deletedFiles.push(song);
        } else {
            notFound.push(title);
        }
    }

    if (deletedFiles.length === 0) {
        addComment(issue.number, `❌ 未找到任何匹配的歌曲。\n\n未找到：${notFound.join(', ')}`);
        return;
    }

    // 删除歌词文件
    for (const song of deletedFiles) {
        const filePath = path.join(__dirname, '..', 'lyrics', `${song.fileName}.js`);
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }
    }

    // 更新 songFiles.js
    const songFilesPath = path.join(__dirname, '..', 'songFiles.js');
    let songFilesContent = fs.readFileSync(songFilesPath, 'utf8');
    for (const song of deletedFiles) {
        songFilesContent = songFilesContent.replace(
            new RegExp(`\\s*'lyrics/${song.fileName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\.js',?`),
            ''
        );
    }
    fs.writeFileSync(songFilesPath, songFilesContent, 'utf8');

    // 创建分支、提交、PR
    const branchName = `delete/${issue.number}`;
    createBranch(branchName);

    const songNames = deletedFiles.map(s => `《${s.title}》`).join('、');
    const commitMsg = `chore: 删除歌曲 ${songNames}`;
    commitAndPush(branchName, commitMsg);

    const prBody = `## 删除歌曲 #${issue.number}

**删除数量：** ${deletedFiles.length} 首

${deletedFiles.map(s => `- ~~**${s.title}** - ${s.artist}~~`).join('\n')}

${notFound.length > 0 ? `\n### ⚠️ 未找到的歌曲\n${notFound.map(n => `- ${n}`).join('\n')}\n` : ''}
> ⚠️ 请确认删除无误后合并。
`;

    const prTitle = `chore: 删除 ${deletedFiles.length} 首歌曲`;
    createPR(prTitle, prBody, branchName);

    addComment(issue.number, `✅ 已自动删除 ${deletedFiles.length} 首歌曲并创建 [Pull Request](${prTitle})。

删除的歌曲：
${deletedFiles.map(s => `- 《${s.title}》- ${s.artist}`).join('\n')}

${notFound.length > 0 ? `\n⚠️ 以下歌曲未找到：${notFound.join(', ')}` : ''}

请等待管理员审核合并。`);

    addLabel(issue.number, '🤖 已处理');
}

module.exports = { processDeleteSong };
