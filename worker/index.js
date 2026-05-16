// Cloudflare Worker：接收投稿表单，创建 GitHub Issue
// 部署后，用户无需 GitHub 账号即可投稿

export default {
  async fetch(request, env) {
    // 处理 CORS 预检请求
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
        },
      });
    }

    if (request.method !== 'POST') {
      return jsonResponse({ error: '仅支持 POST 请求' }, 405);
    }

    try {
      const data = await request.json();
      const { type, title, artist, lyricist, composer, lyrics, corrections, songName } = data;

      // 验证必填字段
      if (!type) {
        return jsonResponse({ error: '缺少 type 字段' }, 400);
      }

      let issueTitle, issueBody, labels;

      switch (type) {
        case 'new-song':
          if (!title || !artist || !lyrics) {
            return jsonResponse({ error: '投稿需要歌曲名称、歌手和歌词' }, 400);
          }
          issueTitle = `[新歌投稿] ${title} - ${artist}`;
          labels = ['投稿'];
          issueBody = buildNewSongBody({ title, artist, lyricist, composer, lyrics });
          break;

        case 'jyutping-correction':
          if (!songName || !corrections || corrections.length === 0) {
            return jsonResponse({ error: '纠错需要歌曲名称和纠错内容' }, 400);
          }
          issueTitle = `[粤拼纠错] ${songName}（${corrections.length}处）`;
          labels = ['纠错'];
          issueBody = buildJyutpingCorrectionBody({ songName, corrections });
          break;

        case 'lyrics-correction':
          if (!songName) {
            return jsonResponse({ error: '歌词纠错需要歌曲名称' }, 400);
          }
          const correctionType = data.correctionType || 'line';
          const fullLyrics = data.fullLyrics;
          const insertData = data.insert;
          
          if (correctionType === 'full') {
            if (!fullLyrics) {
              return jsonResponse({ error: '整首替换需要填写完整歌词' }, 400);
            }
            issueTitle = `[歌词纠错-整首替换] ${songName}`;
            labels = ['歌词纠错'];
            issueBody = buildFullReplacementBody({ songName, fullLyrics });
          } else if (correctionType === 'insert') {
            const insertions = data.insertions || (data.insert ? [data.insert] : []);
            if (!insertions || insertions.length === 0) {
              return jsonResponse({ error: '插入行需要填写插入位置和歌词' }, 400);
            }
            issueTitle = `[歌词纠错-插入行] ${songName}（${insertions.length}处）`;
            labels = ['歌词纠错'];
            issueBody = buildInsertBody({ songName, insertions });
          } else {
            if (!corrections || corrections.length === 0) {
              return jsonResponse({ error: '歌词纠错需要纠错内容' }, 400);
            }
            issueTitle = `[歌词纠错] ${songName}（${corrections.length}处）`;
            labels = ['歌词纠错'];
            issueBody = buildLyricsCorrectionBody({ songName, corrections });
          }
          break;

        case 'delete-song':
          const songs = data.songs;
          if (!songs || songs.length === 0) {
            return jsonResponse({ error: '删除歌曲需要选择要删除的歌曲' }, 400);
          }
          issueTitle = `[删除歌曲] ${songs.length}首歌曲`;
          labels = ['删除'];
          issueBody = buildDeleteSongBody({ songs });
          break;

        default:
          return jsonResponse({ error: `未知的 type: ${type}` }, 400);
      }

      // 创建 GitHub Issue
      const githubToken = env.GITHUB_TOKEN;
      if (!githubToken) {
        return jsonResponse({ error: '服务端未配置 GITHUB_TOKEN' }, 500);
      }

      const githubResponse = await fetch('https://api.github.com/repos/Meowouuo/lyrics/issues', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${githubToken}`,
          'Content-Type': 'application/json',
          'User-Agent': 'Lyrics-Submit-Worker',
        },
        body: JSON.stringify({
          title: issueTitle,
          body: issueBody,
          labels: labels,
        }),
      });

      if (!githubResponse.ok) {
        const error = await githubResponse.text();
        console.error('GitHub API error:', error);
        return jsonResponse({ error: '创建 Issue 失败', detail: error }, 500);
      }

      const issue = await githubResponse.json();
      return jsonResponse({
        success: true,
        message: '提交成功！已创建 GitHub Issue',
        issueUrl: issue.html_url,
        issueNumber: issue.number,
      });

    } catch (error) {
      console.error('Worker error:', error);
      return jsonResponse({ error: '服务器内部错误' }, 500);
    }
  },
};

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
  });
}

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
*由网站投稿表单提交*`;
}

function buildJyutpingCorrectionBody({ songName, corrections }) {
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
*由网站投稿表单提交*`;
}

function buildDeleteSongBody({ songs }) {
  const songList = songs.map((s, i) =>
    `${i + 1}. **${s.title}** - ${s.artist}（ID: ${s.id}）`
  ).join('\n');

  return `## 删除歌曲请求

**删除数量：** ${songs.length} 首

${songList}

---
*由网站投稿表单提交*`;
}

function buildLyricsCorrectionBody({ songName, corrections }) {
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
*由网站投稿表单提交*`;
}

function buildFullReplacementBody({ songName, fullLyrics }) {
  return `## 整首歌词替换

**歌曲名称：** ${songName}

## 完整歌词

\`\`\`
${fullLyrics}
\`\`\`

---
*由网站投稿表单提交*`;
}

function buildInsertBody({ songName, insertions }) {
  const insertList = insertions.map((ins, i) => {
    const posText = ins.position === 'before' ? '前' : '后';
    return `### 插入 ${i + 1}
- **位置：** 第${ins.line}行${posText}
- **歌词：**
\`\`\`
${ins.lyrics}
\`\`\``;
  }).join('

');
  
  return `## 插入歌词

**歌曲名称：** ${songName}
**插入数量：** ${insertions.length} 处

${insertList}

---
*由网站投稿表单提交*`;
}
