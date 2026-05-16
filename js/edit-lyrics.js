// 修改歌词模式模块 - 子菜单选择版（带确认按钮）

let editLyricsMode = false;
let editLyricsType = null; // 'line', 'full', 'insert'
let editedLyrics = []; // 逐行纠错的汇总 [{lineIndex, originalText, newText}]
let fullReplacements = []; // 整首替换的汇总 [{lyrics}]
let insertions = []; // 插入行的汇总 [{position, line, lyrics}]
let editedMeta = {}; // 标题修改 {title, artist, lyricist, composer}
let currentEdit = null; // 当前正在编辑的内容

// 点击改歌词按钮 - 显示子菜单选择
function toggleEditLyricsMode() {
    const song = window.currentSong;
    if (!song) {
        alert('请先选择一首歌曲');
        return;
    }
    
    if (editLyricsMode) {
        exitEditMode();
        return;
    }
    
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
                <div class="edit-type-icon"><svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/></svg></div>
                <div class="edit-type-name">逐行纠错</div>
                <div class="edit-type-desc">点击歌词行进行编辑</div>
            </div>
            <div class="edit-type-option" onclick="selectEditType('full')">
                <div class="edit-type-icon"><svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"/><path d="M16 16h5v5"/></svg></div>
                <div class="edit-type-name">整首替换</div>
                <div class="edit-type-desc">粘贴完整歌词替换整首</div>
            </div>
            <div class="edit-type-option" onclick="selectEditType('insert')">
                <div class="edit-type-icon"><svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg></div>
                <div class="edit-type-name">插入行</div>
                <div class="edit-type-desc">在指定位置插入新歌词</div>
            </div>
        </div>
        <button class="edit-type-cancel" onclick="hideEditTypeSelector()">取消</button>
    `;
    
    document.body.appendChild(overlay);
    document.body.appendChild(popup);
    addEditStyles();
}

function hideEditTypeSelector() {
    document.getElementById('editTypeOverlay')?.remove();
    document.getElementById('editTypePopup')?.remove();
}

function selectEditType(type) {
    hideEditTypeSelector();
    editLyricsType = type;
    editLyricsMode = true;
    editedLyrics = [];
    fullReplacements = [];
    insertions = [];
    editedMeta = {};
    currentEdit = null;
    
    updateEditLyricsBtn();
    
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
    
    showEditBanner('逐行纠错', '点击歌词行进行编辑，确认后添加到列表');
    enableTitleEditing();
    
    document.querySelectorAll('.lyric-line').forEach((line, idx) => {
        line.onclick = (e) => handleLineClick(e, idx);
        line.style.cursor = 'pointer';
    });
    
    showEditListPanel();
}

// 整首替换模式
function enterFullReplaceMode() {
    const lyricsContent = document.getElementById('lyricsContent');
    lyricsContent.classList.add('edit-lyrics-mode');
    
    showEditBanner('整首替换', '粘贴完整歌词，确认后添加到列表');
    enableTitleEditing();
    
    showFullReplacePanel();
    showEditListPanel();
}

// 插入行模式
function enterInsertMode() {
    const lyricsContent = document.getElementById('lyricsContent');
    lyricsContent.classList.add('edit-lyrics-mode');
    const song = window.currentSong;
    const maxLine = song.lyrics.filter(l => l.chars).length;
    
    showEditBanner('插入行', '选择位置并输入歌词，确认后添加到列表');
    enableTitleEditing();
    
    showInsertPanel(maxLine);
    showEditListPanel();
    
    // 高亮显示可点击的行
    document.querySelectorAll('.lyric-line').forEach((line, idx) => {
        line.onclick = (e) => selectInsertLine(e, idx);
        line.style.cursor = 'pointer';
    });
}

// 显示编辑列表面板（汇总已确认的内容）
function showEditListPanel() {
    const existing = document.getElementById('editListPanel');
    if (existing) existing.remove();
    
    const panel = document.createElement('div');
    panel.className = 'edit-list-panel';
    panel.id = 'editListPanel';
    panel.innerHTML = `
        <div class="edit-list-title">已确认的修改</div>
        <div class="edit-list-content" id="editListContent">
            <div class="edit-list-empty">暂无修改，请在上方操作</div>
        </div>
    `;
    document.body.appendChild(panel);
    
    updateEditList();
}

// 显示整首替换输入面板
function showFullReplacePanel() {
    const existing = document.getElementById('fullReplaceInputPanel');
    if (existing) existing.remove();
    
    const panel = document.createElement('div');
    panel.className = 'edit-input-panel';
    panel.id = 'fullReplaceInputPanel';
    panel.innerHTML = `
        <div class="edit-input-title">整首替换</div>
        <textarea class="edit-input-textarea" id="fullLyricsInput" 
            placeholder="请粘贴完整的替换歌词&#10;&#10;格式：&#10;- 每句歌词单独一行&#10;- 段落之间空一行"></textarea>
        <button class="edit-input-confirm" onclick="confirmFullReplace()">确认添加</button>
    `;
    document.body.appendChild(panel);
}

// 显示插入行输入面板
function showInsertPanel(maxLine) {
    const existing = document.getElementById('insertInputPanel');
    if (existing) existing.remove();
    
    const panel = document.createElement('div');
    panel.className = 'edit-input-panel';
    panel.id = 'insertInputPanel';
    panel.innerHTML = `
        <div class="edit-input-title">插入行</div>
        <div class="edit-input-row">
            <select id="insertPositionInput">
                <option value="after">在行后插入</option>
                <option value="before">在行前插入</option>
            </select>
            <input type="number" id="insertLineInput" min="1" max="${maxLine}" value="1" placeholder="行号">
        </div>
        <textarea class="edit-input-textarea" id="insertLyricsInput" 
            placeholder="请粘贴要插入的歌词&#10;可以一次插入多行，每行一句"></textarea>
        <button class="edit-input-confirm" onclick="confirmInsert()">确认添加</button>
    `;
    document.body.appendChild(panel);
}

// 确认整首替换
function confirmFullReplace() {
    const lyrics = document.getElementById('fullLyricsInput')?.value.trim();
    if (!lyrics) {
        alert('请输入完整歌词');
        return;
    }
    
    fullReplacements.push({ lyrics });
    document.getElementById('fullLyricsInput').value = '';
    updateEditList();
    updateEditStatus();
}

// 确认插入行
function confirmInsert() {
    const position = document.getElementById('insertPositionInput')?.value || 'after';
    const line = parseInt(document.getElementById('insertLineInput')?.value) || 1;
    const lyrics = document.getElementById('insertLyricsInput')?.value.trim();
    
    if (!lyrics) {
        alert('请输入要插入的歌词');
        return;
    }
    
    insertions.push({ position, line, lyrics });
    document.getElementById('insertLyricsInput').value = '';
    updateEditList();
    updateEditStatus();
}

// 更新编辑列表显示
function updateEditList() {
    const content = document.getElementById('editListContent');
    if (!content) return;
    
    let html = '';
    let count = 0;
    
    // 标题修改
    if (editedMeta.title) {
        html += `<div class="edit-list-item"><span class="edit-list-tag meta">歌名</span> ${editedMeta.title}</div>`;
        count++;
    }
    if (editedMeta.artist) {
        html += `<div class="edit-list-item"><span class="edit-list-tag meta">歌手</span> ${editedMeta.artist}</div>`;
        count++;
    }
    if (editedMeta.lyricist) {
        html += `<div class="edit-list-item"><span class="edit-list-tag meta">填词</span> ${editedMeta.lyricist}</div>`;
        count++;
    }
    if (editedMeta.composer) {
        html += `<div class="edit-list-item"><span class="edit-list-tag meta">作曲</span> ${editedMeta.composer}</div>`;
        count++;
    }
    
    // 逐行纠错
    editedLyrics.forEach((item, idx) => {
        html += `<div class="edit-list-item"><span class="edit-list-tag line">第${item.lineIndex + 1}行</span> ${item.newText.substring(0, 20)}${item.newText.length > 20 ? '...' : ''} <button onclick="removeLineEdit(${idx})" class="edit-list-remove">删除</button></div>`;
        count++;
    });
    
    // 整首替换
    fullReplacements.forEach((item, idx) => {
        const lines = item.lyrics.split('\\n').filter(l => l.trim()).length;
        html += `<div class="edit-list-item"><span class="edit-list-tag full">整首</span> ${lines}行歌词 <button onclick="removeFullReplace(${idx})" class="edit-list-remove">删除</button></div>`;
        count++;
    });
    
    // 插入行
    insertions.forEach((item, idx) => {
        const lines = item.lyrics.split('\\n').filter(l => l.trim()).length;
        html += `<div class="edit-list-item"><span class="edit-list-tag insert">插入</span> 第${item.line}行${item.position === 'before' ? '前' : '后'} ${lines}行 <button onclick="removeInsert(${idx})" class="edit-list-remove">删除</button></div>`;
        count++;
    });
    
    if (count === 0) {
        html = '<div class="edit-list-empty">暂无修改，请在上方操作</div>';
    }
    
    content.innerHTML = html;
}

// 删除编辑项
function removeLineEdit(idx) {
    editedLyrics.splice(idx, 1);
    updateEditList();
    updateEditStatus();
}

function removeFullReplace(idx) {
    fullReplacements.splice(idx, 1);
    updateEditList();
    updateEditStatus();
}

function removeInsert(idx) {
    insertions.splice(idx, 1);
    updateEditList();
    updateEditStatus();
}

// 原有的逐行编辑点击处理
function handleLineClick(event, lineIndex) {
    event.stopPropagation();
    
    const song = window.currentSong;
    const line = song.lyrics[lineIndex];
    if (!line.chars) return;
    
    const originalText = line.chars.join('');
    const existingEdit = editedLyrics.find(e => e.lineIndex === lineIndex);
    const currentText = existingEdit ? existingEdit.newText : originalText;
    
    const newText = prompt(`修改第 ${lineIndex + 1} 行歌词：`, currentText);
    if (newText === null) return;
    
    if (newText === originalText) {
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
    
    updateEditList();
    updateEditStatus();
}

// 选择插入行
function selectInsertLine(event, lineIndex) {
    event.stopPropagation();
    
    const song = window.currentSong;
    let lineNum = 0;
    for (let i = 0; i <= lineIndex; i++) {
        if (song.lyrics[i].chars) lineNum++;
    }
    
    const input = document.getElementById('insertLineInput');
    if (input) input.value = lineNum;
    
    document.querySelectorAll('.lyric-line').forEach(l => l.style.background = '');
    event.currentTarget.style.background = '#e6f7ff';
}

// 显示编辑横幅
function showEditBanner(title, subtitle) {
    hideEditBanner();
    
    const banner = document.createElement('div');
    banner.className = 'edit-mode-banner';
    banner.id = 'editModeBanner';
    banner.innerHTML = `
        <div>
            <div class="edit-mode-banner-title"><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.375 2.625a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4Z"/></svg> ${title}</div>
            <div style="font-size:12px;opacity:0.9;">${subtitle}</div>
        </div>
        <div class="edit-mode-banner-actions">
            <span id="editStatusText" style="font-size:13px;margin-right:8px;"></span>
            <button class="edit-mode-banner-btn submit" id="submitEditBtn" onclick="submitEdit()" disabled>提交反馈</button>
            <button class="edit-mode-banner-btn cancel" onclick="exitEditMode()">退出</button>
        </div>
    `;
    document.body.appendChild(banner);
    document.body.style.paddingTop = '60px';
}

function hideEditBanner() {
    document.getElementById('editModeBanner')?.remove();
    document.body.style.paddingTop = '';
}

// 标题行可编辑
function enableTitleEditing() {
    const song = window.currentSong;
    
    const fields = [
        { id: 'songTitle', key: 'title', label: '歌名', value: song.title },
        { id: 'songArtist', key: 'artist', label: '歌手', value: song.artist },
        { id: 'songLyricist', key: 'lyricist', label: '填词', value: song.lyricist || '' },
        { id: 'songComposer', key: 'composer', label: '作曲', value: song.composer || '' }
    ];
    
    fields.forEach(field => {
        const el = document.getElementById(field.id);
        if (el) {
            el.style.cursor = 'pointer';
            el.title = `点击编辑${field.label}`;
            el.onclick = (e) => {
                e.stopPropagation();
                const newValue = prompt(`修改${field.label}：`, field.value);
                if (newValue !== null) {
                    editedMeta[field.key] = newValue.trim();
                    el.style.outline = '2px solid #28a745';
                    el.style.borderRadius = '4px';
                    updateEditList();
                    updateEditStatus();
                }
            };
        }
    });
}

function disableTitleEditing() {
    ['songTitle', 'songArtist', 'songLyricist', 'songComposer'].forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.style.cursor = '';
            el.title = '';
            el.onclick = null;
            el.style.outline = '';
            el.style.borderRadius = '';
        }
    });
}

function updateEditStatus() {
    const statusText = document.getElementById('editStatusText');
    const submitBtn = document.getElementById('submitEditBtn');
    
    const metaCount = Object.keys(editedMeta).length;
    const totalCount = metaCount + editedLyrics.length + fullReplacements.length + insertions.length;
    
    if (statusText) statusText.textContent = totalCount > 0 ? `${totalCount} 处修改` : '';
    if (submitBtn) submitBtn.disabled = totalCount === 0;
}

function submitEdit() {
    const song = window.currentSong;
    if (!song) return;
    
    let submitData = {
        type: 'lyrics',
        song: song.title,
        correctionType: editLyricsType
    };
    
    // 标题修改
    if (Object.keys(editedMeta).length > 0) {
        submitData.meta = editedMeta;
    }
    
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
            if (fullReplacements.length === 0) return;
            // 如果有多个整首替换，取最后一个（或合并）
            submitData.fullLyrics = fullReplacements[fullReplacements.length - 1].lyrics;
            break;
            
        case 'insert':
            if (insertions.length === 0) return;
            // 传递所有插入项
            submitData.insertions = insertions;
            break;
    }
    
    localStorage.setItem('submitForm', JSON.stringify(submitData));
    window.open('submit.html?type=lyrics', '_blank');
}

function exitEditMode() {
    editLyricsMode = false;
    editLyricsType = null;
    editedLyrics = [];
    fullReplacements = [];
    insertions = [];
    editedMeta = {};
    currentEdit = null;
    
    hideEditBanner();
    document.getElementById('editListPanel')?.remove();
    document.getElementById('fullReplaceInputPanel')?.remove();
    document.getElementById('insertInputPanel')?.remove();
    
    document.querySelectorAll('.lyric-line').forEach(line => {
        line.onclick = null;
        line.style.cursor = '';
        line.style.background = '';
    });
    
    disableTitleEditing();
    document.getElementById('lyricsContent')?.classList.remove('edit-lyrics-mode');
    
    updateEditLyricsBtn();
}

function updateEditLyricsBtn() {
    const btn = document.querySelector('.toolbar-btn[onclick="EditLyricsModule.toggle()"]');
    if (!btn) return;
    
    const svgIcon = '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.375 2.625a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4Z"/></svg>';
    
    if (editLyricsMode) {
        btn.innerHTML = `<span class="icon">${svgIcon}</span><span>退出改歌词</span>`;
        btn.style.color = '#28a745';
    } else {
        btn.innerHTML = `<span class="icon">${svgIcon}</span><span>改歌词</span>`;
        btn.style.color = '';
    }
}

function addEditStyles() {
    if (document.getElementById('editLyricsStyles')) return;
    
    const styles = document.createElement('style');
    styles.id = 'editLyricsStyles';
    styles.textContent = `
        .edit-type-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); z-index: 2000; }
        .edit-type-popup { position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); background: #fff; border-radius: 12px; padding: 24px; width: 360px; max-width: 90vw; z-index: 2001; box-shadow: 0 8px 32px rgba(0,0,0,0.2); }
        .edit-type-title { font-size: 18px; font-weight: 600; text-align: center; margin-bottom: 20px; color: #333; }
        .edit-type-options { display: flex; flex-direction: column; gap: 12px; margin-bottom: 20px; }
        .edit-type-option { display: flex; align-items: center; padding: 16px; border: 2px solid #e8e8e8; border-radius: 8px; cursor: pointer; transition: all 0.2s; }
        .edit-type-option:hover { border-color: #28a745; background: #f6ffed; }
        .edit-type-icon { margin-right: 16px; width: 40px; text-align: center; display: flex; align-items: center; justify-content: center; color: #28a745; }
        .edit-type-name { font-size: 16px; font-weight: 600; color: #333; }
        .edit-type-desc { font-size: 13px; color: #999; margin-left: auto; }
        .edit-type-cancel { width: 100%; padding: 12px; background: #f5f5f5; border: none; border-radius: 6px; font-size: 15px; cursor: pointer; color: #666; }
        .edit-type-cancel:hover { background: #e8e8e8; }
        
        .edit-mode-banner { position: fixed; top: 0; left: 0; right: 0; background: #28a745; color: #fff; padding: 12px 20px; display: flex; justify-content: space-between; align-items: center; z-index: 1000; }
        .edit-mode-banner-title { font-weight: 600; display: flex; align-items: center; gap: 8px; }
        .edit-mode-banner-actions { display: flex; gap: 12px; }
        .edit-mode-banner-btn { padding: 8px 16px; border: none; border-radius: 4px; font-size: 14px; cursor: pointer; }
        .edit-mode-banner-btn.submit { background: #fff; color: #28a745; font-weight: 600; }
        .edit-mode-banner-btn.submit:disabled { background: rgba(255,255,255,0.5); cursor: not-allowed; }
        .edit-mode-banner-btn.cancel { background: rgba(255,255,255,0.2); color: #fff; }
        
        .edit-list-panel { position: fixed; top: 70px; right: 20px; width: 320px; max-height: calc(100vh - 100px); background: #fff; border-radius: 8px; box-shadow: 0 4px 16px rgba(0,0,0,0.15); padding: 16px; z-index: 999; overflow-y: auto; }
        .edit-list-title { font-weight: 600; margin-bottom: 12px; color: #333; border-bottom: 1px solid #e8e8e8; padding-bottom: 8px; }
        .edit-list-content { font-size: 14px; }
        .edit-list-empty { color: #999; text-align: center; padding: 20px; }
        .edit-list-item { padding: 8px 12px; background: #f5f5f5; border-radius: 4px; margin-bottom: 8px; display: flex; align-items: center; gap: 8px; }
        .edit-list-tag { font-size: 12px; padding: 2px 8px; border-radius: 4px; color: #fff; white-space: nowrap; }
        .edit-list-tag.meta { background: #1890ff; }
        .edit-list-tag.line { background: #52c41a; }
        .edit-list-tag.full { background: #fa8c16; }
        .edit-list-tag.insert { background: #722ed1; }
        .edit-list-remove { margin-left: auto; background: #ff4d4f; color: #fff; border: none; border-radius: 4px; padding: 2px 8px; font-size: 12px; cursor: pointer; }
        
        .edit-input-panel { position: fixed; top: 70px; right: 360px; width: 300px; background: #fff; border-radius: 8px; box-shadow: 0 4px 16px rgba(0,0,0,0.15); padding: 16px; z-index: 999; }
        .edit-input-title { font-weight: 600; margin-bottom: 12px; color: #333; }
        .edit-input-row { display: flex; gap: 8px; margin-bottom: 12px; }
        .edit-input-row select, .edit-input-row input { flex: 1; padding: 8px; border: 1px solid #d9d9d9; border-radius: 4px; }
        .edit-input-textarea { width: 100%; min-height: 150px; padding: 12px; border: 1px solid #d9d9d9; border-radius: 4px; resize: vertical; font-family: inherit; margin-bottom: 12px; }
        .edit-input-confirm { width: 100%; padding: 10px; background: #28a745; color: #fff; border: none; border-radius: 4px; cursor: pointer; font-size: 14px; }
        .edit-input-confirm:hover { background: #218838; }
    `;
    document.head.appendChild(styles);
}

window.EditLyricsModule = {
    toggle: toggleEditLyricsMode,
    isActive: () => editLyricsMode
};
