// ============================================
// 处理 Issue 入口脚本
// 功能：根据 Issue 标签自动分发到对应的处理脚本
// 本脚本由 GitHub Actions 调用，是所有 Issue 处理的统一入口
// ============================================

// 引入工具函数
const {
    getIssueInfo,      // 获取 Issue 信息
    addComment,         // 添加 Issue 评论
} = require('./utils');

// ============================================
// 主函数
// 功能：根据 Issue 标签选择对应的处理脚本
// ============================================
async function main() {
    // 获取 Issue 信息
    const issue = getIssueInfo();
    const labels = issue.labels || [];

    console.log(`Processing Issue #${issue.number}: ${issue.title}`);
    console.log(`Labels: ${labels.join(', ')}`);

    // 根据标签分发到对应的处理脚本
    try {
        // 遍历标签，找到匹配的处理脚本
        for (const label of labels) {
            switch (label) {
                case '投稿-新歌':
                    // 处理新歌投稿
                    const { processNewSong } = require('./new-song');
                    processNewSong();
                    return;

                case '投稿-纠错':
                case '纠错':
                    // 处理歌词纠错
                    const { processLyricsCorrection } = require('./lyrics-correction');
                    processLyricsCorrection();
                    return;

                case '投稿-粤拼':
                    // 处理粤拼纠错
                    const { processJyutpingCorrection } = require('./jyutping-correction');
                    processJyutpingCorrection();
                    return;

                case '投稿-删除':
                    // 处理删除歌曲
                    const { processDeleteSong } = require('./delete-song');
                    processDeleteSong();
                    return;
            }
        }

        // 没有匹配到标签
        addComment(issue.number, `❌ 未识别的 Issue 类型。当前标签：${labels.join(', ') || '无'}`);
        console.log('No matching handler found for labels:', labels);

    } catch (error) {
        // 处理脚本执行出错
        console.error('Error processing issue:', error);
        addComment(issue.number, `❌ 处理过程中发生错误：${error.message}`);
    }
}

// 执行主函数
main();
