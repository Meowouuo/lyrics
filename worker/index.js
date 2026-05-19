/**
 * ============================================================
 * Cloudflare Worker：粤拼歌词投稿后端服务
 * ============================================================
 *
 * 功能说明：
 * - 接收前端投稿表单数据
 * - 验证数据合法性
 * - 调用 GitHub API 创建 Issue
 * - 返回处理结果给前端
 *
 * 部署说明：
 * - 使用 Cloudflare Workers 部署
 * - 需要在 Workers 环境变量中配置 GITHUB_TOKEN
 * - GITHUB_TOKEN 需要具有创建 Issue 的权限
 *
 * 作者：粤拼歌词项目组
 * 版本：1.0.0
 */

// ============================================================
// 主入口函数：处理所有 HTTP 请求
// ============================================================

/**
 * Fetch 事件处理函数
 * @description 处理所有进入的 HTTP 请求，包括 OPTIONS 预检请求和 POST 请求
 * @param {Request} request - HTTP 请求对象
 * @param {Object} env - 环境变量，包含 GITHUB_TOKEN 等配置
 * @param {Object} ctx - Cloudflare 上下文对象
 * @returns {Response} HTTP 响应
 */
export default {
  async fetch(request, env) {
    // ------------------------------------------------
    // CORS 预检请求处理
    // ------------------------------------------------
    // 浏览器在发送跨域 POST 请求前会先发送 OPTIONS 请求
    // 需要返回正确的 CORS 头才能让浏览器继续发送实际请求
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          // 允许所有来源访问（生产环境应限制具体域名）
          'Access-Control-Allow-Origin': '*',
          // 允许的 HTTP 方法
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          // 允许的请求头
          'Access-Control-Allow-Headers': 'Content-Type',
        },
      });
    }

    // ------------------------------------------------
    // 请求方法验证
    // ------------------------------------------------
    // 本接口只接受 POST 请求，其他方法返回 405 Method Not Allowed
    if (request.method !== 'POST') {
      return jsonResponse({ error: '仅支持 POST 请求' }, 405);
    }

    // ------------------------------------------------
    // 请求体解析与数据验证
    // ------------------------------------------------
    try {
      // 解析 JSON 请求体
      const data = await request.json();

      // 从请求体中提取基本字段
      const {
        type,
        title,
        artist,
        lyricist,
        composer,
        lyrics,
        corrections,
        songName
      } = data;

      // 验证 type 字段是否存在（必须指定请求类型）
      if (!type) {
        return jsonResponse({ error: '缺少 type 字段' }, 400);
      }

      // ------------------------------------------------
      // 根据 type 类型处理不同的请求
      // ------------------------------------------------
      let issueTitle;    // GitHub Issue 标题
      let issueBody;      // GitHub Issue 正文
      let labels;         // GitHub Issue 标签

      switch (type) {
        // =============================================
        // 新歌投稿处理
        // =============================================
        case 'new-song':
          // 验证必填字段
          if (!title || !artist || !lyrics) {
            return jsonResponse({
              error: '投稿需要歌曲名称、歌手和歌词'
            }, 400);
          }

          // 构建 Issue 标题，格式：[新歌投稿] 歌曲名 - 歌手
          issueTitle = `[新歌投稿] ${title} - ${artist}`;

          // 设置 Issue 标签
          labels = ['投稿-新歌'];

          // 生成 Issue 正文内容
          issueBody = buildNewSongBody({ title, artist, lyricist, composer, lyrics });
          break;

        // =============================================
        // 粤拼纠错处理
        // =============================================
        case 'jyutping-correction':
          // 验证必填字段
          if (!songName || !corrections || corrections.length === 0) {
            return jsonResponse({
              error: '纠错需要歌曲名称和纠错内容'
            }, 400);
          }

          // 构建 Issue 标题，格式：[粤拼纠错] 歌曲名（N处）
          issueTitle = `[粤拼纠错] ${songName}（${corrections.length}处）`;

          // 设置 Issue 标签
          labels = ['投稿-粤拼'];

          // 生成 Issue 正文内容
          issueBody = buildJyutpingCorrectionBody({ songName, corrections });
          break;

        // =============================================
        // 歌词纠错处理（支持多种纠错类型）
        // =============================================
        case 'lyrics-correction':
          // 验证歌曲名称
          if (!songName) {
            return jsonResponse({
              error: '歌词纠错需要歌曲名称'
            }, 400);
          }

          // 获取纠错类型，默认为逐行修改
          const correctionType = data.correctionType || 'line';

          // 获取完整歌词（用于整首替换）
          const fullLyrics = data.fullLyrics;

          // 获取插入数据
          const insertData = data.insert;

          // 根据纠错类型分别处理
          if (correctionType === 'full') {
            // ----- 整首替换模式 -----
            if (!fullLyrics) {
              return jsonResponse({
                error: '整首替换需要填写完整歌词'
              }, 400);
            }
            issueTitle = `[歌词纠错-整首替换] ${songName}`;
            labels = ['歌词纠错'];
            issueBody = buildFullReplacementBody({ songName, fullLyrics });

          } else if (correctionType === 'insert') {
            // ----- 插入行模式 -----
            // 支持 insertions 数组或单个 insert 对象
            const insertions = data.insertions || (data.insert ? [data.insert] : []);
            if (!insertions || insertions.length === 0) {
              return jsonResponse({
                error: '插入行需要填写插入位置和歌词'
              }, 400);
            }
            issueTitle = `[歌词纠错-插入行] ${songName}（${insertions.length}处）`;
            labels = ['歌词纠错'];
            issueBody = buildInsertBody({ songName, insertions });

          } else {
            // ----- 逐行修改模式（默认） -----
            // 支持只有歌名/元信息修改的情况
            const meta = data.meta;
            if ((!corrections || corrections.length === 0) && (!meta || Object.keys(meta).length === 0)) {
              return jsonResponse({
                error: '歌词纠错需要纠错内容'
              }, 400);
            }
            // 构建标题和正文
            const metaParts = [];
            if (meta) {
              if (meta.title) metaParts.push('歌名: ' + meta.title.original + ' → ' + meta.title.new);
              if (meta.artist) metaParts.push('歌手: ' + meta.artist.original + ' → ' + meta.artist.new);
              if (meta.lyricist) metaParts.push('填词: ' + meta.lyricist.original + ' → ' + meta.lyricist.new);
              if (meta.composer) metaParts.push('作曲: ' + meta.composer.original + ' → ' + meta.composer.new);
            }
            const count = (corrections ? corrections.length : 0) + metaParts.length;
            issueTitle = `[歌词纠错] ${songName}（${count}处）`;
            labels = ['歌词纠错'];
            // 如果有逐行纠错，使用标准格式；否则只提交 meta 信息
            if (corrections && corrections.length > 0) {
              issueBody = buildLyricsCorrectionBody({ songName, corrections, meta });
            } else {
              issueBody = `## 歌曲名称
${songName}

## 纠错内容

${metaParts.map(p => '- ' + p).join('
')}`;
            }
          }
          break;

        // =============================================
        // 删除歌曲请求处理
        // =============================================
        case 'delete-song':
          const songs = data.songs;
          if (!songs || songs.length === 0) {
            return jsonResponse({
              error: '删除歌曲需要选择要删除的歌曲'
            }, 400);
          }
          issueTitle = `[删除歌曲] ${songs.length}首歌曲`;
          labels = ['投稿-删除'];
          issueBody = buildDeleteSongBody({ songs });
          break;

        // =============================================
        // 未知类型处理
        // =============================================
        default:
          return jsonResponse({ error: `未知的 type: ${type}` }, 400);
      }

      // ------------------------------------------------
      // 调用 GitHub API 创建 Issue
      // ------------------------------------------------

      // 检查 GitHub Token 是否配置
      const githubToken = env.GITHUB_TOKEN;
      if (!githubToken) {
        return jsonResponse({ error: '服务端未配置 GITHUB_TOKEN' }, 500);
      }

      // 调用 GitHub API 创建 Issue
      const githubResponse = await fetch('https://api.github.com/repos/Meowouuo/lyrics/issues', {
        method: 'POST',
        headers: {
          // Bearer Token 认证
          'Authorization': `Bearer ${githubToken}`,
          // JSON 格式
          'Content-Type': 'application/json',
          // User-Agent 用于 GitHub API 识别
          'User-Agent': 'Lyrics-Submit-Worker',
        },
        body: JSON.stringify({
          title: issueTitle,     // Issue 标题
          body: issueBody,       // Issue 正文
          labels: labels,        // Issue 标签
        }),
      });

      // 检查 GitHub API 响应
      if (!githubResponse.ok) {
        // API 返回错误，记录日志
        const error = await githubResponse.text();
        console.error('GitHub API 错误:', error);
        return jsonResponse({
          error: '创建 Issue 失败',
          detail: error
        }, 500);
      }

      // 解析成功响应，返回 Issue 信息
      const issue = await githubResponse.json();
      return jsonResponse({
        success: true,
        message: '提交成功！已创建 GitHub Issue',
        issueUrl: issue.html_url,      // Issue 页面链接
        issueNumber: issue.number,     // Issue 编号
      });

    } catch (error) {
      // ------------------------------------------------
      // 异常处理
      // ------------------------------------------------
      // 捕获所有未处理的错误，包括 JSON 解析错误、网络错误等
      console.error('Worker 运行时错误:', error);
      return jsonResponse({ error: '服务器内部错误' }, 500);
    }
  },
};

