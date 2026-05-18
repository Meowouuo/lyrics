// ============================================
// 处理删除歌曲
// 功能：解析 GitHub Issue → 删除歌词文件 → 创建 Pull Request
// 本脚本由 GitHub Actions 调用，自动处理用户提交的删除歌曲请求
// ============================================

// 引入 Node.js 内置模块
const fs = require('fs');      // 文件系统模块，用于删除歌词文件
const path = require('path');  // 路径处理模块

// 从 utils.js 引入工具函数
const {
    getIssueInfo,      // 获取 Issue 信息
    getAllSongs,       // 获取所有歌曲列表
    createBranch,      // 创建 Git 分支
    commitAndPush,     // 提交并推送更改
    createPR,          // 创建 Pull Request
    addComment,         // 添加 Issue 评论
} = require('./utils');

// ============================================
// 解析歌曲列表
// 功能：从 Issue body 中解析要删除的歌曲列表
// 支持两种格式：
//   1. 编号列表：1. **歌名** - 歌手（ID: X）
//   2. Markdown 表格
//
// 参数：
//   - body: Issue 正文内容
//
// 返回值：歌曲信息数组 [{ title, artist, id }]
// ============================================
function parseSongList(body) {
    const songs = [];

    // 尝试解析编号列表格式
    // 格式：1. **歌名** - 歌手（ID: X）
    const lines = body.split('\n');
    for (const line of lines) {
        const match = line.match(/^\d+\.\s*\*\*(.+?)\*\*\s*-\s*(.+?)(?:\s*（ID:\s*(\d+)）)?$/);
        if (match) {
            songs.push({
                title: match[1].trim(),    // 歌曲名称
                artist: match[2].trim(),  // 歌手
                id: match[3] ? parseInt(match[3]) : null,  // ID（可选）
            });
        }
    }

    // 如果编号列表没解析到，尝试解析表格
    if (songs.length === 0) {
        const { parseTable } = require('./utils');
        const rows = parseTable(body);
        for (const row of rows) {
            // 合并所有单元格文本
            const fullText = row.join(' ');
            // 匹配歌名（粗体格式）
            const titleMatch = fullText.match(/\*\*(.+?)\*\*/);
            if (titleMatch) {
                songs.push({ title: titleMatch[1].trim(), artist: '', id: null });
            }
        }
    }

    return songs;
}

// ============================================
// 主处理函数：处理删除歌曲请求
// 功能：解析 Issue，删除歌曲文件，创建 PR
//
// 流程：
// 1. 获取 Issue 信息
// 2. 解析要删除的歌曲列表
// 3. 查找匹配的歌曲文件
// 4. 删除歌词文件
// 5. 创建分支、提交、推送、创建 PR
// ============================================
function processDeleteSong() {
    // 获取当前 Issue 的完整信息
    const issue = getIssueInfo();

    // 解析要删除的歌曲列表
    const songList = parseSongList(issue.body);
    if (songList.length === 0) {
        // 未检测到歌曲列表，添加错误评论并退出
        addComment(issue.number, '❌ 未检测到要删除的歌曲列表，请使用正确的格式。');
        return;
    }

    // 获取所有歌曲
    const allSongs = getAllSongs();
    let deletedFiles = [];  // 成功找到的歌曲
    let notFound = [];      // 未找到的歌曲

    // 遍历用户请求删除的歌曲
    for (const item of songList) {
        // 尝试匹配歌曲（按歌名匹配）
        const song = allSongs.find(s => s.title === item.title);
        if (song) {
            // 找到匹配的歌曲
            deletedFiles.push(song);
        } else {
            // 未找到
            notFound.push(item.title);
        }
    }

    // 没有任何歌曲找到
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

    // 创建 Git 分支并提交更改
    const branchName = `delete/${issue.number}`;
    createBranch(branchName);

    // 构建歌曲名称列表
    const songNames = deletedFiles.map(s => `《${s.title}》`).join('、');
    const commitMsg = `chore: 删除歌曲 ${songNames}`;
    commitAndPush(branchName, commitMsg);

    // 构建 PR 描述
    const prBody = `## 删除歌曲 #${issue.number}

**删除数量：** ${deletedFiles.length} 首

${deletedFiles.map(s => `- ~~**${s.title}** - ${s.artist}~~`).join('\n')}

${notFound.length > 0 ? `\n### ⚠️ 未找到的歌曲\n${notFound.map(n => `- ${n}`).join('\n')}\n` : ''}
> ⚠️ 请确认删除无误后合并。
`;

    const prTitle = `chore: 删除 ${deletedFiles.length} 首歌曲`;
    createPR(prTitle, prBody, branchName, issue.number);

    // 在 Issue 中添加成功评论
    addComment(issue.number, `✅ 已自动删除 ${deletedFiles.length} 首歌曲并创建 [Pull Request](${prTitle})。

删除的歌曲：
${deletedFiles.map(s => `- 《${s.title}》- ${s.artist}`).join('\n')}
${notFound.length > 0 ? `\n⚠️ 以下歌曲未找到：${notFound.join(', ')}` : ''}

请等待管理员审核合并。`);
}

// 导出模块，供其他脚本（如 process-issue.js）调用
module.exports = { processDeleteSong };
