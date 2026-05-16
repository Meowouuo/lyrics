// 修改歌词模式模块 - 子菜单选择版

let editLyricsMode = false;
let editLyricsType = null; // 'line', 'full', 'insert'
let editedLyrics = [];
let fullReplacementLyrics = '';
let editedMeta = {}; // { title, artist, lyricist, composer }
let insertData = { position: 'after', line: 1, lyrics: '' };

// 点击改歌词按钮 - 显示子菜单选择
function toggleEditLyricsMode() {
    const song = window.currentSong;
    if (!song) {
        alert('请先选择一首歌曲');
        return;
    }
    
    // 如果已经在某种编辑模式中，退出
    if (editLyricsMode) {
        exitEditMode();
        return;
    }
    
    // 显示子菜单选择弹窗
    showEditTypeSelector();
}

// 显示编辑类型选择弹窗
function showEditTypeSelector() {
    hideEditTypeSelector();
    
    const overlay = document.createElement('div');
    overlay.className = 'edit-type-overlay';
    overlay.id = 'editTypeOverlay';
    overlay.onclick = hideEditTypeSelector;
    
    const popup = document.createElement('div');
    popup.className = 'edit-type-popup';
    popup.id = 'editTypePopup';
    popup.innerHTML = `
        <div class="edit-type-title">选择编辑方式</div>
        <div class="edit-type-options">
            <div class="edit-type-option" onclick="selectEditType('line')">
                <div class="edit-type-icon">✏️</div>
                <div class="edit-type-name">逐行纠错</div>
                <div class="edit-type-desc">点击歌词行进行编辑</div>
            </div>
            <div class="edit-type-option" onclick="selectEditType('full')">
                <div class="edit-type-icon">🔄</div>
                <div class="edit-type-name">整首替换</div>
                <div class="edit-type-desc">粘贴完整歌词替换整首</div>
            </div>
            <div class="edit-type-option" onclick="selectEditType('insert')">
                <div class="edit-type-icon">➕</div>
                <div class="edit-type-name">插入行</div>
                <div class="edit-type-desc">在指定位置插入新歌词</div>
            </div>
        </div>
        <button class="edit-type-cancel" onclick="hideEditTypeSelector()">取消</button>
    `;
    
    document.body.appendChild(overlay);
    document.body.appendChild(popup);
    
    // 添加样式
    if (!document.getElementById('editTypeStyles')) {
        const styles = document.createElement('style');
        styles.id = 'editTypeStyles';
        styles.textContent = `
            .edit-type-overlay {
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(0,0,0,0.5);
                z-index: 2000;
            }
            .edit-type-popup {
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                background: #fff;
                border-radius: 12px;
                padding: 24px;
                width: 360px;
                max-width: 90vw;
                z-index: 2001;
                box-shadow: 0 8px 32px rgba(0,0,0,0.2);
            }
            .edit-type-title {
                font-size: 18px;
                font-weight: 600;
                text-align: center;
                margin-bottom: 20px;
                color: #333;
            }
            .edit-type-options {
                display: flex;
                flex-direction: column;
                gap: 12px;
                margin-bottom: 20px;
            }
            .edit-type-option {
                display: flex;
                align-items: center;
                padding: 16px;
                border: 2px solid #e8e8e8;
                border-radius: 8px;
                cursor: pointer;
                transition: all 0.2s;
            }
            .edit-type-option:hover {
                border-color: #28a745;
                background: #f6ffed;
            }
            .edit-type-icon {
                font-size: 28px;
                margin-right: 16px;
                width: 40px;
                text-align: center;
            }
            .edit-type-name {
                font-size: 16px;
                font-weight: 600;
                color: #333;
            }
            .edit-type-desc {
                font-size: 13px;
                color: #999;
                margin-left: auto;
            }
            .edit-type-cancel {
                width: 100%;
                padding: 12px;
                background: #f5f5f5;
                border: none;
                border-radius: 6px;
                font-size: 15px;
                cursor: pointer;
                color: #666;
            }
            .edit-type-cancel:hover {
                background: #e8e8e8;
            }
            
            /* 编辑模式样式 */
            .edit-mode-banner {
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                background: #28a745;
                color: #fff;
                padding: 12px 20px;
                display: flex;
                justify-content: space-between;
                align-items: center;
                z-index: 1000;
            }
            .edit-mode-banner-title {
                font-weight: 600;
            }
            .edit-mode-banner-actions {
                display: flex;
                gap: 12px;
            }
            .edit-mode-banner-btn {
                padding: 8px 16px;
                border: none;
                border-radius: 4px;
                font-size: 14px;
                cursor: pointer;
            }
            .edit-mode-banner-btn.submit {
                background: #fff;
                color: #28a745;
                font-weight: 600;
            }
            .edit-mode-banner-btn.submit:disabled {
                background: rgba(255,255,255,0.5);
                cursor: not-allowed;
            }
            .edit-mode-banner-btn.cancel {
                background: rgba(255,255,255,0.2);
                color: #fff;
            }
            
            /* 插入行配置面板 */
            .insert-config-panel {
                position: fixed;
                top: 60px;
                right: 20px;
                width: 300px;
                background: #fff;
                border-radius: 8px;
                box-shadow: 0 4px 16px rgba(0,0,0,0.15);
                padding: 16px;
                z-index: 999;
            }
            .insert-config-title {
                font-weight: 600;
                margin-bottom: 12px;
                color: #333;
            }
            .insert-config-row {
                margin-bottom: 12px;
            }
            .insert-config-row label {
                display: block;
                font-size: 13px;
                color: #666;
                margin-bottom: 4px;
            }
            .insert-config-row select,
            .insert-config-row input {
                width: 100%;
                padding: 8px 12px;
                border: 1px solid #d9d9d9;
                border-radius: 4px;
            }
            .insert-config-textarea {
                width: 100%;
                min-height: 120px;
                padding: 12px;
                border: 1px solid #d9d9d9;
                border-radius: 4px;
                resize: vertical;
                font-family: inherit;
            }
            
            /* 整首替换面板 */
            .full-replace-panel {
                position: fixed;
                top: 60px;
                right: 20px;
                width: 350px;
                background: #fff;
                border-radius: 8px;
                box-shadow: 0 4px 16px rgba(0,0,0,0.15);
                padding: 16px;
                z-index: 999;
            }
            .full-replace-textarea {
                width: 100%;
                min-height: 300px;
                padding: 12px;
                border: 1px solid #d9d9d9;
                border-radius: 4px;
                resize: vertical;
                font-family: inherit;
            }
        `;
        document.head.appendChild(styles);
    }
}

