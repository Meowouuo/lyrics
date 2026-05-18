// ============================================
// 歌词导入模块
// 功能：提供前端界面让用户导入新歌曲歌词
// 自动将繁体转为简体，并匹配粤拼发音
// ============================================

// ============================================
// 全局状态变量
// ============================================

// 存储导入的歌词数据（解析后的结构化数据）
// 格式：[{ chars: [...], jp: [...] }] 或 [{ paragraphBreak: true }]
let importedLyricsData = null;

// ============================================
// 显示导入模态框
// 功能：打开导入歌曲的对话框，清空表单内容
// ============================================
function showImportModal() {
    // 获取模态框元素并显示
    document.getElementById('importModal').style.display = 'flex';

    // 清空所有表单字段
    document.getElementById('importTitle').value = '';
    document.getElementById('importArtist').value = '';
    document.getElementById('importLyricist').value = '';
    document.getElementById('importComposer').value = '';
    document.getElementById('importLyrics').value = '';

    // 隐藏预览区域
    document.getElementById('importPreview').style.display = 'none';

    // 重置导入数据
    importedLyricsData = null;
}

// ============================================
// 隐藏导入模态框
// 功能：关闭导入歌曲的对话框
// ============================================
function hideImportModal() {
    document.getElementById('importModal').style.display = 'none';
}

// ============================================
// 预览导入内容
// 功能：解析用户输入的歌词，生成预览效果
// 同时自动将繁体歌词转为简体
// ============================================
function previewImport() {
    // 获取歌词文本并去除首尾空白
    let lyricsText = document.getElementById('importLyrics').value.trim();

    // 自动将繁体转为简体（convertText 从 utils.js 获取）
    // 参数 toTraditional: false 表示转为简体
    lyricsText = convertText(lyricsText, false);

    // 更新输入框显示为简体版本
    document.getElementById('importLyrics').value = lyricsText;

    // 如果没有歌词内容，隐藏预览
    if (!lyricsText) {
        document.getElementById('importPreview').style.display = 'none';
        importedLyricsData = null;
        return;
    }

    // 解析歌词文本为结构化数据
    // 处理回车换行符，统一为 \n
    const normalizedText = lyricsText.replace(/\r\n/g, '\n');

    // 按双换行分段（连续两个或以上换行符表示段落分隔）
    // 单换行表示正常换行（新的一句）
    const paragraphs = normalizedText.split(/\n{2,}/);

    // 存储解析后的歌词数据
    const lyrics = [];
    let previewHtml = '';

    // 遍历每个段落
    paragraphs.forEach((para, pIdx) => {
        // 段落内按单换行分割成多行，每行是一句歌词
        const lines = para.split('\n').filter(l => l.trim());

        // 遍历每行歌词
        lines.forEach((line, lIdx) => {
            // 使用 matchJyutping 函数匹配粤拼
            const matched = matchJyutping(line.trim());

            // 添加到歌词数组
            lyrics.push({
                chars: matched.map(m => m.char),  // 字符数组
                jp: matched.map(m => m.jp)        // 粤拼数组
            });

            // 生成预览 HTML（只显示前两段、每段前3行）
            if (pIdx < 2 && lIdx < 3) {
                previewHtml += '<div class="import-preview-line">';
                matched.forEach(m => {
                    // 没有匹配到粤拼的字显示红色
                    const jpClass = m.jp ? '' : 'style="color:#dc3545;"';
                    previewHtml += `<span class="import-preview-char">
                        <span class="import-preview-jp" ${jpClass}>${m.jp}</span>
                        <span class="import-preview-hanzi">${m.char}</span>
                    </span>`;
                });
                previewHtml += '</div>';
            }
        });

        // 段落结束后添加段落分隔标记（双换行产生的段落）
        if (lines.length > 0) {
            lyrics.push({ paragraphBreak: true });
        }
    });

    // 移除最后一个多余的段落分隔
    if (lyrics.length > 0 && lyrics[lyrics.length - 1].paragraphBreak) {
        lyrics.pop();
    }

    // 保存解析后的数据
    importedLyricsData = lyrics;

    // 显示预览区域
    document.getElementById('importPreview').style.display = 'block';
    document.getElementById('importPreviewContent').innerHTML = previewHtml || '<div style="color:#999;">暂无内容</div>';
}

