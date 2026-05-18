// ============================================
// 处理新歌投稿
// 功能：解析 GitHub Issue → 生成歌词文件 → 创建 Pull Request
// 本脚本由 GitHub Actions 调用，自动处理用户提交的新歌投稿请求
// ============================================

// 引入 Node.js 内置模块
const fs = require('fs');      // 文件系统模块，用于读取和写入文件
const path = require('path');  // 路径处理模块

// 从 utils.js 引入工具函数
const {
    getIssueInfo,      // 获取 Issue 信息
    parseField,       // 解析字段值
    parseCodeBlock,   // 解析代码块
    getNextSongId,    // 获取下一个歌曲 ID
    createBranch,      // 创建 Git 分支
    commitAndPush,     // 提交并推送更改
    createPR,          // 创建 Pull Request
    addComment,         // 添加 Issue 评论
    closeIssue,         // 关闭 Issue
    matchJyutping,     // 粤拼匹配函数
} = require('./utils');

// 加载繁简转换工具
const { toSimplified } = require('./t2s-converter');

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
// 主处理函数：处理新歌投稿请求
// 功能：解析 Issue，生成歌词文件，创建 PR
//
// 流程：
// 1. 获取 Issue 信息
// 2. 解析歌曲信息（歌名、歌手、填词、作曲）
// 3. 解析歌词内容
// 4. 繁体→简体转换
// 5. 生成粤拼
// 6. 生成歌词 JS 文件
// 7. 创建分支、提交、推送、创建 PR
// ============================================
function processNewSong() {
    // 获取当前 Issue 的完整信息
    const issue = getIssueInfo();

    // 提取信息（清理 markdown 格式符号）并转换为简体
    const title = toSimplified(parseField(issue.body, '歌曲名称').replace(/\*+/g, '').trim());
    const artist = toSimplified(parseField(issue.body, '歌手').replace(/\*+/g, '').trim());
    const lyricist = toSimplified(parseField(issue.body, '填词').replace(/\*+/g, '').trim());
    const composer = toSimplified(parseField(issue.body, '作曲').replace(/\*+/g, '').trim());
    const lyricsText = parseCodeBlock(issue.body);

    // 验证必填字段
    if (!title || !artist) {
        addComment(issue.number, '❌ 投稿信息不完整，请确保填写了**歌曲名称**和**歌手**。');
        return;
    }
    if (!lyricsText) {
        addComment(issue.number, '❌ 未检测到歌词内容，请在代码块（` ` `）中粘贴完整歌词。');
        return;
    }

    // 繁体→简体转换
    const simplifiedLyrics = toSimplified(lyricsText);

    // 生成粤拼
    const paragraphs = simplifiedLyrics.replace(/\r\n/g, '\n').split(/\n{2,}/);
    const lyrics = [];
    let previewLines = [];

    // 遍历每个段落
    paragraphs.forEach((para) => {
        // 智能分割行
        const lines = smartSplitLines(para);
        lines.forEach((line) => {
            // 为歌词匹配粤拼
            const matched = matchJyutping(line.trim());
            // 空格保留在 chars 数组中，粤拼为空字符串
            // 前端渲染时会跳过空格字符
            lyrics.push({
                chars: matched.map(m => m.char),
                jp: matched.map(m => m.jp),
            });
            // 收集预览行（前5行）
            if (previewLines.length < 5) {
                previewLines.push({
                    text: matched.map(m => m.char).join(''),
                    jp: matched.map(m => m.jp).filter(jp => jp !== '').join(' '),
                });
            }
        });
        // 添加段落分隔
        if (lines.length > 0) {
            lyrics.push({ paragraphBreak: true });
        }
    });

    // 移除最后一个多余的段落分隔
    if (lyrics.length > 0 && lyrics[lyrics.length - 1].paragraphBreak) {
        lyrics.pop();
    }

    // 生成歌曲 ID（使用 Issue 编号）
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

    // 构建完整的 JS 文件内容
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

    // 创建 Git 分支并提交更改
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

// 导出模块，供其他脚本调用
module.exports = { processNewSong };