function hideEditTypeSelector() {
    const overlay = document.getElementById('editTypeOverlay');
    const popup = document.getElementById('editTypePopup');
    if (overlay) overlay.remove();
    if (popup) popup.remove();
}

// 选择编辑类型
function selectEditType(type) {
    hideEditTypeSelector();
    editLyricsType = type;
    editLyricsMode = true;
    
    // 更新按钮状态
    updateEditLyricsBtn();
    
    // 进入对应编辑模式
    switch (type) {
        case 'line':
            enterLineEditMode();
            break;
        case 'full':
            enterFullReplaceMode();
            break;
        case 'insert':
            enterInsertMode();
            break;
    }
}

// 逐行编辑模式
function enterLineEditMode() {
    const lyricsContent = document.getElementById('lyricsContent');
    lyricsContent.classList.add('edit-lyrics-mode');
    editedLyrics = [];
    editedMeta = {};
    
    showEditBanner('逐行纠错', '点击标题或歌词行进行编辑');
    
    // 标题行可编辑
    enableTitleEditing();
    
    // 添加点击事件监听
    document.querySelectorAll('.lyric-line').forEach((line, idx) => {
        line.onclick = (e) => handleLineClick(e, idx);
        line.style.cursor = 'pointer';
    });
}

// 整首替换模式
function enterFullReplaceMode() {
    fullReplacementLyrics = '';
    editedMeta = {};
    
    showEditBanner('整首替换', '粘贴完整歌词，也可点击标题编辑');
    
    // 标题行可编辑
    enableTitleEditing();
    
    // 显示替换面板
    const panel = document.createElement('div');
    panel.className = 'full-replace-panel';
    panel.id = 'fullReplacePanel';
    panel.innerHTML = `
        <div class="insert-config-title">粘贴完整歌词</div>
        <textarea class="full-replace-textarea" id="fullLyricsInput" 
            placeholder="请粘贴完整的替换歌词&#10;&#10;格式：&#10;- 每句歌词单独一行&#10;- 段落之间空一行"
            oninput="updateFullLyrics(this.value)"></textarea>
    `;
    document.body.appendChild(panel);
}

