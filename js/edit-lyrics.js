// 修改歌词模式模块 - 子菜单选择版（带确认按钮）
// 功能：提供前端界面让用户编辑歌词，支持逐行纠错、整首替换、插入行三种模式
// 用户完成编辑后，数据存储在 localStorage 中，跳转到提交页面创建 Issue

// ============================================
// 状态变量定义
// ============================================
let editLyricsMode = false;      // 是否处于歌词编辑模式
let editLyricsType = null;       // 当前编辑类型：'line'（逐行）、'full'（整首）、'insert'（插入）
let editedLyrics = [];           // 逐行纠错的汇总数组 [{lineIndex, originalText, newText}]
let fullReplacements = [];       // 整首替换的汇总数组 [{lyrics}]
let insertions = [];             // 插入行的汇总数组 [{position, line, lyrics}]
let editedMeta = {};             // 标题修改对象 {title, artist, lyricist, composer}
let currentEdit = null;          // 当前正在编辑的内容（临时存储）

// ============================================
// 切换改歌词模式
// 功能：点击"改歌词"按钮时的入口函数
// 如果未选择歌曲则提示，如果已在编辑模式则退出
// ============================================
function toggleEditLyricsMode() {
    // 获取当前选中的歌曲
    const song = window.currentSong;
    if (!song) {
        // 未选择歌曲，提示用户
        alert('请先选择一首歌曲');
        return;
    }
    
    // 如果已在编辑模式，退出编辑
    if (editLyricsMode) {
        exitEditMode();
        return;
    }
    
    // 显示编辑类型选择弹窗
    showEditTypeSelector();
}

// ============================================
// 显示编辑类型选择弹窗
// 功能：弹出选择界面让用户选择编辑方式（逐行纠错/整首替换/插入行）
// ============================================
function showEditTypeSelector() {
    // 先移除可能已存在的弹窗
    hideEditTypeSelector();
    
    // 创建遮罩层
    const overlay = document.createElement('div');
    overlay.className = 'edit-type-overlay';
    overlay.id = 'editTypeOverlay';
    overlay.onclick = hideEditTypeSelector; // 点击遮罩关闭弹窗
    
    // 创建弹窗内容
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
    
    // 添加到页面
    document.body.appendChild(overlay);
    document.body.appendChild(popup);
    // 添加样式
    addEditStyles();
}

// ============================================
// 隐藏编辑类型选择弹窗
// 功能：移除弹窗和遮罩层
// ============================================
function hideEditTypeSelector() {
    document.getElementById('editTypeOverlay')?.remove();
    document.getElementById('editTypePopup')?.remove();
}

