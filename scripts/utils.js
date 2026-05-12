// 工具函数：Issue 解析和 PR 创建

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// 从文件读取 Issue 信息（避免环境变量多行内容丢失）
function getIssueInfo() {
    return {
        title: fs.readFileSync('/tmp/issue_title.txt', 'utf8').trim(),
        body: fs.readFileSync('/tmp/issue_body.txt', 'utf8').trim(),
        number: fs.readFileSync('/tmp/issue_number.txt', 'utf8').trim(),
        labels: fs.readFileSync('/tmp/issue_labels.txt', 'utf8').trim().split(',').map(l => l.trim()).filter(l => l),
    };
}

// 从 Issue body 中提取 Markdown 表格为二维数组
function parseTable(body, header1, header2) {
    const lines = body.split('\n');
    let inTable = false;
    const rows = [];

    for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed.startsWith('|') && trimmed.endsWith('|')) {
            const cells = trimmed.split('|').slice(1, -1).map(c => c.trim());
            // 跳过分隔行
            if (cells.every(c => /^[-:]+$/.test(c))) continue;
            // 检查是否是表头
            if (!inTable) {
                inTable = true;
                continue; // 跳过表头
            }
            rows.push(cells);
        } else {
            if (inTable) break; // 表格结束
        }
    }
    return rows;
}

// 从 Issue body 中提取代码块内容
function parseCodeBlock(body) {
    const match = body.match(/```[\w]*\n([\s\S]*?)```/);
    return match ? match[1].trim() : '';
}

// 从 Issue body 中提取字段
function parseField(body, fieldName) {
    const patterns = [
        new RegExp(`\\*\\*${fieldName}\\*\\*[:：]\\s*(.+)`),
        new RegExp(`${fieldName}[:：]\\s*(.+)`),
    ];
    for (const pattern of patterns) {
        const match = body.match(pattern);
        if (match) return match[1].trim();
    }
    return '';
}

// 获取所有歌曲列表
function getAllSongs() {
    const songFilesContent = fs.readFileSync(path.join(__dirname, '..', 'songFiles.js'), 'utf8');
    const songs = [];
    // 匹配每个歌词文件
    const filePattern = /'lyrics\/(.+?)\.js'/g;
    let match;
    while ((match = filePattern.exec(songFilesContent)) !== null) {
        const fileName = match[1];
        const filePath = path.join(__dirname, '..', 'lyrics', `${fileName}.js`);
        if (fs.existsSync(filePath)) {
            const content = fs.readFileSync(filePath, 'utf8');
            const song = parseSongFile(content);
            if (song) {
                song.fileName = fileName;
                songs.push(song);
            }
        }
    }
    return songs;
}

// 解析歌曲文件，提取歌曲信息
function parseSongFile(content) {
    const titleMatch = content.match(/title:\s*"([^"]+)"/);
    const artistMatch = content.match(/artist:\s*"([^"]+)"/);
    const idMatch = content.match(/id:\s*(\d+)/);
    if (!titleMatch || !artistMatch) return null;
    return {
        id: parseInt(idMatch?.[1] || '0'),
        title: titleMatch[1],
        artist: artistMatch[1],
    };
}

// 获取下一个可用的歌曲 ID
function getNextSongId() {
    const songs = getAllSongs();
    let maxId = 0;
    songs.forEach(s => { if (s.id > maxId) maxId = s.id; });
    return maxId + 1;
}

// 根据歌曲名称和歌手查找歌曲文件
function findSongFile(title, artist) {
    const songs = getAllSongs();
    return songs.find(s =>
        s.title === title || (artist && s.artist === artist)
    );
}

// 创建 Git 分支
function createBranch(branchName) {
    execSync(`git config user.name "github-actions[bot]"`, { stdio: 'pipe' });
    execSync(`git config user.email "github-actions[bot]@users.noreply.github.com"`, { stdio: 'pipe' });
    execSync(`git checkout -b ${branchName}`, { stdio: 'pipe' });
}

// 提交并推送
function commitAndPush(branchName, message) {
    execSync('git add -A', { stdio: 'pipe' });
    execSync(`git commit -m "${message}"`, { stdio: 'pipe' });
    execSync(`git push origin ${branchName}`, { stdio: 'pipe' });
}

// 创建 Pull Request
function createPR(title, body, branchName) {
    const tmpFile = '/tmp/pr_body.md';
    fs.writeFileSync(tmpFile, body, 'utf8');
    execSync(
        `gh pr create --title "${title}" --body-file "${tmpFile}" --base main --head ${branchName}`,
        { stdio: 'pipe' }
    );
}

// 在 Issue 中添加评论
function addComment(issueNumber, body) {
    const tmpFile = '/tmp/comment_body.md';
    fs.writeFileSync(tmpFile, body, 'utf8');
    execSync(
        `gh issue comment ${issueNumber} --body-file "${tmpFile}"`,
        { stdio: 'pipe' }
    );
}

// 关闭 Issue
function closeIssue(issueNumber) {
    execSync(`gh issue close ${issueNumber}`, { stdio: 'pipe' });
}

// 给 Issue 添加标签
function addLabel(issueNumber, label) {
    execSync(`gh issue edit ${issueNumber} --add-label "${label}"`, { stdio: 'pipe' });
}

module.exports = {
    getIssueInfo,
    parseTable,
    parseCodeBlock,
    parseField,
    getAllSongs,
    parseSongFile,
    getNextSongId,
    findSongFile,
    createBranch,
    commitAndPush,
    createPR,
    addComment,
    closeIssue,
    addLabel,
};