// 插入行模式
function enterInsertMode() {
    const song = window.currentSong;
    const maxLine = song.lyrics.filter(l => l.chars).length;
    
    insertData = { position: 'after', line: 1, lyrics: '' };
    editedMeta = {};
    
    showEditBanner('插入行', '选择位置并输入要插入的歌词，也可点击标题编辑');
    
    // 标题行可编辑
    enableTitleEditing();
    
    // 显示插入配置面板
    const panel = document.createElement('div');
    panel.className = 'insert-config-panel';
    panel.id = 'insertConfigPanel';
    panel.innerHTML = `
        <div class="insert-config-title">插入配置</div>
        <div class="insert-config-row">
            <label>插入位置</label>
            <select id="insertPosition" onchange="updateInsertConfig()">
                <option value="after">在行后插入</option>
                <option value="before">在行前插入</option>
            </select>
        </div>
        <div class="insert-config-row">
            <label>行号 (1-${maxLine})</label>
            <input type="number" id="insertLineNum" min="1" max="${maxLine}" value="1" onchange="updateInsertConfig()">
        </div>
        <div class="insert-config-row">
            <label>要插入的歌词</label>
            <textarea class="insert-config-textarea" id="insertLyricsInput" 
                placeholder="每行一句歌词" oninput="updateInsertConfig()"></textarea>
        </div>
    `;
    document.body.appendChild(panel);
    
    // 高亮显示可点击的行
    document.querySelectorAll('.lyric-line').forEach((line, idx) => {
        line.onclick = (e) => selectInsertLine(e, idx);
        line.style.cursor = 'pointer';
    });
}

// 显示编辑横幅
function showEditBanner(title, subtitle) {
    hideEditBanner();
    
    const banner = document.createElement('div');
    banner.className = 'edit-mode-banner';
    banner.id = 'editModeBanner';
    banner.innerHTML = `
        <div>
            <div class="edit-mode-banner-title">📝 ${title}</div>
            <div style="font-size:12px;opacity:0.9;">${subtitle}</div>
        </div>
        <div class="edit-mode-banner-actions">
            <span id="editStatusText" style="font-size:13px;margin-right:8px;"></span>
            <button class="edit-mode-banner-btn submit" id="submitEditBtn" onclick="submitEdit()" disabled>提交反馈</button>
            <button class="edit-mode-banner-btn cancel" onclick="exitEditMode()">退出</button>
        </div>
    `;
    document.body.appendChild(banner);
    
    // 调整页面内容位置
    document.body.style.paddingTop = '60px';
}

function hideEditBanner() {
    const banner = document.getElementById('editModeBanner');
    if (banner) banner.remove();
    document.body.style.paddingTop = '';
}

