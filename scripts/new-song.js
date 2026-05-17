// 处理新歌投稿：解析 Issue → 生成歌词文件 → 创建 PR

const fs = require('fs');
// 智能分割歌词行
// 规则1：连续重复词（如"等 等 等"），中间空格保留不换行，重复序列之后的空格换行
// 规则2：非重复序列，空格前的词字数 >= 3 则换行，< 3 则保留空格不换行
// 规则3：空格保留，不消除；空格不匹配粤拼
function smartSplitLines(text) {
    const rawLines = text.split('\n').filter(l => l.trim());
    const result = [];
    
    rawLines.forEach(line => {
        // 按空格分割为词和空格的数组
        const segments = [];
        let buf = '';
        let inSpace = false;
        for (const ch of line) {
            if (/\s/.test(ch)) {
                if (!inSpace) {
                    if (buf) segments.push({ type: 'word', value: buf });
                    buf = '';
                    inSpace = true;
                }
                buf += ch;
            } else {
                if (inSpace) {
                    if (buf) segments.push({ type: 'space', value: buf });
                    buf = '';
                    inSpace = false;
                }
                buf += ch;
            }
        }
        if (buf) segments.push({ type: inSpace ? 'space' : 'word', value: buf });
        
        // 提取词的数组
        const words = segments.filter(s => s.type === 'word').map(s => s.value);
        
        // 对每个空格位置，判断是否换行
        let currentLine = '';
        for (let i = 0; i < segments.length; i++) {
            const seg = segments[i];
            
            if (seg.type === 'word') {
                currentLine += seg.value;
            } else if (seg.type === 'space') {
                const prevWordIdx = segments.slice(0, i).filter(s => s.type === 'word').length - 1;
                const nextWordIdx = prevWordIdx + 1;
                const prevWord = words[prevWordIdx] || '';
                const nextWord = words[nextWordIdx] || '';
                
                // 规则1：连续重复词
                if (nextWord && prevWord === nextWord) {
                    // 连续重复，空格保留不换行
                    currentLine += seg.value;
                } else if (prevWordIdx >= 1 && words[prevWordIdx] === words[prevWordIdx - 1]) {
                    // 在连续重复序列之后，换行
                    result.push(currentLine);
                    currentLine = '';
                } else {
                    // 规则2：非重复序列
                    // 规则2.1：英文句子间的空格不换行
                    const isPrevEnglish = /^[a-zA-Z]/.test(prevWord);
                    const isNextEnglish = /^[a-zA-Z]/.test(nextWord);
                    if (isPrevEnglish && isNextEnglish) {
                        // 英文单词之间的空格，保留不换行
                        currentLine += seg.value;
                    } else {
                        // 规则2.2：中文词，按字数判断
                        const prevLen = prevWord.replace(/[^\u4e00-\u9fff\u3400-\u4dbf]/g, '').length;
                        if (prevLen >= 3) {
                            result.push(currentLine);
                            currentLine = '';
                        } else {
                            currentLine += seg.value;
                        }
                    }
                }
            }
        }
        
        if (currentLine.trim()) {
            result.push(currentLine);
        }
    });
    
    return result.filter(l => l.trim());
}


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
} = require('./utils');

// 加载粤拼字典和匹配函数
const dictContent = fs.readFileSync(path.join(__dirname, '..', 'jyutping-dict.js'), 'utf8');
eval(dictContent);
const { toSimplified } = require('./t2s-converter');

function processNewSong() {
    const issue = getIssueInfo();

    // 提取信息（清理 markdown 格式符号）
    const title = toSimplified(parseField(issue.body, '歌曲名称').replace(/\*+/g, '').trim());
    const artist = toSimplified(parseField(issue.body, '歌手').replace(/\*+/g, '').trim());
    const lyricist = toSimplified(parseField(issue.body, '填词').replace(/\*+/g, '').trim());
    const composer = toSimplified(parseField(issue.body, '作曲').replace(/\*+/g, '').trim());
    const lyricsText = parseCodeBlock(issue.body);

    if (!title || !artist) {
        addComment(issue.number, '❌ 投稿信息不完整，请确保填写了**歌曲名称**和**歌手**。');
        return;
    }
    if (!lyricsText) {
        addComment(issue.number, '❌ 未检测到歌词内容，请在代码块（\`\`\`）中粘贴完整歌词。');
        return;
    }

    // 繁体→简体转换
    const simplifiedLyrics = toSimplified(lyricsText);

    // 生成粤拼
    const paragraphs = simplifiedLyrics.replace(/\r\n/g, '\n').split(/\n{2,}/);
    const lyrics = [];
    let previewLines = [];

    paragraphs.forEach((para) => {
        const lines = smartSplitLines(para);
        lines.forEach((line) => {
            const matched = matchJyutping(line.trim());
            // 过滤掉空格字符：空格保留在歌词文本中，但不作为独立的 chars/jp 元素
            // 这样前端显示时不会为空格创建单独的列
            const filtered = matched.filter(m => m.char !== ' ' && m.char !== '\t');
            lyrics.push({
                chars: filtered.map(m => m.char),
                jp: filtered.map(m => m.jp),
            });
            // 收集预览行（前5行）
            if (previewLines.length < 5) {
                previewLines.push({
                    text: matched.map(m => m.char).join(''),
                    jp: matched.map(m => m.jp).filter(jp => jp !== '').join(' '),
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
    const songId = issue.number;

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

    // 不再手动修改 songFiles.js，由 generate-song-list.yml 自动生成

    // 创建分支、提交、PR
    const branchName = `new-song/${issue.number}-${title.replace(/\*+/g, '').replace(/[^a-zA-Z0-9\u4e00-\u9fff]/g, '-')}`;
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
    createPR(prTitle, prBody, branchName, issue.number);

    // 在 Issue 中评论
    addComment(issue.number, `✅ 已自动生成歌曲文件并创建 [Pull Request](${prTitle})。

**歌曲：** ${title} - ${artist}

请等待管理员审核合并。`);

}

module.exports = { processNewSong };
