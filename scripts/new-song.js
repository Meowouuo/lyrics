// 处理新歌投稿：解析 Issue → 生成歌词文件 → 创建 PR

const fs = require('fs');
const path = require('path');
const {
    getIssueInfo,
    parseField,
    parseCodeBlock,
    getNextSongId,
    createBranch,
    commitAndPush,
    createPR,
    addComment,
    closeIssue,
    addLabel,
} = require('./utils');

// 加载粤拼字典和匹配函数
const dictContent = fs.readFileSync(path.join(__dirname, '..', 'jyutping-dict.js'), 'utf8');
eval(dictContent);

function processNewSong() {
    const issue = getIssueInfo();

    // 提取信息
    const title = parseField(issue.body, '歌曲名称');
    const artist = parseField(issue.body, '歌手');
    const lyricist = parseField(issue.body, '填词');
    const composer = parseField(issue.body, '作曲');
    const lyricsText = parseCodeBlock(issue.body);

    if (!title || !artist) {
        addComment(issue.number, '❌ 投稿信息不完整，请确保填写了**歌曲名称**和**歌手**。');
        return;
    }
    if (!lyricsText) {
        addComment(issue.number, '❌ 未检测到歌词内容，请在代码块（\`\`\`）中粘贴完整歌词。');
        return;
    }

    // 生成粤拼
    const paragraphs = lyricsText.replace(/\r\n/g, '\n').split(/\n{2,}/);
    const lyrics = [];
    let previewLines = [];

    paragraphs.forEach((para) => {
        const lines = para.split('\n').filter(l => l.trim());
        lines.forEach((line) => {
            const matched = matchJyutping(line.trim());
            lyrics.push({
                chars: matched.map(m => m.char),
                jp: matched.map(m => m.jp),
            });
            // 收集预览行（前5行）
            if (previewLines.length < 5) {
                previewLines.push({
                    text: matched.map(m => m.char).join(''),
                    jp: matched.map(m => m.jp || '?').join(' '),
                });
            }
        });
        if (lines.length > 0) {
            lyrics.push({ paragraphBreak: true });
        }
    });
    // 移除最后一个多余的段落分隔
    if (lyrics.length > 0 && lyrics[lyrics.length - 1].paragraphBreak) {
        lyrics.pop();
    }

    // 生成歌曲 ID
    const songId = getNextSongId();

    // 匹配标题、歌手、填词、作曲的粤拼
    const titleJyutping = matchJyutping(title).map(m => m.jp);
    const artistJyutping = matchJyutping(artist).map(m => m.jp);
    const lyricistJyutping = lyricist ? matchJyutping(lyricist).map(m => m.jp) : [];
    const composerJyutping = composer ? matchJyutping(composer).map(m => m.jp) : [];

    // 生成歌词文件内容
    const lyricsStr = lyrics.map(line => {
        if (line.paragraphBreak) return '            { paragraphBreak: true }';
        return '            { chars: ' + JSON.stringify(line.chars) + ', jp: ' + JSON.stringify(line.jp) + ' }';
    }).join(',\n');

    const fileContent = `// 歌曲：${title}

(function() {
    const song = {
        id: ${songId},
        title: "${title}",
        titleJyutping: ${JSON.stringify(titleJyutping)},
        artist: "${artist}",
        artistJyutping: ${JSON.stringify(artistJyutping)},
        lyricist: "${lyricist}",
        lyricistJyutping: ${JSON.stringify(lyricistJyutping)},
        composer: "${composer}",
        composerJyutping: ${JSON.stringify(composerJyutping)},
        lyrics: [
${lyricsStr}
        ]
    };
    if (typeof window !== 'undefined' && window.__songs) {
        window.__songs.push(song);
    }
})();
`;

    // 写入歌词文件
    const fileName = `${title}.js`;
    const filePath = path.join(__dirname, '..', 'lyrics', fileName);
    fs.writeFileSync(filePath, fileContent, 'utf8');

    // 更新 songFiles.js
    const songFilesPath = path.join(__dirname, '..', 'songFiles.js');
    let songFilesContent = fs.readFileSync(songFilesPath, 'utf8');
    const newEntry = `    'lyrics/${fileName}',`;
    // 在数组末尾的 ]; 之前插入
    songFilesContent = songFilesContent.replace(/(\];)/, `${newEntry}\n$1`);
    fs.writeFileSync(songFilesPath, songFilesContent, 'utf8');

    // 创建分支、提交、PR
    const branchName = `new-song/${issue.number}-${title.replace(/[^a-zA-Z0-9\u4e00-\u9fff]/g, '-')}`;
    createBranch(branchName);

    const commitMsg = `feat: 新增歌曲《${title}》- ${artist}`;
    commitAndPush(branchName, commitMsg);

    // 生成 PR 描述
    const previewMarkdown = previewLines.map(l =>
        `| ${l.text} | ${l.jp} |`
    ).join('\n');

    const prBody = `## 新歌投稿 #${issue.number}

**歌曲：** ${title}
**歌手：** ${artist}
**填词：** ${lyricist || '未知'}
**作曲：** ${composer || '未知'}

### 歌词预览（前5行，请审核粤拼）

| 歌词 | 粤拼 |
|------|------|
${previewMarkdown}

> ⚠️ 请审核粤拼是否正确，确认无误后合并。
`;

    const prTitle = `feat: 新增歌曲《${title}》- ${artist}`;
    createPR(prTitle, prBody, branchName);

    // 在 Issue 中评论
    addComment(issue.number, `✅ 已自动生成歌曲文件并创建 [Pull Request](${prTitle})。

**歌曲：** ${title} - ${artist}

请等待管理员审核合并。`);

    addLabel(issue.number, '🤖 已处理');
}

module.exports = { processNewSong };