// ============================================
// 选择编辑类型
// 功能：用户选择编辑方式后的处理函数
//
// 参数：
//   - type: 编辑类型 'line'/'full'/'insert'
// ============================================
function selectEditType(type) {
    // 关闭选择弹窗
    hideEditTypeSelector();
    // 设置编辑类型和状态
    editLyricsType = type;
    editLyricsMode = true;
    // 重置所有编辑数据
    editedLyrics = [];
    fullReplacements = [];
    insertions = [];
    editedMeta = {};
    currentEdit = null;
    
    // 更新按钮状态
    updateEditLyricsBtn();
    
    // 根据类型进入对应编辑模式
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

// ============================================
// 逐行编辑模式
// 功能：进入逐行纠错模式，用户可以点击任意歌词行进行编辑
// ============================================
function enterLineEditMode() {
    // 获取歌词内容容器
    const lyricsContent = document.getElementById('lyricsContent');
    // 添加编辑模式样式类
    lyricsContent.classList.add('edit-lyrics-mode');
    
    // 显示编辑横幅提示
    showEditBanner('逐行纠错', '点击歌词行进行编辑，确认后添加到列表');
    // 启用标题编辑功能
    enableTitleEditing();
    
    // 为每行歌词添加点击事件
    document.querySelectorAll('.lyric-line').forEach((line) => {
        // 获取行索引
        const lineIndex = parseInt(line.dataset.line);
        if (isNaN(lineIndex)) return;
        // 绑定点击事件
        line.onclick = (e) => handleLineClick(e, lineIndex);
        // 设置鼠标样式为指针
        line.style.cursor = 'pointer';
    });
    
    // 显示已确认修改列表面板
    showEditListPanel();
}

// ============================================
// 整首替换模式
// 功能：进入整首替换模式，用户可以粘贴完整歌词替换整首
// ============================================
function enterFullReplaceMode() {
    // 获取歌词内容容器
    const lyricsContent = document.getElementById('lyricsContent');
    // 添加编辑模式样式类
    lyricsContent.classList.add('edit-lyrics-mode');
    
    // 显示编辑横幅提示
    showEditBanner('整首替换', '粘贴完整歌词，确认后添加到列表');
    // 启用标题编辑功能
    enableTitleEditing();
    
    // 显示整首替换输入面板
    showFullReplacePanel();
    // 显示已确认修改列表面板
    showEditListPanel();
}

// ============================================
// 插入行模式
// 功能：进入插入行模式，用户可以在指定位置插入新歌词
// ============================================
function enterInsertMode() {
    // 获取歌词内容容器
    const lyricsContent = document.getElementById('lyricsContent');
    // 添加编辑模式样式类
    lyricsContent.classList.add('edit-lyrics-mode');
    // 获取当前歌曲
    const song = window.currentSong;
    
    // 计算最大显示行号（考虑segment分割，书名号和括号内的空格不分割）
    let maxLine = 0;
    song.lyrics.forEach(l => {
        if (!l.chars) return;
        let segments = 1;
        let inBrackets = 0;
        for (const c of l.chars) {
            if (c === '《' || c === '(' || c === '（') inBrackets++;
            if (c === '》' || c === ')' || c === '）') inBrackets = Math.max(0, inBrackets - 1);
            if (c === ' ' && inBrackets === 0) segments++;
        }
        maxLine += segments;
    });
    
    // 显示编辑横幅提示
    showEditBanner('插入行', '选择位置并输入歌词，确认后添加到列表');
    // 启用标题编辑功能
    enableTitleEditing();
    
    // 显示插入行输入面板
    showInsertPanel(maxLine);
    // 显示已确认修改列表面板
    showEditListPanel();
    
    // 高亮显示可点击的行
    document.querySelectorAll('.lyric-line').forEach((line) => {
        const lineIndex = parseInt(line.dataset.line);
        if (isNaN(lineIndex)) return;
        // 绑定点击事件用于选择插入位置
        line.onclick = (e) => selectInsertLine(e, lineIndex);
        line.style.cursor = 'pointer';
    });
}

// ============================================
// 显示编辑列表面板（汇总已确认的内容）
// 功能：显示用户已确认的所有修改项列表
// ============================================
function showEditListPanel() {
    // 移除已存在的面板
    const existing = document.getElementById('editListPanel');
    if (existing) existing.remove();
    
    // 创建面板元素
    const panel = document.createElement('div');
    panel.className = 'edit-list-panel';
    panel.id = 'editListPanel';
    panel.innerHTML = `
        <div class="edit-list-title">已确认的修改</div>
        <div class="edit-list-content" id="editListContent">
            <div class="edit-list-empty">暂无修改，请在上方操作</div>
        </div>
    `;
    // 添加到页面
    document.body.appendChild(panel);
    
    // 更新列表内容
    updateEditList();
}

// ============================================
// 显示整首替换输入面板
// 功能：显示文本输入框让用户粘贴完整歌词
// ============================================
function showFullReplacePanel() {
    // 移除已存在的面板
    const existing = document.getElementById('fullReplaceInputPanel');
    if (existing) existing.remove();
    
    // 创建面板元素
    const panel = document.createElement('div');
    panel.className = 'edit-input-panel';
    panel.id = 'fullReplaceInputPanel';
    panel.innerHTML = `
        <div class="edit-input-title">整首替换</div>
        <textarea class="edit-input-textarea" id="fullLyricsInput" 
            placeholder="请粘贴完整的替换歌词&#10;&#10;格式：&#10;- 每句歌词单独一行&#10;- 段落之间空一行"></textarea>
        <button class="edit-input-confirm" onclick="confirmFullReplace()">确认添加</button>
    `;
    // 添加到页面
    document.body.appendChild(panel);
}

// ============================================
// 显示插入行输入面板
// 功能：显示位置选择和歌词输入界面
//
// 参数：
//   - maxLine: 最大行号，用于限制输入范围
// ============================================
function showInsertPanel(maxLine) {
    // 移除已存在的面板
    const existing = document.getElementById('insertInputPanel');
    if (existing) existing.remove();
    
    // 创建面板元素
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
    // 添加到页面
    document.body.appendChild(panel);
}

// ============================================
// 确认整首替换
// 功能：用户点击确认按钮后，将输入的歌词添加到整首替换列表
// ============================================
function confirmFullReplace() {
    // 获取输入的歌词
    const lyrics = document.getElementById('fullLyricsInput')?.value.trim();
    if (!lyrics) {
        // 未输入内容，提示用户
        alert('请输入完整歌词');
        return;
    }
    
    // 添加到整首替换数组
    fullReplacements.push({ lyrics });
    // 清空输入框
    document.getElementById('fullLyricsInput').value = '';
    // 更新列表显示
    updateEditList();
    // 更新状态显示
    updateEditStatus();
}

// ============================================
// 确认插入行
// 功能：用户点击确认按钮后，将插入信息添加到插入列表
// ============================================
function confirmInsert() {
    // 获取插入位置（前/后）
    const position = document.getElementById('insertPositionInput')?.value || 'after';
    // 获取行号
    const line = parseInt(document.getElementById('insertLineInput')?.value) || 1;
    // 获取要插入的歌词
    const lyrics = document.getElementById('insertLyricsInput')?.value;
    
    if (!lyrics) {
        // 未输入内容，提示用户
        alert('请输入要插入的歌词或空行');
        return;
    }
    
    // 添加到插入数组
    insertions.push({ position, line, lyrics });
    // 清空输入框
    document.getElementById('insertLyricsInput').value = '';
    // 更新列表显示
    updateEditList();
    // 更新状态显示
    updateEditStatus();
}

// ============================================
// 更新编辑列表显示
// 功能：刷新已确认修改列表面板的内容
// ============================================
function updateEditList() {
    // 获取列表内容容器
    const content = document.getElementById('editListContent');
    if (!content) return;
    
    let html = '';
    let count = 0;
    
    // 显示标题修改
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
    
    // 显示逐行纠错
    const song = window.currentSong;
    editedLyrics.forEach((item, idx) => {
        // 计算 displayLine（segment-based，与渲染逻辑一致）
        let displayLine = 0;
        for (let i = 0; i < item.lineIndex; i++) {
            if (song.lyrics[i].paragraphBreak) continue;
            if (!song.lyrics[i].chars) continue;
            let segments = 1;
            let inBrackets = 0;
            for (const c of song.lyrics[i].chars) {
                if (c === '《' || c === '(' || c === '（') inBrackets++;
                if (c === '》' || c === ')' || c === '）') inBrackets = Math.max(0, inBrackets - 1);
                if (c === ' ' && inBrackets === 0) segments++;
            }
            displayLine += segments;
        }
        displayLine += 1; // 转换为1-based索引
        html += `<div class="edit-list-item"><span class="edit-list-tag line">第${displayLine}行</span> ${item.newText.substring(0, 20)}${item.newText.length > 20 ? '...' : ''} <button onclick="removeLineEdit(${idx})" class="edit-list-remove">删除</button></div>`;
        count++;
    });
    
    // 显示整首替换
    fullReplacements.forEach((item, idx) => {
        const lines = item.lyrics.split('\\n').filter(l => l.trim()).length;
        html += `<div class="edit-list-item"><span class="edit-list-tag full">整首</span> ${lines}行歌词 <button onclick="removeFullReplace(${idx})" class="edit-list-remove">删除</button></div>`;
        count++;
    });
    
    // 显示插入行
    insertions.forEach((item, idx) => {
        const lines = item.lyrics.split('\\n').filter(l => l.trim()).length;
        html += `<div class="edit-list-item"><span class="edit-list-tag insert">插入</span> 第${item.line}行${item.position === 'before' ? '前' : '后'} ${lines}行 <button onclick="removeInsert(${idx})" class="edit-list-remove">删除</button></div>`;
        count++;
    });
    
    // 如果没有修改，显示空状态
    if (count === 0) {
        html = '<div class="edit-list-empty">暂无修改，请在上方操作</div>';
    }
    
    // 更新HTML
    content.innerHTML = html;
}

// ============================================
// 删除编辑项
// 功能：从对应数组中移除指定的编辑项
//
// 参数：
//   - idx: 数组索引
// ============================================
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

// ============================================
// 逐行编辑点击处理
// 功能：用户点击某行歌词时，弹出编辑框
//
// 参数：
//   - event: 点击事件对象
//   - displayLineIndex: 显示行索引（0-based）
// ============================================
function handleLineClick(event, displayLineIndex) {
    // 检查是否在编辑模式
    if (!editLyricsMode) return false;
    
    // 阻止事件冒泡
    event.stopPropagation();
    
    // 获取当前歌曲
    const song = window.currentSong;
    // displayLineIndex 是用户可见的行号，需要通过 data-song-index 获取实际的 song.lyrics 索引
    const songIndex = parseInt(event.currentTarget.dataset.songIndex);
    if (isNaN(songIndex)) return;
    const line = song.lyrics[songIndex];
    if (!line || !line.chars) return;
    
    // displayLineIndex + 1 就是用户看到的行号
    const displayLine = displayLineIndex + 1;
    
    // 获取原始歌词文本
    const originalText = line.chars.join('');
    // 检查是否已有编辑记录
    const existingEdit = editedLyrics.find(e => e.lineIndex === songIndex);
    const currentText = existingEdit ? existingEdit.newText : originalText;
    
    // 弹出编辑对话框
    const newText = prompt(`修改第 ${displayLine} 行歌词：`, currentText);
    if (newText === null) return; // 用户取消
    
    // 处理编辑结果
    if (newText === originalText) {
        // 内容与原文相同，如果有编辑记录则删除
        const idx = editedLyrics.findIndex(e => e.lineIndex === songIndex);
        if (idx > -1) editedLyrics.splice(idx, 1);
    } else if (newText.trim()) {
        // 有新内容，添加或更新编辑记录
        const idx = editedLyrics.findIndex(e => e.lineIndex === songIndex);
        if (idx > -1) {
            editedLyrics[idx].newText = newText.trim();
        } else {
            editedLyrics.push({ lineIndex: songIndex, originalText, newText: newText.trim() });
        }
    }
    
    // 更新列表和状态
    updateEditList();
    updateEditStatus();
}

// ============================================
// 选择插入行
// 功能：用户点击某行歌词时，将其设置为插入位置
//
// 参数：
//   - event: 点击事件对象
//   - displayLineIndex: 显示行索引（0-based）
// ============================================
function selectInsertLine(event, displayLineIndex) {
    // 阻止事件冒泡
    event.stopPropagation();
    
    // data-line 现在是 displayLineIndex（从0开始），+1 就是用户看到的行号
    const displayLine = displayLineIndex + 1;
    
    // 更新输入框中的行号
    const input = document.getElementById('insertLineInput');
    if (input) input.value = displayLine;
    
    // 高亮选中的行
    document.querySelectorAll('.lyric-line').forEach(l => l.style.background = '');
    event.currentTarget.style.background = '#e6f7ff';
}

// ============================================
// 显示编辑横幅
// 功能：在页面顶部显示编辑模式提示横幅
//
// 参数：
//   - title: 横幅标题
//   - subtitle: 横幅副标题/说明
// ============================================
function showEditBanner(title, subtitle) {
    // 移除已存在的横幅
    hideEditBanner();
    
    // 创建横幅元素
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
    // 添加到页面
    document.body.appendChild(banner);
    // 调整页面内容位置，避免被横幅遮挡
    document.body.style.paddingTop = '60px';
}

// ============================================
// 隐藏编辑横幅
// 功能：移除编辑模式横幅，恢复页面布局
// ============================================
function hideEditBanner() {
    document.getElementById('editModeBanner')?.remove();
    document.body.style.paddingTop = '';
}

// ============================================
// 标题行可编辑
// 功能：让用户可以编辑歌曲的元信息（歌名、歌手、填词、作曲）
// ============================================
function enableTitleEditing() {
    // 获取当前歌曲
    const song = window.currentSong;
    
    // 定义可编辑字段
    const fields = [
        { id: 'songTitle', key: 'title', label: '歌名', value: song.title },
        { id: 'songArtist', key: 'artist', label: '歌手', value: song.artist },
        { id: 'songLyricist', key: 'lyricist', label: '填词', value: song.lyricist || '' },
        { id: 'songComposer', key: 'composer', label: '作曲', value: song.composer || '' }
    ];
    
    // 为每个字段添加点击编辑功能
    fields.forEach(field => {
        const el = document.getElementById(field.id);
        if (el) {
            el.style.cursor = 'pointer';
            el.title = `点击编辑${field.label}`;
            el.onclick = (e) => {
                e.stopPropagation();
                // 弹出编辑对话框
                const newValue = prompt(`修改${field.label}：`, field.value);
                if (newValue !== null) {
                    // 保存修改
                    editedMeta[field.key] = newValue.trim();
                    // 添加视觉提示
                    el.style.outline = '2px solid #28a745';
                    el.style.borderRadius = '4px';
                    // 更新列表和状态
                    updateEditList();
                    updateEditStatus();
                }
            };
        }
    });
}

// ============================================
// 禁用标题编辑
// 功能：退出编辑模式时，移除标题的编辑功能
// ============================================
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

// ============================================
// 更新编辑状态
// 功能：更新横幅上的修改计数和提交按钮状态
// ============================================
function updateEditStatus() {
    const statusText = document.getElementById('editStatusText');
    const submitBtn = document.getElementById('submitEditBtn');
    
    // 计算总修改数
    const metaCount = Object.keys(editedMeta).length;
    const totalCount = metaCount + editedLyrics.length + fullReplacements.length + insertions.length;
    
    // 更新状态文本
    if (statusText) statusText.textContent = totalCount > 0 ? `${totalCount} 处修改` : '';
    // 启用/禁用提交按钮
    if (submitBtn) submitBtn.disabled = totalCount === 0;
}

// ============================================
// 提交编辑
// 功能：将编辑数据保存到 localStorage，并跳转到提交页面
// ============================================
function submitEdit() {
    // 获取当前歌曲
    const song = window.currentSong;
    if (!song) return;
    
    // 构建提交数据对象
    let submitData = {
        type: 'lyrics',
        song: song.title,
        correctionType: editLyricsType
    };
    
    // 添加标题修改
    if (Object.keys(editedMeta).length > 0) {
        submitData.meta = editedMeta;
    }
    
    // 根据编辑类型添加对应数据
    switch (editLyricsType) {
        case 'line':
            // 逐行纠错模式
            if (editedLyrics.length === 0) return;
            submitData.corrections = editedLyrics.map(e => {
                // 计算 displayLine（segment-based，与渲染逻辑一致）
                let displayLine = 0;
                for (let i = 0; i < e.lineIndex; i++) {
                    if (song.lyrics[i].paragraphBreak) continue;
                    if (!song.lyrics[i].chars) continue;
                    let segments = 1;
                    let inBrackets = 0;
                    for (const c of song.lyrics[i].chars) {
                        if (c === '《' || c === '(' || c === '（') inBrackets++;
                        if (c === '》' || c === ')' || c === '）') inBrackets = Math.max(0, inBrackets - 1);
                        if (c === ' ' && inBrackets === 0) segments++;
                    }
                    displayLine += segments;
                }
                displayLine += 1; // 转换为1-based索引
                return {
                    line: displayLine,
                    originalText: e.originalText,
                    newText: e.newText
                };
            });
            break;
            
        case 'full':
            // 整首替换模式
            if (fullReplacements.length === 0) return;
            // 如果有多个整首替换，取最后一个（或合并）
            submitData.fullLyrics = fullReplacements[fullReplacements.length - 1].lyrics;
            break;
            
        case 'insert':
            // 插入行模式
            if (insertions.length === 0) return;
            // 传递所有插入项
            submitData.insertions = insertions;
            break;
    }
    
    // 保存到 localStorage
    localStorage.setItem('submitForm', JSON.stringify(submitData));
    // 跳转到提交页面
    window.open('submit.html?type=lyrics', '_blank');
}

// ============================================
// 退出编辑模式
// 功能：清理所有编辑状态，恢复页面到正常模式
// ============================================
function exitEditMode() {
    // 重置状态变量
    editLyricsMode = false;
    editLyricsType = null;
    editedLyrics = [];
    fullReplacements = [];
    insertions = [];
    editedMeta = {};
    currentEdit = null;
    
    // 移除所有编辑相关UI元素
    hideEditBanner();
    document.getElementById('editListPanel')?.remove();
    document.getElementById('fullReplaceInputPanel')?.remove();
    document.getElementById('insertInputPanel')?.remove();
    
    // 移除歌词行的点击事件和样式
    document.querySelectorAll('.lyric-line').forEach(line => {
        line.onclick = null;
        line.style.cursor = '';
        line.style.background = '';
    });
    
    // 禁用标题编辑
    disableTitleEditing();
    // 移除编辑模式样式类
    document.getElementById('lyricsContent')?.classList.remove('edit-lyrics-mode');
    
    // 更新按钮显示
    updateEditLyricsBtn();
}

// ============================================
// 更新改歌词按钮
// 功能：根据编辑状态更新按钮的显示文字和样式
// ============================================
function updateEditLyricsBtn() {
    // 获取按钮元素
    const btn = document.querySelector('.toolbar-btn[onclick="EditLyricsModule.toggle()"]');
    if (!btn) return;
    
    // SVG图标
    const svgIcon = '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.375 2.625a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4Z"/></svg>';
    
    // 根据编辑状态更新按钮
    if (editLyricsMode) {
        btn.innerHTML = `<span class="icon">${svgIcon}</span><span>退出改歌词</span>`;
        btn.style.color = '#28a745';
    } else {
        btn.innerHTML = `<span class="icon">${svgIcon}</span><span>改歌词</span>`;
        btn.style.color = '';
    }
}

// ============================================
// 添加编辑样式
// 功能：动态添加编辑模式所需的 CSS 样式
// ============================================
function addEditStyles() {
    // 检查样式是否已存在
    if (document.getElementById('editLyricsStyles')) return;
    
    // 创建样式元素
    const styles = document.createElement('style');
    styles.id = 'editLyricsStyles';
    styles.textContent = `
        /* 编辑类型选择弹窗遮罩 */
        .edit-type-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); z-index: 2000; }
        /* 编辑类型选择弹窗 */
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
        
        /* 编辑模式横幅 */
        .edit-mode-banner { position: fixed; top: 0; left: 0; right: 0; background: #28a745; color: #fff; padding: 12px 20px; display: flex; justify-content: space-between; align-items: center; z-index: 1000; }
        .edit-mode-banner-title { font-weight: 600; display: flex; align-items: center; gap: 8px; }
        .edit-mode-banner-actions { display: flex; gap: 12px; }
        .edit-mode-banner-btn { padding: 8px 16px; border: none; border-radius: 4px; font-size: 14px; cursor: pointer; }
        .edit-mode-banner-btn.submit { background: #fff; color: #28a745; font-weight: 600; }
        .edit-mode-banner-btn.submit:disabled { background: rgba(255,255,255,0.5); cursor: not-allowed; }
        .edit-mode-banner-btn.cancel { background: rgba(255,255,255,0.2); color: #fff; }
        
        /* 编辑列表面板 */
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
        
        /* 输入面板 */
        .edit-input-panel { position: fixed; top: 70px; right: 360px; width: 300px; background: #fff; border-radius: 8px; box-shadow: 0 4px 16px rgba(0,0,0,0.15); padding: 16px; z-index: 999; }
        .edit-input-title { font-weight: 600; margin-bottom: 12px; color: #333; }
        .edit-input-row { display: flex; gap: 8px; margin-bottom: 12px; }
        .edit-input-row select, .edit-input-row input { flex: 1; padding: 8px; border: 1px solid #d9d9d9; border-radius: 4px; }
        .edit-input-textarea { width: 100%; min-height: 150px; padding: 12px; border: 1px solid #d9d9d9; border-radius: 4px; resize: vertical; font-family: inherit; margin-bottom: 12px; }
        .edit-input-confirm { width: 100%; padding: 10px; background: #28a745; color: #fff; border: none; border-radius: 4px; cursor: pointer; font-size: 14px; }
        .edit-input-confirm:hover { background: #218838; }
    `;
    // 添加到页面头部
    document.head.appendChild(styles);
}

// ============================================
// 模块导出
// 将功能挂载到全局对象，供其他脚本调用
// ============================================
window.EditLyricsModule = {
    toggle: toggleEditLyricsMode,
    isActive: () => editLyricsMode,
    handleLineClick: handleLineClick
};
