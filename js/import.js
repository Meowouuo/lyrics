// 导入歌词模块

let importedLyricsData = null; // 存储导入的歌词数据

function showImportModal() {
    document.getElementById('importModal').style.display = 'flex';
    // 清空表单
    document.getElementById('importTitle').value = '';
    document.getElementById('importArtist').value = '';
    document.getElementById('importLyricist').value = '';
    document.getElementById('importComposer').value = '';
    document.getElementById('importLyrics').value = '';
    document.getElementById('importPreview').style.display = 'none';
    importedLyricsData = null;
}

function hideImportModal() {
    document.getElementById('importModal').style.display = 'none';
}

function previewImport() {
    let lyricsText = document.getElementById('importLyrics').value.trim();
    // 自动将繁体转为简体
    lyricsText = convertText(lyricsText, false);
    // 更新输入框显示为简体
    document.getElementById('importLyrics').value = lyricsText;
    if (!lyricsText) {
        document.getElementById('importPreview').style.display = 'none';
        importedLyricsData = null;
        return;
    }

    // 解析歌词：按双换行分段（连续两个或以上换行符表示段落分隔）
    // 单换行表示正常换行（新的一句）
    const normalizedText = lyricsText.replace(/\r\n/g, '\n');
    const paragraphs = normalizedText.split(/\n{2,}/);
    const lyrics = [];
    let previewHtml = '';

    paragraphs.forEach((para, pIdx) => {
        // 段落内按单换行分割成多行，每行是一句歌词
        const lines = para.split('\n').filter(l => l.trim());
        lines.forEach((line, lIdx) => {
            const matched = matchJyutping(line.trim());
            lyrics.push({
                chars: matched.map(m => m.char),
                jp: matched.map(m => m.jp)
            });

            // 生成预览HTML（只显示前几行）
            if (pIdx < 2 && lIdx < 3) {
                previewHtml += '<div class="import-preview-line">';
                matched.forEach(m => {
                    const jpClass = m.jp ? '' : 'style="color:#dc3545;"'; // 没有匹配到的字显示红色
                    previewHtml += `<span class="import-preview-char">
                        <span class="import-preview-jp" ${jpClass}>${m.jp}</span>
                        <span class="import-preview-hanzi">${m.char}</span>
                    </span>`;
                });
                previewHtml += '</div>';
            }
        });
        // 段落结束后添加段落分隔（双换行产生的段落）
        if (lines.length > 0) {
            lyrics.push({ paragraphBreak: true });
        }
    });

    // 移除最后一个多余的段落分隔
    if (lyrics.length > 0 && lyrics[lyrics.length - 1].paragraphBreak) {
        lyrics.pop();
    }

    importedLyricsData = lyrics;

    // 显示预览
    document.getElementById('importPreview').style.display = 'block';
    document.getElementById('importPreviewContent').innerHTML = previewHtml || '<div style="color:#999;">暂无内容</div>';
}

function generateSongFile() {
    // 自动将繁体转为简体
    const title = convertText(document.getElementById('importTitle').value.trim(), false);
    const artist = convertText(document.getElementById('importArtist').value.trim(), false);
    const lyricist = convertText(document.getElementById('importLyricist').value.trim(), false);
    const composer = convertText(document.getElementById('importComposer').value.trim(), false);

    // 更新输入框显示为简体
    document.getElementById('importTitle').value = title;
    document.getElementById('importArtist').value = artist;
    document.getElementById('importLyricist').value = lyricist;
    document.getElementById('importComposer').value = composer;

    if (!title || !artist) {
        alert('请填写歌曲名称和歌手');
        return;
    }

    if (!importedLyricsData) {
        previewImport();
        if (!importedLyricsData) {
            alert('请输入歌词内容');
            return;
        }
    }

    // 生成歌曲ID（基于现有最大ID+1）
    const maxId = window.songs.reduce((max, s) => Math.max(max, s.id || 0), 0);
    const songId = maxId + 1;

    // 匹配标题、歌手、填词、作曲的粤拼
    const titleJyutping = matchJyutping(title).map(m => m.jp);
    const artistJyutping = matchJyutping(artist).map(m => m.jp);
    const lyricistJyutping = lyricist ? matchJyutping(lyricist).map(m => m.jp) : [];
    const composerJyutping = composer ? matchJyutping(composer).map(m => m.jp) : [];

    // 生成JS文件内容（格式与现有歌曲文件一致）
    const lyricsStr = importedLyricsData.map(line => {
        if (line.paragraphBreak) return '            { paragraphBreak: true }';
        return '            { chars: ' + JSON.stringify(line.chars) + ', jp: ' + JSON.stringify(line.jp) + ' }';
    }).join(',\n');

    const jsContent = `// 歌曲：${title}

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
    window.__songs.push(song);
}());

// ⚠️ 重要：请在 index.html 的 songFiles 数组中添加以下一行：
// 'lyrics/${title}.js',
`;

    // 生成代码供部署
    document.getElementById('generatedCode').value = jsContent;
    document.getElementById('codeModal').style.display = 'flex';

    // 关闭导入模态框
    hideImportModal();
}

function hideCodeModal() {
    document.getElementById('codeModal').style.display = 'none';
}

function copyGeneratedCode() {
    const code = document.getElementById('generatedCode').value;
    navigator.clipboard.writeText(code).then(() => {
        alert('代码已复制到剪贴板！\n\n请将代码保存为 lyrics/' + document.getElementById('importTitle').value + '.js 文件');
    }).catch(() => {
        // 备用方案
        const textarea = document.getElementById('generatedCode');
        textarea.select();
        document.execCommand('copy');
        alert('代码已复制！');
    });
}

// 导出模块
window.ImportModule = {
    show: showImportModal,
    hide: hideImportModal,
    preview: previewImport,
    generate: generateSongFile,
    hideCode: hideCodeModal,
    copyCode: copyGeneratedCode
};
