// ============================================
// 处理 Issue 入口脚本
// 功能：根据 Issue 标签自动分发到对应的处理脚本
// 本脚本由 GitHub Actions 调用，是所有 Issue 处理的统一入口
// 设计模式：使用标签路由，每个标签对应一个处理模块
// ============================================

// 引入工具函数
const {
    getIssueInfo,      // 获取 Issue 信息（编号、标题、正文、标签等）
    addComment,         // 在 Issue 中添加评论（用于反馈处理结果或错误信息）
} = require('./utils');

// ============================================
// 主函数
// 功能：根据 Issue 标签选择对应的处理脚本
// 路由规则：
//   - 投稿-新歌 → new-song.js
//   - 投稿-纠错 / 纠错 → lyrics-correction.js
//   - 投稿-粤拼 → jyutping-correction.js
//   - 投稿-删除 → delete-song.js
// ============================================
async function main() {
    // 获取当前 Issue 的完整信息
    const issue = getIssueInfo();
    // 获取 Issue 的标签列表（可能为空数组）
    const labels = issue.labels || [];

    // 打印日志，便于在 GitHub Actions 中查看处理进度
    console.log(`Processing Issue #${issue.number}: ${issue.title}`);
    console.log(`Labels: ${labels.join(', ')}`);

    // 根据标签分发到对应的处理脚本
    try {
        // 遍历所有标签，找到第一个匹配的处理脚本
        // 使用 switch 语句实现标签到处理函数的映射
        for (const label of labels) {
            switch (label) {
                case '投稿-新歌':
                    // 处理新歌投稿请求
                    // 动态加载 new-song 模块并调用处理函数
                    const { processNewSong } = require('./new-song');
                    processNewSong();
                    return;  // 处理完成，退出函数

                case '投稿-纠错':
                case '纠错':
                case '歌词纠错':
                    // 处理歌词纠错请求（兼容两种标签名）
                    // 动态加载 lyrics-correction 模块并调用处理函数
                    const { processLyricsCorrection } = require('./lyrics-correction');
                    processLyricsCorrection();
                    return;  // 处理完成，退出函数

                case '投稿-粤拼':
                    // 处理粤拼纠错请求
                    // 动态加载 jyutping-correction 模块并调用处理函数
                    const { processJyutpingCorrection } = require('./jyutping-correction');
                    processJyutpingCorrection();
                    return;  // 处理完成，退出函数

                case '投稿-删除':
                    // 处理删除歌曲请求
                    // 动态加载 delete-song 模块并调用处理函数
                    const { processDeleteSong } = require('./delete-song');
                    processDeleteSong();
                    return;  // 处理完成，退出函数
            }
        }

        // 遍历完所有标签仍未匹配到处理脚本
        // 说明 Issue 标签不正确或缺少必要标签
        addComment(issue.number, `❌ 未识别的 Issue 类型。当前标签：${labels.join(', ') || '无'}`);
        console.log('No matching handler found for labels:', labels);

    } catch (error) {
        // 捕获处理脚本执行过程中的异常
        // 可能原因：模块加载失败、处理函数内部错误等
        console.error('Error processing issue:', error);
        // 在 Issue 中添加错误评论，通知用户处理失败
        addComment(issue.number, `❌ 处理过程中发生错误：${error.message}`);
    }
}

// 执行主函数，启动 Issue 处理流程
main();
