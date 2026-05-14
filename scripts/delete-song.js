// 处理删除歌曲：解析 Issue → 删除文件 → 创建 PR

const fs = require('fs');
const path = require('path');
const {
    getIssueInfo,
    getAllSongs,
    createBranch,
    commitAndPush,
    createPR,
    addComment,
} = require('./utils');

// 从 Issue body 中解析歌曲列表
// 支持两种格式：
// 1. 编号列表：1. **歌名** - 歌手（ID: X）
// 2. Markdown 表格
function parseSongList(body) {
    const songs = [];

    // 尝试解析编号列表格式
    const lines = body.split('\n');
    for (const line of lines) {
        const match = line.match(/^\d+\.\s*\*\*(.+?)\*\*\s*-\s*(.+?)(?:\s*（ID:\s*(\d+)）)?$/);
        if (match) {
            songs.push({
                title: match[1].trim(),
                artist: match[2].trim(),
                id: match[3] ? parseInt(match[3]) : null,
            });
        }
    }

    // 如果编号列表没解析到，尝试解析表格
    if (songs.length === 0) {
        const { parseTable } = require('./utils');
        const rows = parseTable(body);
        for (const row of rows) {
            const fullText = row.join(' ');
            const titleMatch = fullText.match(/\*\*(.+?)\*\*/);
            if (titleMatch) {
                songs.push({ title: titleMatch[1].trim(), artist: '', id: null });
            }
        }
    }

    return songs;
}

function processDeleteSong() {
    const issue = getIssueInfo();

    // 解析要删除的歌曲列表
    const songList = parseSongList(issue.body);
    if (songList.length === 0) {
        addComment(issue.number, '❌ 未检测到要删除的歌曲列表，请使用正确的格式。');
        return;
    }

    const allSongs = getAllSongs();
    let deletedFiles = [];
    let notFound = [];

    for (const item of songList) {
        const song = allSongs.find(s => s.title === item.title);
        if (song) {
            deletedFiles.push(song);
        } else {
            notFound.push(item.title);
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

    // 不再手动修改 songFiles.js，由 generate-song-list.yml 自动生成

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
}

module.exports = { processDeleteSong };