// ============================================================
// 辅助函数
// ============================================================

/**
 * 创建 JSON 格式的 HTTP 响应
 * @description 封装统一的响应格式，自动添加 CORS 头和 Content-Type
 * @param {Object} data - 要返回的 JSON 数据
 * @param {number} status - HTTP 状态码，默认为 200
 * @returns {Response} Response 对象
 */
function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      // 允许跨域访问
      'Access-Control-Allow-Origin': '*',
    },
  });
}

// ============================================================
// Issue 正文生成函数
// ============================================================

/**
 * 生成新歌投稿的 Issue 正文
 * @description 将投稿数据格式化为 Markdown 文档
 * @param {Object} params - 投稿参数
 * @param {string} params.title - 歌曲名称
 * @param {string} params.artist - 歌手名称
 * @param {string} params.lyricist - 填词人
 * @param {string} params.composer - 作曲人
 * @param {string} params.lyrics - 完整歌词
 * @returns {string} Markdown 格式的 Issue 正文
 */
function buildNewSongBody({ title, artist, lyricist, composer, lyrics }) {
  return `## 投稿信息

**歌曲名称：** ${title}
**歌手：** ${artist}
**填词：** ${lyricist || ''}
**作曲：** ${composer || ''}

## 完整歌词

\`\`\`
${lyrics}
\`\`\`

---
*由网站投稿表单自动提交*`;
}