// 标题行可编辑
function enableTitleEditing() {
    const song = window.currentSong;
    
    // 歌名可编辑
    const titleEl = document.getElementById('songTitle');
    if (titleEl) {
        titleEl.style.cursor = 'pointer';
        titleEl.title = '点击编辑歌名';
        titleEl.onclick = (e) => {
            e.stopPropagation();
            const newTitle = prompt('修改歌名：', song.title);
            if (newTitle !== null && newTitle.trim()) {
                editedMeta.title = newTitle.trim();
                titleEl.style.outline = '2px solid #28a745';
                titleEl.style.borderRadius = '4px';
                updateEditStatus();
            }
        };
    }
    
    // 歌手可编辑
    const artistEl = document.getElementById('songArtist');
    if (artistEl) {
        artistEl.style.cursor = 'pointer';
        artistEl.title = '点击编辑歌手';
        artistEl.onclick = (e) => {
            e.stopPropagation();
            const newArtist = prompt('修改歌手：', song.artist);
            if (newArtist !== null && newArtist.trim()) {
                editedMeta.artist = newArtist.trim();
                artistEl.style.outline = '2px solid #28a745';
                artistEl.style.borderRadius = '4px';
                updateEditStatus();
            }
        };
    }
    
    // 填词可编辑
    const lyricistEl = document.getElementById('songLyricist');
    if (lyricistEl) {
        lyricistEl.style.cursor = 'pointer';
        lyricistEl.title = '点击编辑填词';
        lyricistEl.onclick = (e) => {
            e.stopPropagation();
            const newLyricist = prompt('修改填词：', song.lyricist || '');
            if (newLyricist !== null) {
                editedMeta.lyricist = newLyricist.trim();
                lyricistEl.style.outline = '2px solid #28a745';
                lyricistEl.style.borderRadius = '4px';
                updateEditStatus();
            }
        };
    }
    
    // 作曲可编辑
    const composerEl = document.getElementById('songComposer');
    if (composerEl) {
        composerEl.style.cursor = 'pointer';
        composerEl.title = '点击编辑作曲';
        composerEl.onclick = (e) => {
            e.stopPropagation();
            const newComposer = prompt('修改作曲：', song.composer || '');
            if (newComposer !== null) {
                editedMeta.composer = newComposer.trim();
                composerEl.style.outline = '2px solid #28a745';
                composerEl.style.borderRadius = '4px';
                updateEditStatus();
            }
        };
    }
}

// 移除标题行编辑
function disableTitleEditing() {
    ['songTitle', 'songArtist', 'songLyricist', 'songComposer'].forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.style.cursor = '';
            el.title = '';
            el.onclick = null;
            el.style.outline = '';
        }
    });
}

// 逐行编辑：点击行
function handleLineClick(event, lineIndex) {
    event.stopPropagation();
    
    const song = window.currentSong;
    const line = song.lyrics[lineIndex];
    if (!line.chars) return;
    
    const originalText = line.chars.join('');
    const existingEdit = editedLyrics.find(e => e.lineIndex === lineIndex);
    const currentText = existingEdit ? existingEdit.newText : originalText;
    
    const newText = prompt(`修改第 ${lineIndex + 1} 行歌词：`, currentText);
    if (newText === null) return; // 取消
    
    if (newText === originalText) {
        // 删除已有的修改
        const idx = editedLyrics.findIndex(e => e.lineIndex === lineIndex);
        if (idx > -1) editedLyrics.splice(idx, 1);
    } else if (newText.trim()) {
        const idx = editedLyrics.findIndex(e => e.lineIndex === lineIndex);
        if (idx > -1) {
            editedLyrics[idx].newText = newText.trim();
        } else {
            editedLyrics.push({ lineIndex, originalText, newText: newText.trim() });
        }
    }
    
    updateEditStatus();
}

// 插入行：选择行
function selectInsertLine(event, lineIndex) {
    event.stopPropagation();
    
    const song = window.currentSong;
    let lineNum = 0;
    for (let i = 0; i <= lineIndex; i++) {
        if (song.lyrics[i].chars) lineNum++;
    }
    
    document.getElementById('insertLineNum').value = lineNum;
    updateInsertConfig();
    
    // 高亮选中的行
    document.querySelectorAll('.lyric-line').forEach(l => l.style.background = '');
    event.currentTarget.style.background = '#e6f7ff';
}

