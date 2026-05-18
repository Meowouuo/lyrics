// ============================================
// 处理粤拼纠错
// 功能：解析 GitHub Issue → 修改歌词文件的粤拼发音 → 创建 Pull Request
// 粤拼纠错指用户发现某个字的粤拼读音标注错误，需要修正
// 本脚本由 GitHub Actions 调用，自动处理用户提交的粤拼纠错请求
// ============================================

// 引入 Node.js 内置模块
const fs = require('fs');      // 文件系统模块，用于读写歌词文件
const path = require('path');  // 路径处理模块，用于拼接文件路径

// 从 utils.js 引入工具函数
const {
    getIssueInfo,    // 获取 Issue 信息（标题、正文、标签等）
    parseField,      // 解析 Issue 正文中的字段值（如"歌曲名称: xxx"）
    parseTable,       // 解析 Issue 正文中的 Markdown 表格
    findSongFile,    // 根据歌曲名称查找对应的歌词文件
    createBranch,    // 创建 Git 分支（用于提交修改）
    commitAndPush,   // 提交更改并推送到远程仓库
    createPR,        // 创建 Pull Request
    addComment,       // 在 Issue 中添加评论（反馈处理结果）
} = require('./utils');

// 加载繁简转换和分段计数工具
// toSimplified: 将繁体中文转为简体（用于字符匹配）
// countSegments: 计算一行歌词包含的 segment 数量（用于行号计算）
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
    // 获取当前 Issue 的完整信息（从环境变量或 GitHub API）
    const issue = getIssueInfo();

    // 从 Issue 正文中提取歌曲名称字段
    // parseField 会查找 "歌曲名称:" 后面的内容
    const songTitle = parseField(issue.body, '歌曲名称').trim();
    if (!songTitle) {
        // 未找到歌曲名称字段，无法继续处理
        // 添加错误评论提示用户补充信息
        addComment(issue.number, '❌ 未找到歌曲名称，请确保填写了**歌曲名称**。');
        return;  // 提前退出
    }

    // 根据歌曲名称在歌词库中查找对应的歌曲文件
    // findSongFile 会搜索 lyrics 目录下的所有歌曲
    const song = findSongFile(songTitle);
    if (!song) {
        // 未找到匹配的歌曲文件，可能是名称有误
        addComment(issue.number, `❌ 未找到歌曲「${songTitle}」，请确认歌曲名称是否正确。`);
        return;  // 提前退出
    }

    // 从 Issue 正文中解析纠错表格
    // 表格格式：| 行号 | 字 | 原粤拼 | 正确粤拼 |
    const rows = parseTable(issue.body);
    if (rows.length === 0) {
        // 未检测到有效的表格数据
        addComment(issue.number, '❌ 未检测到纠错表格，请使用模板中的表格格式。');
        return;  // 提前退出
    }

    // 构建歌词文件的完整路径并读取内容
    // 歌词文件位于 lyrics/ 目录下，格式为 {fileName}.js
    const filePath = path.join(__dirname, '..', 'lyrics', `${song.fileName}.js`);
    let content = fs.readFileSync(filePath, 'utf8');

    // 应用粤拼纠错
    let appliedCount = 0;      // 成功应用的纠错计数器
    let failedRows = [];       // 记录失败的纠错行（用于错误反馈）

    // 遍历表格中的每一行纠错请求
    for (const row of rows) {
        // 表格格式：行号 | 字 | 原粤拼 | 正确粤拼
        // 解析各列数据
        const lineNumStr = row[0]?.replace(/第|行/g, '') || '';  // 去除"第"和"行"字
        const lineNum = parseInt(lineNumStr) - 1; // 转为 0-based 索引（用户输入从 1 开始）
        const char = row[1] || '';        // 需要纠错的字符
        const originalJp = row[2] || '';  // 原来的（错误的）粤拼
        const newJp = row[3] || '';       // 正确的粤拼

        // 验证数据有效性：行号必须是有效数字，新粤拼不能为空
        // 缺少任一必要字段都无法执行纠错
        if (isNaN(lineNum) || !newJp) {
            failedRows.push(row);  // 数据无效，记录为失败
            continue;              // 跳过该行，继续处理下一行
        }

        // 在文件中查找对应的行并替换粤拼
        // 行号计算规则与前端一致：每个 segment 算一行（按空格分割）
        // 需要将用户填写的逻辑行号映射到文件中的物理行号
        let lines = content.split('\n');  // 将文件内容按换行符拆分为数组
        let lyricsLineIndex = -1;  // 目标歌词行在文件中的物理行索引（-1 表示未找到）
        let lineCount = 0;          // 逻辑行号计数器（与用户看到的行号对应）

        // 遍历文件的所有行，找到目标逻辑行号对应的物理行
        for (let i = 0; i < lines.length; i++) {
            // 跳过段落分隔符（paragraphBreak 是段落标记，不计入行号）
            if (lines[i].includes('paragraphBreak')) {
                continue;
            }
            // 检查当前行是否是歌词数据行（同时包含 chars 和 jp 字段）
            if (lines[i].includes('chars:') && lines[i].includes('jp:')) {
                // 如果逻辑行号计数器等于目标行号，说明找到了目标行
                if (lineCount === lineNum) {
                    lyricsLineIndex = i;  // 记录物理行索引
                    break;                // 找到后立即退出循环
                }
                // 计算当前歌词行包含多少个 segment（用于逻辑行号累加）
                // 书名号《》和括号内的空格不作为 segment 分割依据
                const charsMatch = lines[i].match(/chars:\s*\[([^\]]+)\]/);
                if (charsMatch) {
                    // 使用正则提取 chars 数组中的所有带引号的字符
                    const chars = charsMatch[1].match(/"([^"]*)"/g) || [];
                    // 去除引号，得到纯字符数组
                    const charsArray = chars.map(c => c.replace(/"/g, ''));
                    // 调用 countSegments 计算 segment 数量并累加
                    // 一行歌词可能包含多个 segment（如主歌+副歌合并行）
                    lineCount += countSegments(charsArray);
                } else {
                    // 无法解析 chars 数组时，保守地按一行计算
                    lineCount++;
                }
            }
        }

        // 检查是否成功找到目标行
        if (lyricsLineIndex === -1) {
            // 未找到目标行，可能原因：行号超出范围、文件格式异常
            failedRows.push(row);  // 记录为失败
            continue;              // 跳过该行
        }

        // 已找到目标行，开始提取和替换粤拼数据
        const line = lines[lyricsLineIndex];
        // 使用正则表达式提取 jp 数组的内容部分（方括号内的字符串）
        const jpArrayMatch = line.match(/jp:\s*\[([^\]]+)\]/);
        if (!jpArrayMatch) {
            // 无法提取 jp 数组，说明该行格式异常，记录为失败
            failedRows.push(row);
            continue;  // 跳过该行
        }

        // 解析 jp 数组：将逗号分隔的字符串拆分为粤拼数组
        // 每个元素去除首尾空格和引号，得到纯净的粤拼字符串
        const jpArray = jpArrayMatch[1].split(',').map(j => j.trim().replace(/"/g, ''));
        // 同时解析 chars 数组，用于后续按字符位置精确匹配
        const charsArrayMatch = line.match(/chars:\s*\[([^\]]+)\]/);
        const charsArray = charsArrayMatch ? charsArrayMatch[1].split(',').map(c => c.trim().replace(/"/g, '')) : [];

        // 找到需要修改的字的位置，执行粤拼替换
        // 繁体→简体转换：确保用户输入的繁体字能与文件中的简体字匹配
        // 因为歌词文件中统一使用简体中文存储
        const simplifiedChar = char ? toSimplified(char) : null;
        let modified = false;  // 标记本轮纠错是否成功修改

        if (simplifiedChar) {
            // 方式1：按字+原粤拼双重匹配（优先使用，更精确）
            // 同时匹配字符和原粤拼，避免误改同音不同字的粤拼
            for (let i = 0; i < charsArray.length; i++) {
                if (charsArray[i] === simplifiedChar && jpArray[i] === originalJp) {
                    // 字符和粤拼都匹配，执行替换
                    jpArray[i] = newJp;
                    modified = true;
                    break;  // 只替换第一个匹配项，避免重复修改
                }
            }
        } else {
            // 方式2：仅按原粤拼匹配（用户未指定字符时的降级方案）
            // 查找 jp 数组中第一个与原粤拼相同的元素
            const idx = jpArray.indexOf(originalJp);
            if (idx > -1) {
                jpArray[idx] = newJp;  // 替换为新粤拼
                modified = true;
            }
        }

        // 根据修改结果更新文件内容
        if (modified) {
            // 将修改后的 jp 数组重新序列化为字符串格式
            // 每个粤拼用双引号包裹，逗号分隔
            const newJpStr = jpArray.map(j => `"${j}"`).join(', ');
            // 使用正则替换原行中的整个 jp 数组
            lines[lyricsLineIndex] = line.replace(
                /jp:\s*\[[^\]]+\]/,
                `jp: [${newJpStr}]`
            );
            // 将修改后的行数组重新合并为完整的文件内容字符串
            content = lines.join('\n');
            appliedCount++;  // 成功计数器加 1
        } else {
            // 未找到匹配的字或粤拼，说明纠错数据与文件内容不一致
            failedRows.push(row);
        }
    }

    // 检查是否有任何修改成功
    // 如果所有纠错都失败，则不需要创建 PR
    if (appliedCount === 0) {
        // 所有纠错都失败了，添加详细错误信息
        // 列出所有失败的行，帮助用户排查问题
        addComment(issue.number, `❌ 未能应用任何纠错。请检查行号、字和粤拼是否正确。\n\n失败的行：\n${failedRows.map(r => r.join(' | ')).join('\n')}`);
        return;  // 提前退出，不创建 PR
    }

    // 将修改后的内容写回歌词文件（覆盖原文件）
    fs.writeFileSync(filePath, content, 'utf8');

    // 创建 Git 分支并提交更改
    // 分支名格式：fix/jyutping-{Issue编号}
    const branchName = `fix/jyutping-${issue.number}`;
    createBranch(branchName);

    // 构建提交信息，包含歌曲名和修改数量
    const commitMsg = `fix: 粤拼纠错《${songTitle}》(${appliedCount}处)`;
    commitAndPush(branchName, commitMsg);

    // 构建 PR 描述（Markdown 格式）
    const prBody = `## 粤拼纠错 #${issue.number}

**歌曲：** ${songTitle}
**修改数量：** ${appliedCount} 处

| 行号 | 字 | 原粤拼 | 正确粤拼 |
|------|-----|--------|----------|
${rows.filter(r => !failedRows.includes(r)).map(r => `| ${r.join(' | ')} |`).join('\n')}

${failedRows.length > 0 ? `\n### ⚠️ 未能应用的纠错\n${failedRows.map(r => `| ${r.join(' | ')} |`).join('\n')}\n` : ''}
> ⚠️ 请审核修改是否正确，确认无误后合并。
`;

    // 创建 Pull Request
    const prTitle = `fix: 粤拼纠错《${songTitle}》(${appliedCount}处)`;
    createPR(prTitle, prBody, branchName, issueNumber);

    // 在 Issue 中添加成功评论，通知用户处理结果
    // 包含 PR 链接和未能自动处理的纠错列表
    addComment(issue.number, `✅ 已自动修改 ${appliedCount} 处粤拼并创建 [Pull Request](${prTitle})。

${failedRows.length > 0 ? `\n⚠️ 以下 ${failedRows.length} 处纠错未能自动应用，请手动处理：\n${failedRows.map(r => `- ${r.join(' | ')}`).join('\n')}` : ''}

请等待管理员审核合并。`);

}

// 导出模块，供其他脚本（如 process-issue.js）通过 require 调用
module.exports = { processJyutpingCorrection };