/**
 * 生成粤拼纠错的 Issue 正文
 * @description 将粤拼纠错数据格式化为带表格的 Markdown 文档
 * @param {Object} params - 纠错参数
 * @param {string} params.songName - 歌曲名称
 * @param {Array} params.corrections - 纠错内容数组
 * @returns {string} Markdown 格式的 Issue 正文
 */
function buildJyutpingCorrectionBody({ songName, corrections }) {
  // 将纠错数据转换为 Markdown 表格行
  const tableRows = corrections.map(c =>
    `| 第${c.line}行 | ${c.char} | ${c.originalJp} | ${c.newJp} |`
  ).join('\n');

  return `## 纠错内容

**歌曲名称：** ${songName}

### 纠错详情

| 行号 | 字 | 原粤拼 | 正确粤拼 |
|------|-----|--------|----------|
${tableRows}

---
*由网站投稿表单自动提交*`;
}

/**
 * 生成删除歌曲请求的 Issue 正文
 * @description 将待删除歌曲列表格式化为 Markdown 文档
 * @param {Object} params - 删除参数
 * @param {Array} params.songs - 待删除歌曲数组
 * @returns {string} Markdown 格式的 Issue 正文
 */
function buildDeleteSongBody({ songs }) {
  // 将歌曲列表格式化为编号列表
  const songList = songs.map((s, i) =>
    `${i + 1}. **${s.title}** - ${s.artist}（ID: ${s.id}）`
  ).join('\n');

  return `## 删除歌曲请求

**删除数量：** ${songs.length} 首

${songList}

---
*由网站投稿表单自动提交*`;
}

/**
 * 生成歌词纠错（逐行修改）的 Issue 正文
 * @description 将逐行纠错数据格式化为带表格的 Markdown 文档
 * @param {Object} params - 纠错参数
 * @param {string} params.songName - 歌曲名称
 * @param {Array} params.corrections - 纠错内容数组
 * @returns {string} Markdown 格式的 Issue 正文
 */
function buildLyricsCorrectionBody({ songName, corrections }) {
  // 将纠错数据转换为 Markdown 表格行
  const tableRows = corrections.map(c =>
    `| 第${c.line}行 | ${c.originalText} | ${c.newText} |`
  ).join('\n');

  return `## 纠错内容

**歌曲名称：** ${songName}

### 纠错详情

| 行号 | 原歌词 | 正确歌词 |
|------|--------|----------|
${tableRows}

---
*由网站投稿表单自动提交*`;
}

/**
 * 生成整首歌词替换的 Issue 正文
 * @description 将完整歌词格式化为 Markdown 文档
 * @param {Object} params - 替换参数
 * @param {string} params.songName - 歌曲名称
 * @param {string} params.fullLyrics - 完整歌词
 * @returns {string} Markdown 格式的 Issue 正文
 */
function buildFullReplacementBody({ songName, fullLyrics }) {
  return `## 整首歌词替换

**歌曲名称：** ${songName}

## 完整歌词

\`\`\`
${fullLyrics}
\`\`\`

---
*由网站投稿表单自动提交*`;
}

/**
 * 生成插入歌词的 Issue 正文
 * @description 将插入请求格式化为 Markdown 文档
 * @param {Object} params - 插入参数
 * @param {string} params.songName - 歌曲名称
 * @param {Array} params.insertions - 插入项数组
 * @returns {string} Markdown 格式的 Issue 正文
 */
function buildInsertBody({ songName, insertions }) {
  // 将插入项格式化为列表
  const insertList = insertions.map((ins, i) => {
    // 转换位置描述
    const posText = ins.position === 'before' ? '前' : '后';
    return `### 插入 ${i + 1}
- **位置：** 第${ins.line}行${posText}
- **歌词：**
\`\`\`
${ins.lyrics}
\`\`\``;
  }).join('\n\n');

  return `## 插入歌词

**歌曲名称：** ${songName}
**插入数量：** ${insertions.length} 处

${insertList}

---
*由网站投稿表单自动提交*`;
}