function updateFullLyrics(value) {
    fullReplacementLyrics = value.trim();
    updateEditStatus();
}

function updateInsertConfig() {
    const position = document.getElementById('insertPosition')?.value || 'after';
    const line = parseInt(document.getElementById('insertLineNum')?.value) || 1;
    const lyrics = document.getElementById('insertLyricsInput')?.value.trim() || '';
    
    insertData = { position, line, lyrics };
    updateEditStatus();
}

function updateEditStatus() {
    const statusText = document.getElementById('editStatusText');
    const submitBtn = document.getElementById('submitEditBtn');
    
    let hasData = false;
    let statusParts = [];
    
    // 标题修改
    const metaCount = Object.keys(editedMeta).length;
    if (metaCount > 0) {
        hasData = true;
        statusParts.push(`${metaCount} 处标题`);
    }
    
    switch (editLyricsType) {
        case 'line':
            if (editedLyrics.length > 0) {
                hasData = true;
                statusParts.push(`${editedLyrics.length} 处歌词`);
            }
            break;
        case 'full':
            if (fullReplacementLyrics) {
                hasData = true;
                statusParts.push('已输入歌词');
            }
            break;
        case 'insert':
            if (insertData.lyrics) {
                hasData = true;
                statusParts.push('已输入歌词');
            }
            break;
    }
    
    const status = statusParts.join('，');
    if (statusText) statusText.textContent = status;
    if (submitBtn) submitBtn.disabled = !hasData;
}

// 提交编辑
function submitEdit() {
    const song = window.currentSong;
    if (!song) return;
    
    let submitData = {
        type: 'lyrics',
        song: song.title,
        correctionType: editLyricsType
    };
    
    switch (editLyricsType) {
        case 'line':
            if (editedLyrics.length === 0) return;
            submitData.corrections = editedLyrics.map(e => ({
                line: e.lineIndex + 1,
                originalText: e.originalText,
                newText: e.newText
            }));
            break;
            
        case 'full':
            if (!fullReplacementLyrics) return;
            submitData.fullLyrics = fullReplacementLyrics;
            break;
            
        case 'insert':
            if (!insertData.lyrics) return;
            submitData.insert = insertData;
            break;
    }
    
    // 标题修改
    if (Object.keys(editedMeta).length > 0) {
        submitData.meta = editedMeta;
    }
    
    // 存储到 localStorage
    localStorage.setItem('submitForm', JSON.stringify(submitData));
    
    // 打开提交页面
    window.open('submit.html?type=lyrics', '_blank');
}

// 退出编辑模式
function exitEditMode() {
    editLyricsMode = false;
    editLyricsType = null;
    editedLyrics = [];
    editedMeta = {};
    fullReplacementLyrics = '';
    insertData = { position: 'after', line: 1, lyrics: '' };
    
    hideEditBanner();
    
    // 移除面板
    document.getElementById('fullReplacePanel')?.remove();
    document.getElementById('insertConfigPanel')?.remove();
    
    // 移除歌词点击事件
    document.querySelectorAll('.lyric-line').forEach(line => {
        line.onclick = null;
        line.style.cursor = '';
        line.style.background = '';
    });
    
    // 移除标题行编辑
    disableTitleEditing();
    
    // 移除编辑模式样式
    document.getElementById('lyricsContent')?.classList.remove('edit-lyrics-mode');
    
    updateEditLyricsBtn();
}

function updateEditLyricsBtn() {
    const btn = document.querySelector('.toolbar-btn[onclick="EditLyricsModule.toggle()"]');
    if (!btn) return;
    if (editLyricsMode) {
        btn.innerHTML = '<span class="icon">📝</span><span>退出改歌词</span>';
        btn.style.color = '#28a745';
    } else {
        btn.innerHTML = '<span class="icon">📝</span><span>改歌词</span>';
        btn.style.color = '';
    }
}

// 导出模块
window.EditLyricsModule = {
    toggle: toggleEditLyricsMode,
    isActive: () => editLyricsMode
};
