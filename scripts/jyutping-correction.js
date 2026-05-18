// ============================================
// 处理粤拼纠错
// 功能：解析 GitHub Issue → 修改歌词文件的粤拼发音 → 创建 Pull Request
// 粤拼纠错指用户发现某个字的粤拼读音标注错误，需要修正
// 本脚本由 GitHub Actions 调用，自动处理用户提交的粤拼纠错请求
// ============================================

// 引入 Node.js 内置模块
const fs = require('fs');      // 文件系统模块，用于读写歌词文件
const path = require('path');  // 路径处理模块

// 从 utils.js 引入工具函数
const {
    getIssueInfo,    // 获取 Issue 信息
    parseField,      // 解析字段值
    parseTable,       // 解析表格数据
    findSongFile,    // 查找歌曲文件
    createBranch,    // 创建 Git 分支
    commitAndPush,   // 提交并推送更改
    createPR,        // 创建 Pull Request
    addComment,       // 添加 Issue 评论
} = require('./utils');

// 加载繁简转换和分段计数工具
const { toSimplified, countSegments } = require('./t2s-converter');

// ============================================
// 主处理函数：处理粤拼纠错请求
// 功能：解析 Issue，修改对应歌词的粤拼，创建 PR
//
// 流程：
// 1. 获取 Issue 信息
// 2. 解析歌曲名称
// 3. 查找对应歌曲文件
// 4. 解析粤拼纠错表格（行号、字、原粤拼、正确粤拼）
// 5. 修改歌词文件中的粤拼
// 6. 创建分支、提交、推送、创建 PR
// ============================================
function processJyutpingCorrection() {
    // 获取当前 Issue 的完整信息
    const issue = getIssueInfo();

    // 提取歌曲名称
    const songTitle = parseField(issue.body, '歌曲名称').trim();
    if (!songTitle) {
        // 未找到歌曲名称，添加错误评论并退出
        addComment(issue.number, '❌ 未找到歌曲名称，请确保填写了**歌曲名称**。');
        return;
    }

    // 查找歌曲文件
    const song = findSongFile(songTitle);
    if (!song) {
        // 未找到歌曲文件，添加错误评论并退出
        addComment(issue.number, `❌ 未找到歌曲「${songTitle}」，请确认歌曲名称是否正确。`);
        return;
    }

    // 解析粤拼纠错表格
    const rows = parseTable(issue.body);
    if (rows.length === 0) {
        // 未检测到表格，添加错误评论并退出
        addComment(issue.number, '❌ 未检测到纠错表格，请使用模板中的表格格式。');
        return;
    }

    // 读取歌词文件
    const filePath = path.join(__dirname, '..', 'lyrics', `${song.fileName}.js`);
    let content = fs.readFileSync(filePath, 'utf8');

    // 应用粤拼纠错
    let appliedCount = 0;      // 成功应用的纠错数
    let failedRows = [];       // 失败的行

    // 遍历表格中的每一行纠错请求
    for (const row of rows) {
        // 表格格式：行号 | 字 | 原粤拼 | 正确粤拼
        // 解析各列数据
        const lineNumStr = row[0]?.replace(/第|行/g, '') || '';
        const lineNum = parseInt(lineNumStr) - 1; // 转为 0-based 索引
        const char = row[1] || '';
        const originalJp = row[2] || '';
        const newJp = row[3] || '';

        // 验证数据有效性
        if (isNaN(lineNum) || !newJp) {
            failedRows.push(row);
            continue;
        }

        // 在文件中查找对应的行并替换粤拼
        // 行号计算与前端一致：每个 segment 算一行（按空格分割）
        let lines = content.split('\n');
        let lyricsLineIndex = -1;  // 歌词行在文件中的索引
        let lineCount = 0;          // 当前遍历到的行号

        // 遍历文件行，找到目标行
        for (let i = 0; i < lines.length; i++) {
            // 跳过段落分隔符
            if (lines[i].includes('paragraphBreak')) {
                continue;
            }
            // 跳过非歌词行
            if (lines[i].includes('chars:') && lines[i].includes('jp:')) {
                // 如果是目标行，记录索引
                if (lineCount === lineNum) {
                    lyricsLineIndex = i;
                    break;
                }
                // 计算这行歌词有多少个 segment
                // 书名号和括号内的空格不分割
                const charsMatch = lines[i].match(/chars:\s*\[([^\]]+)\]/);
                if (charsMatch) {
                    // 提取字符数组
                    const chars = charsMatch[1].match(/"([^"]*)"/g) || [];
                    const charsArray = chars.map(c => c.replace(/"/g, ''));
                    // 累加 segment 数量
                    lineCount += countSegments(charsArray);
                } else {
                    lineCount++;
                }
            }
        }

        // 未找到目标行，记录失败
        if (lyricsLineIndex === -1) {
            failedRows.push(row);
            continue;
        }

        // 替换粤拼
        const line = lines[lyricsLineIndex];
        // 提取 jp 数组
        const jpArrayMatch = line.match(/jp:\s*\[([^\]]+)\]/);
        if (!jpArrayMatch) {
            failedRows.push(row);
            continue;
        }

        // 解析 jp 数组和 chars 数组
        const jpArray = jpArrayMatch[1].split(',').map(j => j.trim().replace(/"/g, ''));
        const charsArrayMatch = line.match(/chars:\s*\[([^\]]+)\]/);
        const charsArray = charsArrayMatch ? charsArrayMatch[1].split(',').map(c => c.trim().replace(/"/g, '')) : [];

        // 找到需要修改的字的位置
        // 繁体→简体转换，确保与文件中的简体字匹配
        const simplifiedChar = char ? toSimplified(char) : null;
        let modified = false;

        if (simplifiedChar) {
            // 方式1：按字匹配（优先）
            for (let i = 0; i < charsArray.length; i++) {
                if (charsArray[i] === simplifiedChar && jpArray[i] === originalJp) {
                    // 找到匹配的字和粤拼，替换
                    jpArray[i] = newJp;
                    modified = true;
                    break;
                }
            }
        } else {
            // 方式2：按原粤拼匹配（整行替换第一个匹配的）
            const idx = jpArray.indexOf(originalJp);
            if (idx > -1) {
                jpArray[idx] = newJp;
                modified = true;
            }
        }

        // 更新文件内容
        if (modified) {
            // 构建新的 jp 字符串
            const newJpStr = jpArray.map(j => `"${j}"`).join(', ');
            // 替换 jp 数组
            lines[lyricsLineIndex] = line.replace(
                /jp:\s*\[[^\]]+\]/,
                `jp: [${newJpStr}]`
            );
            // 更新文件内容
            content = lines.join('\n');
            appliedCount++;
        } else {
            // 未找到匹配的粤拼
            failedRows.push(row);
        }
    }

    // 没有任何修改成功，返回错误
    if (appliedCount === 0) {
        addComment(issue.number, `❌ 未能应用任何纠错。请检查行号、字和粤拼是否正确。\n\n失败的行：\n${failedRows.map(r => r.join(' | ')).join('\n')}`);
        return;
    }

    // 将修改后的内容写入文件
    fs.writeFileSync(filePath, content, 'utf8');

    // 创建 Git 分支并提交更改
    const branchName = `fix/jyutping-${issue.number}`;
    createBranch(branchName);

    // 提交信息
    const commitMsg = `fix: 粤拼纠错《${songTitle}》(${appliedCount}处)`;
    commitAndPush(branchName, commitMsg);

    // 构建 PR 描述
    const prBody = `## 粤拼纠错 #${issue.number}

**歌曲：** ${songTitle}
**修改数量：** ${appliedCount} 处

| 行号 | 字 | 原粤拼 | 正确粤拼 |
|------|-----|--------|----------|
${rows.filter(r => !failedRows.includes(r)).map(r => `| ${r.join(' | ')} |`).join('\n')}

${failedRows.length > 0 ? `\n### ⚠️ 未能应用的纠错\n${failedRows.map(r => `| ${r.join(' | ')} |`).join('\n')}\n` : ''}
> ⚠️ 请审核修改是否正确，确认无误后合并。
`;

    const prTitle = `fix: 粤拼纠错《${songTitle}》(${appliedCount}处)`;
    createPR(prTitle, prBody, branchName, issueNumber);

    // 在 Issue 中添加成功评论
    addComment(issue.number, `✅ 已自动修改 ${appliedCount} 处粤拼并创建 [Pull Request](${prTitle})。

${failedRows.length > 0 ? `\n⚠️ 以下 ${failedRows.length} 处纠错未能自动应用，请手动处理：\n${failedRows.map(r => `- ${r.join(' | ')}`).join('\n')}` : ''}

请等待管理员审核合并。`);

}

// 导出模块，供其他脚本（如 process-issue.js）调用
module.exports = { processJyutpingCorrection };