// ============================================
// 生成歌曲文件
// 功能：根据表单数据生成歌曲 JS 文件代码
// ============================================
function generateSongFile() {
    // 获取表单数据并转换为简体
    const title = convertText(document.getElementById('importTitle').value.trim(), false);
    const artist = convertText(document.getElementById('importArtist').value.trim(), false);
    const lyricist = convertText(document.getElementById('importLyricist').value.trim(), false);
    const composer = convertText(document.getElementById('importComposer').value.trim(), false);

    // 更新输入框显示为简体版本
    document.getElementById('importTitle').value = title;
    document.getElementById('importArtist').value = artist;
    document.getElementById('importLyricist').value = lyricist;
    document.getElementById('importComposer').value = composer;

    // 验证必填字段
    if (!title || !artist) {
        alert('请填写歌曲名称和歌手');
        return;
    }

    // 如果还没有解析歌词，先预览
    if (!importedLyricsData) {
        previewImport();
        if (!importedLyricsData) {
            alert('请输入歌词内容');
            return;
        }
    }

    // 生成歌曲 ID（基于现有最大 ID +1）
    const maxId = window.songs.reduce((max, s) => Math.max(max, s.id || 0), 0);
    const songId = maxId + 1;

    // 匹配标题、歌手、填词、作曲的粤拼
    const titleJyutping = matchJyutping(title).map(m => m.jp);
    const artistJyutping = matchJyutping(artist).map(m => m.jp);
    const lyricistJyutping = lyricist ? matchJyutping(lyricist).map(m => m.jp) : [];
    const composerJyutping = composer ? matchJyutping(composer).map(m => m.jp) : [];

    // 生成歌词部分的 JS 代码
    const lyricsStr = importedLyricsData.map(line => {
        if (line.paragraphBreak) {
            // 段落分隔符
            return '            { paragraphBreak: true }';
        }
        // 普通歌词行
        return '            { chars: ' + JSON.stringify(line.chars) + ', jp: ' + JSON.stringify(line.jp) + ' }';
    }).join(',\n');

    // 生成完整的 JS 文件内容
    const jsContent = `// 歌曲：${title}

// 歌曲数据立即执行函数
(function() {
    const song = {
        id: ${songId},                       // 歌曲唯一 ID
        title: "${title}",                   // 歌曲名称
        titleJyutping: ${JSON.stringify(titleJyutping)},  // 歌名粤拼
        artist: "${artist}",                 // 歌手名称
        artistJyutping: ${JSON.stringify(artistJyutping)},  // 歌手粤拼
        lyricist: "${lyricist}",             // 填词人
        lyricistJyutping: ${JSON.stringify(lyricistJyutping)},  // 填词人粤拼
        composer: "${composer}",             // 作曲人
        composerJyutping: ${JSON.stringify(composerJyutping)},  // 作曲人粤拼
        lyrics: [                            // 歌词数组
${lyricsStr}
        ]
    };
    // 将歌曲添加到全局歌曲列表
    window.__songs.push(song);
}());

// ⚠️ 重要：请在 index.html 的 songFiles 数组中添加以下一行：
// 'lyrics/${title}.js',
`;

    // 在页面上显示生成的代码
    document.getElementById('generatedCode').value = jsContent;
    document.getElementById('codeModal').style.display = 'flex';

    // 关闭导入模态框
    hideImportModal();
}

// ============================================
// 隐藏代码模态框
// 功能：关闭显示生成代码的对话框
// ============================================
function hideCodeModal() {
    document.getElementById('codeModal').style.display = 'none';
}

// ============================================
// 复制生成的代码
// 功能：将生成的歌曲 JS 文件代码复制到剪贴板
// ============================================
function copyGeneratedCode() {
    // 获取生成的代码
    const code = document.getElementById('generatedCode').value;

    // 使用现代的 Clipboard API 复制
    navigator.clipboard.writeText(code).then(() => {
        alert('代码已复制到剪贴板！\n\n请将代码保存为 lyrics/' + document.getElementById('importTitle').value + '.js 文件');
    }).catch(() => {
        // 备用方案：使用传统的 execCommand 方法
        const textarea = document.getElementById('generatedCode');
        textarea.select();
        document.execCommand('copy');
        alert('代码已复制！');
    });
}

// ============================================
// 导出模块
// 将功能挂载到全局对象，供 HTML 页面调用
// ============================================
window.ImportModule = {
    show: showImportModal,       // 显示导入对话框
    hide: hideImportModal,      // 隐藏导入对话框
    preview: previewImport,     // 预览歌词
    generate: generateSongFile,  // 生成歌曲文件
    hideCode: hideCodeModal,    // 隐藏代码对话框
    copyCode: copyGeneratedCode  // 复制代码
};
