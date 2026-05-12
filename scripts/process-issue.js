// 主入口：根据 Issue 标签分发到对应的处理模块

const { getIssueInfo, addComment } = require('./utils');

function main() {
    const issue = getIssueInfo();
    console.log(`Processing Issue #${issue.number}: ${issue.title}`);
    console.log(`Labels: ${issue.labels.join(', ')}`);

    try {
        // 根据标签分发
        if (issue.labels.includes('投稿')) {
            console.log('→ Type: New Song');
            const { processNewSong } = require('./new-song');
            processNewSong();
        } else if (issue.labels.includes('纠错')) {
            // 区分粤拼纠错和歌词纠错
            if (issue.title.includes('粤拼')) {
                console.log('→ Type: Jyutping Correction');
                const { processJyutpingCorrection } = require('./jyutping-correction');
                processJyutpingCorrection();
            } else {
                console.log('→ Type: Lyrics Correction');
                const { processLyricsCorrection } = require('./lyrics-correction');
                processLyricsCorrection();
            }
        } else if (issue.labels.includes('歌词纠错')) {
            console.log('→ Type: Lyrics Correction');
            const { processLyricsCorrection } = require('./lyrics-correction');
            processLyricsCorrection();
        } else if (issue.labels.includes('删除')) {
            console.log('→ Type: Delete Song');
            const { processDeleteSong } = require('./delete-song');
            processDeleteSong();
        } else {
            console.log('→ Unknown type, skipping');
            addComment(issue.number, 'ℹ️ 此 Issue 没有匹配的自动化标签（投稿/纠错/歌词纠错/删除），已跳过自动处理。');
        }

        console.log('Done!');
    } catch (error) {
        console.error('Error:', error.message);
        addComment(issue.number, `❌ 自动处理失败：\n\n\`\`\`\n${error.message}\n\`\`\`\n\n请手动处理。`);
    }
}

main();
