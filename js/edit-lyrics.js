// 修改歌词模式模块 - 增强版
// 支持：逐行纠错、整首替换、插入行

let editLyricsMode = false;
let editLyricsType = 'line'; // 'line', 'full', 'insert'
let editedLyrics = []; // { lineIndex, originalText, newText }
let fullReplacementLyrics = '';
let insertData = { position: 'after', line: 1, lyrics: '' };

function toggleEditLyricsMode() {
    editLyricsMode = !editLyricsMode;
    const lyricsContent = document.getElementById('lyricsContent');

    if (editLyricsMode) {
        if (window.CorrectionModule && window.CorrectionModule.isActive()) {
            window.CorrectionModule.toggle();
        }
        lyricsContent.classList.add('edit-lyrics-mode');
        editedLyrics = [];
        fullReplacementLyrics = '';
        insertData = { position: 'after', line: 1, lyrics: '' };
        showEditLyricsMenu();
        updateEditLyricsBtn();
    } else {
        lyricsContent.classList.remove('edit-lyrics-mode');
        hideEditLyricsMenu();
        clearEditLyricsSelection();
        updateEditLyricsBtn();
    }
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

// 显示改歌词菜单（子菜单形式）
function showEditLyricsMenu() {
    hideEditLyricsMenu();
    
    const song = window.currentSong;
    if (!song) {
        alert('请先选择一首歌曲');
        toggleEditLyricsMode();
        return;
    }

    const menu = document.createElement('div');
    menu.className = 'edit-lyrics-menu';
    menu.id = 'editLyricsMenu';
    menu.innerHTML = `
        <div class="edit-lyrics-menu-header">
            <span>📝 修改歌词 - ${song.title}</span>
            <button class="edit-lyrics-menu-close" onclick="EditLyricsModule.toggle()">✕</button>
        </div>
        <div class="edit-lyrics-menu-tabs">
            <div class="edit-lyrics-tab active" data-type="line" onclick="switchEditType('line')">
                <span class="tab-icon">✏️</span>
                <span class="tab-text">逐行纠错</span>
            </div>
            <div class="edit-lyrics-tab" data-type="full" onclick="switchEditType('full')">
                <span class="tab-icon">🔄</span>
                <span class="tab-text">整首替换</span>
            </div>
            <div class="edit-lyrics-tab" data-type="insert" onclick="switchEditType('insert')">
                <span class="tab-icon">➕</span>
                <span class="tab-text">插入行</span>
            </div>
        </div>
        <div class="edit-lyrics-content">
            <!-- 逐行纠错 -->
            <div class="edit-lyrics-panel active" id="panel-line">
                <div class="edit-lyrics-hint">点击左侧歌词行进行编辑</div>
                <div class="edit-lyrics-list" id="editLyricsList"></div>
                <button class="edit-lyrics-submit" onclick="submitEditLyrics()" disabled id="submitLineBtn">
                    提交纠错 (${editedLyrics.length}处)
                </button>
            </div>
            <!-- 整首替换 -->
            <div class="edit-lyrics-panel" id="panel-full">
                <div class="edit-lyrics-hint">粘贴完整歌词替换整首歌曲</div>
                <textarea class="edit-lyrics-textarea" id="fullLyricsText" 
                    placeholder="请粘贴完整的替换歌词&#10;&#10;格式：&#10;- 每句歌词单独一行&#10;- 段落之间空一行"
                    oninput="updateFullLyrics(this.value)"></textarea>
                <button class="edit-lyrics-submit" onclick="submitFullReplacement()" disabled id="submitFullBtn">
                    提交整首替换
                </button>
            </div>
            <!-- 插入行 -->
            <div class="edit-lyrics-panel" id="panel-insert">
                <div class="edit-lyrics-insert-config">
                    <label>插入位置：</label>
                    <select id="insertPosition" onchange="updateInsertData()">
                        <option value="after">在第...行后插入</option>
                        <option value="before">在第...行前插入</option>
                    </select>
                    <input type="number" id="insertLineNum" min="1" max="${song.lyrics.filter(l => l.chars).length}" 
                        value="1" onchange="updateInsertData()">
                </div>
                <div class="edit-lyrics-hint">要插入的歌词（每行一句）：</div>
                <textarea class="edit-lyrics-textarea" id="insertLyricsText" 
                    placeholder="请粘贴要插入的歌词&#10;可以一次插入多行"
                    oninput="updateInsertData()"></textarea>
                <button class="edit-lyrics-submit" onclick="submitInsert()" disabled id="submitInsertBtn">
                    提交插入
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(menu);
    
    // 添加样式
    if (!document.getElementById('editLyricsStyles')) {
        const styles = document.createElement('style');
        styles.id = 'editLyricsStyles';
        styles.textContent = `
            .edit-lyrics-menu {
                position: fixed;
                right: 0;
                top: 0;
                width: 400px;
                height: 100vh;
                background: #fff;
                box-shadow: -2px 0 8px rgba(0,0,0,0.15);
                z-index: 1000;
                display: flex;
                flex-direction: column;
            }
            .edit-lyrics-menu-header {
                padding: 16px 20px;
                background: #28a745;
                color: #fff;
                display: flex;
                justify-content: space-between;
                align-items: center;
                font-weight: 600;
            }
            .edit-lyrics-menu-close {
                background: none;
                border: none;
                color: #fff;
                font-size: 20px;
                cursor: pointer;
                padding: 0;
                width: 32px;
                height: 32px;
                display: flex;
                align-items: center;
                justify-content: center;
                border-radius: 4px;
            }
            .edit-lyrics-menu-close:hover {
                background: rgba(255,255,255,0.2);
            }
            .edit-lyrics-menu-tabs {
                display: flex;
                border-bottom: 1px solid #e8e8e8;
            }
            .edit-lyrics-tab {
                flex: 1;
                padding: 12px 8px;
                text-align: center;
                cursor: pointer;
                border-bottom: 2px solid transparent;
                transition: all 0.2s;
                font-size: 13px;
            }
            .edit-lyrics-tab:hover {
                background: #f5f5f5;
            }
            .edit-lyrics-tab.active {
                border-bottom-color: #28a745;
                color: #28a745;
                background: #f6ffed;
            }
            .edit-lyrics-tab .tab-icon {
                display: block;
                font-size: 20px;
                margin-bottom: 4px;
            }
            .edit-lyrics-tab .tab-text {
                display: block;
            }
            .edit-lyrics-content {
                flex: 1;
                overflow-y: auto;
                padding: 16px;
            }
            .edit-lyrics-panel {
                display: none;
            }
            .edit-lyrics-panel.active {
                display: block;
            }
            .edit-lyrics-hint {
                color: #666;
                font-size: 13px;
                margin-bottom: 12px;
                padding: 8px 12px;
                background: #f5f5f5;
                border-radius: 4px;
            }
            .edit-lyrics-list {
                max-height: 300px;
                overflow-y: auto;
                margin-bottom: 16px;
            }
            .edit-lyrics-item {
                padding: 10px 12px;
                border: 1px solid #e8e8e8;
                border-radius: 6px;
                margin-bottom: 8px;
                cursor: pointer;
                transition: all 0.2s;
            }
            .edit-lyrics-item:hover {
                border-color: #28a745;
                background: #f6ffed;
            }
            .edit-lyrics-item .line-num {
                font-size: 12px;
                color: #999;
                margin-bottom: 4px;
            }
            .edit-lyrics-item .line-text {
                font-size: 14px;
            }
            .edit-lyrics-textarea {
                width: 100%;
                min-height: 200px;
                padding: 12px;
                border: 1px solid #d9d9d9;
                border-radius: 6px;
                font-family: inherit;
                font-size: 14px;
                resize: vertical;
                margin-bottom: 16px;
            }
            .edit-lyrics-textarea:focus {
                outline: none;
                border-color: #28a745;
            }
            .edit-lyrics-insert-config {
                display: flex;
                align-items: center;
                gap: 8px;
                margin-bottom: 12px;
                flex-wrap: wrap;
            }
            .edit-lyrics-insert-config label {
                font-size: 14px;
                color: #333;
            }
            .edit-lyrics-insert-config select,
            .edit-lyrics-insert-config input {
                padding: 8px 12px;
                border: 1px solid #d9d9d9;
                border-radius: 4px;
                font-size: 14px;
            }
            .edit-lyrics-submit {
                width: 100%;
                padding: 12px;
                background: #28a745;
                color: #fff;
                border: none;
                border-radius: 6px;
                font-size: 15px;
                cursor: pointer;
                transition: all 0.2s;
            }
            .edit-lyrics-submit:disabled {
                background: #ccc;
                cursor: not-allowed;
            }
            .edit-lyrics-submit:not(:disabled):hover {
                background: #218838;
            }
        `;
        document.head.appendChild(styles);
    }
    
    // 加载歌词列表（逐行纠错用）
    loadLyricsList();
}

function hideEditLyricsMenu() {
    const menu = document.getElementById('editLyricsMenu');
    if (menu) menu.remove();
}

function switchEditType(type) {
    editLyricsType = type;
    
    // 切换标签
    document.querySelectorAll('.edit-lyrics-tab').forEach(tab => {
        tab.classList.toggle('active', tab.dataset.type === type);
    });
    
    // 切换面板
    document.querySelectorAll('.edit-lyrics-panel').forEach(panel => {
        panel.classList.remove('active');
    });
    document.getElementById('panel-' + type).classList.add('active');
}

function loadLyricsList() {
    const song = window.currentSong;
    if (!song) return;
    
    const list = document.getElementById('editLyricsList');
    if (!list) return;
    
    let html = '';
    let lineNum = 0;
    song.lyrics.forEach((line, idx) => {
        if (!line.chars) return;
        lineNum++;
        const text = line.chars.join('');
        html += `
            <div class="edit-lyrics-item" onclick="editLine(${idx}, '${text.replace(/'/g, "\\'")}')">
                <div class="line-num">第 ${lineNum} 行</div>
                <div class="line-text">${text}</div>
            </div>
        `;
    });
    list.innerHTML = html || '<div style="color:#999;padding:20px;text-align:center;">暂无歌词</div>';
}

function editLine(lineIndex, originalText) {
    const newText = prompt('修改第 ' + (lineIndex + 1) + ' 行歌词：', originalText);
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
    
    updateLineSubmitBtn();
}

function updateLineSubmitBtn() {
    const btn = document.getElementById('submitLineBtn');
    if (btn) {
        btn.disabled = editedLyrics.length === 0;
        btn.textContent = '提交纠错 (' + editedLyrics.length + '处)';
    }
}

function updateFullLyrics(value) {
    fullReplacementLyrics = value.trim();
    const btn = document.getElementById('submitFullBtn');
    if (btn) btn.disabled = !fullReplacementLyrics;
}

function updateInsertData() {
    const position = document.getElementById('insertPosition')?.value || 'after';
    const line = parseInt(document.getElementById('insertLineNum')?.value) || 1;
    const lyrics = document.getElementById('insertLyricsText')?.value.trim() || '';
    
    insertData = { position, line, lyrics };
    
    const btn = document.getElementById('submitInsertBtn');
    if (btn) btn.disabled = !lyrics;
}

// 提交逐行纠错
function submitEditLyrics() {
    if (editedLyrics.length === 0) return;
    
    const song = window.currentSong;
    const correctionsData = editedLyrics.map(e => ({
        line: e.lineIndex + 1,
        originalText: e.originalText,
        newText: e.newText,
    }));
    
    // 存储到 localStorage，跳转提交页面
    localStorage.setItem('submitForm', JSON.stringify({
        type: 'lyrics',
        song: song.title,
        correctionType: 'line',
        corrections: correctionsData,
    }));
    window.open('submit.html?type=lyrics&mode=line', '_blank');
}

// 提交整首替换
function submitFullReplacement() {
    if (!fullReplacementLyrics) return;
    
    const song = window.currentSong;
    
    localStorage.setItem('submitForm', JSON.stringify({
        type: 'lyrics',
        song: song.title,
        correctionType: 'full',
        fullLyrics: fullReplacementLyrics,
    }));
    window.open('submit.html?type=lyrics&mode=full', '_blank');
}

// 提交插入行
function submitInsert() {
    if (!insertData.lyrics) return;
    
    const song = window.currentSong;
    
    localStorage.setItem('submitForm', JSON.stringify({
        type: 'lyrics',
        song: song.title,
        correctionType: 'insert',
        insert: insertData,
    }));
    window.open('submit.html?type=lyrics&mode=insert', '_blank');
}

function clearEditLyricsSelection() {
    editedLyrics = [];
    fullReplacementLyrics = '';
    insertData = { position: 'after', line: 1, lyrics: '' };
}

// 导出模块
window.EditLyricsModule = {
    toggle: toggleEditLyricsMode,
    switchType: switchEditType,
    editLine: editLine,
    updateFullLyrics: updateFullLyrics,
    updateInsertData: updateInsertData,
    submit: submitEditLyrics,
    submitFull: submitFullReplacement,
    submitInsert: submitInsert,
    isActive: () => editLyricsMode
};
