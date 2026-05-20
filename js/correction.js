// ============================================
// 歌词纠错模块（粤拼纠错）
// 功能：点击单个字符修改其粤拼标注
// 支持批量选择、同步修改相同词汇
// ============================================

// ============================================
// 全局状态变量
// ============================================

// 纠错模式开关：是否处于粤拼纠错编辑状态
let correctionMode = false;

// 纠错列表：存储用户修改的所有粤拼纠错项
// 格式：[{ lineIndex, charIndex, char, originalJp, newJp }]
let corrections = [];

// 当前选中的字符列表（用于批量修改）
// 格式：[{ lineIndex, charIndex }]
let selectedChars = [];

// ============================================
// 纠错入口函数
// 功能：点击"粤拼纠错"按钮时的入口
// 如果正在编辑歌词，先退出编辑模式
// ============================================
function submitFeedback() {
    if (!window.currentSong) return;
    // 如果正在编辑歌词，先退出
    if (window.EditLyricsModule && window.EditLyricsModule.isActive()) {
        window.EditLyricsModule.toggle();
    }
    toggleCorrectionMode();
}

// ============================================
// 切换纠错模式
// 功能：点击"纠错"按钮时的入口函数
// ============================================
function toggleCorrectionMode() {
    const lyricsContent = document.getElementById('lyricsContent');
    const song = window.currentSong;

    if (!song) {
        alert('请先选择一首歌曲');
        return;
    }

    // 如果已在纠错模式，退出
    if (correctionMode) {
        correctionMode = false;
        lyricsContent.classList.remove('correction-mode');
        hideCorrectionBanner();
        clearSelection();
        clearCorrections();
        updateCorrectionBtn();
        restoreSongListInteraction();
        return;
    }

    // 进入纠错模式
    correctionMode = true;
    corrections = [];
    selectedChars = [];
    
    lyricsContent.classList.add('correction-mode');
    showCorrectionBanner();
    updateCorrectionBtn();
    disableSongListInteraction();
    
    // 启用歌手/词曲人粤拼纠错
    enableMetaCorrection();
}

// ============================================
// 更新纠错按钮显示
// ============================================
function updateCorrectionBtn() {
    const btn = document.querySelector('.toolbar-btn[onclick="CorrectionModule.toggle()"]');
    if (!btn) return;
    
    if (correctionMode) {
        btn.innerHTML = '<span class="icon"><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/></svg></span><span>退出粤拼纠错</span>';
        btn.style.color = '#d48806';
    } else {
        btn.innerHTML = '<span class="icon"><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/></svg></span><span>粤拼纠错</span>';
        btn.style.color = '';
    }
}

// ============================================
// 显示纠错横幅
// ============================================
function showCorrectionBanner() {
    hideCorrectionBanner();
    
    const banner = document.createElement('div');
    banner.className = 'correction-banner';
    banner.id = 'correctionBanner';
    banner.innerHTML = `
        <span><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle;margin-right:4px;"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/></svg>粤拼纠错模式：点击字即可修改粤拼</span>
        <span id="correctionCountText" style="font-weight:600;"></span>
        <button class="correction-banner-btn submit" id="submitCorrectionsBtn" onclick="CorrectionModule.submit()" disabled>提交反馈</button>
        <button class="correction-banner-btn cancel" onclick="CorrectionModule.toggle()">退出</button>
    `;
    
    document.body.appendChild(banner);
    document.body.style.paddingTop = '60px';
}

// ============================================
// 隐藏纠错横幅
// ============================================
function hideCorrectionBanner() {
    const existing = document.getElementById('correctionBanner');
    if (existing) existing.remove();
    document.body.style.paddingTop = '';
}

// ============================================
// 更新纠错计数显示
// ============================================
function updateCorrectionCount() {
    const text = document.getElementById('correctionCountText');
    const btn = document.getElementById('submitCorrectionsBtn');
    
    if (!text || !btn) return;
    
    if (corrections.length > 0) {
        text.innerHTML = `<span class="correction-count">${corrections.length}</span> 处修改`;
        btn.disabled = false;
    } else {
        text.textContent = '';
        btn.disabled = true;
    }
}

// ============================================
// 处理字符点击事件
// 功能：在纠错模式下处理字符点击
// 参数：
//   - event: 点击事件对象
//   - lineIndex: 行索引（displayLineIndex）
//   - charIndex: 字符索引
// 返回值：true 表示已处理，false 表示未处理
// ============================================
function handleCharClick(event, lineIndex, charIndex) {
    if (!correctionMode) return false;

    event.stopPropagation();
    const charGroup = event.currentTarget;

    // 获取当前歌曲和对应的歌词行
    const song = window.currentSong;
    const songLineIndex = parseInt(charGroup.closest('.lyric-line').dataset.songIndex);
    
    if (isNaN(songLineIndex)) return true;
    
    const line = song.lyrics[songLineIndex];
    if (!line || !line.chars || !line.jp) return true;

    // 如果该字符已被修改过，允许重新编辑
    if (charGroup.classList.contains('corrected')) {
        showEditPopup(charGroup, lineIndex, charIndex, songLineIndex);
        return true;
    }

    // 切换选中状态
    const idx = selectedChars.findIndex(s => s.lineIndex === lineIndex && s.charIndex === charIndex);
    if (idx > -1) {
        selectedChars.splice(idx, 1);
        charGroup.classList.remove('selected');
    } else {
        selectedChars.push({ lineIndex, charIndex });
        charGroup.classList.add('selected');
    }

    // 如果有选中字符，显示编辑弹窗
    if (selectedChars.length > 0) {
        showEditPopup(charGroup, lineIndex, charIndex, songLineIndex);
    }
    
    return true;
}

// ============================================
// 显示编辑弹窗
// ============================================
function showEditPopup(charGroup, displayLineIndex, charIndex, songLineIndex) {
    closeEditPopup();

    const overlay = document.createElement('div');
    overlay.className = 'edit-overlay';
    overlay.id = 'editOverlay';
    overlay.onclick = () => { 
        clearSelection(); 
        closeEditPopup(); 
    };
    document.body.appendChild(overlay);

    const popup = document.createElement('div');
    popup.className = 'edit-popup';
    popup.id = 'editPopup';

    const song = window.currentSong;

    // 收集选中字符的信息
    let charsInfo = [];
    let currentJp = '';

    if (selectedChars.length > 0) {
        const sorted = [...selectedChars].sort((a, b) => a.lineIndex - b.lineIndex || a.charIndex - b.charIndex);
        charsInfo = sorted.map(s => {
            const lyricLineElement = document.querySelector(`.lyric-line[data-line="${s.lineIndex}"]`);
            const actualSongIndex = parseInt(lyricLineElement.dataset.songIndex);
            const line = song.lyrics[actualSongIndex];
            return { 
                char: line.chars[s.charIndex], 
                jp: line.jp[s.charIndex], 
                lineIndex: s.lineIndex, 
                charIndex: s.charIndex 
            };
        });
        currentJp = charsInfo.map(c => c.jp).join(' ');
    } else {
        const line = song.lyrics[songLineIndex];
        const existingCorrection = corrections.find(c => 
            c.lineIndex === displayLineIndex && c.charIndex === charIndex
        );
        charsInfo = [{ 
            char: line.chars[charIndex], 
            jp: existingCorrection ? existingCorrection.newJp : line.jp[charIndex], 
            lineIndex: displayLineIndex, 
            charIndex: charIndex 
        }];
        currentJp = charsInfo[0].jp;
    }

    const charsText = charsInfo.map(c => c.char).join('');
    const title = charsInfo.length === 1 ? '修改粤拼' : `修改 ${charsInfo.length} 个字的粤拼`;

    popup.innerHTML = `
        <div class="edit-popup-title">${title}</div>
        <div class="edit-popup-chars">${charsText}</div>
        <input class="edit-popup-input" id="editJpInput" type="text" value="${currentJp}" placeholder="输入粤拼，多字用空格分隔"
               onkeydown="if(event.key==='Enter')CorrectionModule.confirmEdit();if(event.key==='Escape'){CorrectionModule.clearSelection();CorrectionModule.closeEditPopup();}">
        <div class="edit-popup-actions">
            <button class="edit-popup-btn dismiss" onclick="CorrectionModule.clearSelection();CorrectionModule.closeEditPopup();">取消</button>
            <button class="edit-popup-btn confirm" onclick="CorrectionModule.confirmEdit()">确认</button>
        </div>
    `;

    document.body.appendChild(popup);

    // 定位弹窗
    const rect = charGroup.getBoundingClientRect();
    const popupWidth = 320;
    const popupHeight = 200;
    let top = rect.bottom + 8;
    let left = rect.left + rect.width / 2 - popupWidth / 2;

    if (top + popupHeight > window.innerHeight - 60) {
        top = rect.top - popupHeight - 8;
    }
    if (left < 8) left = 8;
    if (left + popupWidth > window.innerWidth - 8) {
        left = window.innerWidth - popupWidth - 8;
    }

    popup.style.top = top + 'px';
    popup.style.left = left + 'px';
    popup.style.width = popupWidth + 'px';

    setTimeout(() => {
        const input = document.getElementById('editJpInput');
        if (input) { 
            input.focus(); 
            input.select(); 
        }
    }, 50);
}

// ============================================
// 关闭编辑弹窗
// ============================================
function closeEditPopup() {
    const popup = document.getElementById('editPopup');
    const overlay = document.getElementById('editOverlay');
    if (popup) popup.remove();
    if (overlay) overlay.remove();
}

// ============================================
// 确认编辑
// ============================================
function confirmEdit() {
    const input = document.getElementById('editJpInput');
    if (!input) return;
    
    const newJp = input.value.trim();
    if (!newJp) return;

    const song = window.currentSong;

    if (selectedChars.length > 0) {
        const sorted = [...selectedChars].sort((a, b) => a.lineIndex - b.lineIndex || a.charIndex - b.charIndex);
        const newJpArr = newJp.split(/\s+/);

        sorted.forEach((s, i) => {
            const lyricLineElement = document.querySelector(`.lyric-line[data-line="${s.lineIndex}"]`);
            const actualSongIndex = parseInt(lyricLineElement.dataset.songIndex);
            const line = song.lyrics[actualSongIndex];
            
            const originalJp = line.jp[s.charIndex];
            const correctedJp = newJpArr[i] || newJpArr[newJpArr.length - 1] || newJp;
            const char = line.chars[s.charIndex];

            // 检查是否已有该位置的纠错记录
            const existingIdx = corrections.findIndex(c => 
                c.lineIndex === s.lineIndex && c.charIndex === s.charIndex
            );
            
            if (existingIdx > -1) {
                corrections[existingIdx].newJp = correctedJp;
            } else {
                corrections.push({
                    lineIndex: s.lineIndex,
                    charIndex: s.charIndex,
                    char: char,
                    originalJp: originalJp,
                    newJp: correctedJp
                });
            }

            // 更新界面显示
            const charEl = document.querySelector(`.char-group[data-line="${s.lineIndex}"][data-char="${s.charIndex}"]`);
            if (charEl) {
                charEl.classList.remove('selected');
                charEl.classList.add('corrected');
                charEl.querySelector('.char-jyutping').textContent = correctedJp;
            }

            // 同步修改相同的词汇
            syncSameWordCorrections(line, s.charIndex, correctedJp, char, sorted);
        });
    }

    selectedChars = [];
    closeEditPopup();
    updateCorrectionCount();
}

// ============================================
// 同步修改相同词汇
// ============================================
function syncSameWordCorrections(line, charIndex, correctedJp, char, sorted) {
    const song = window.currentSong;
    const line_chars = line.chars;
    const line_jp = line.jp;
    const ci = charIndex;
    
    // 构建词汇（包含前后字符）
    let wordChars = [char];
    let wordStart = ci;
    let wordEnd = ci;
    
    if (ci > 0 && line_chars[ci - 1] && line_chars[ci - 1] !== ' ') {
        wordChars.unshift(line_chars[ci - 1]);
        wordStart = ci - 1;
    }
    if (ci < line_chars.length - 1 && line_chars[ci + 1] && line_chars[ci + 1] !== ' ') {
        wordChars.push(line_chars[ci + 1]);
        wordEnd = ci + 1;
    }
    
    const charOffsetInWord = ci - wordStart;
    const wordJp = line_jp.slice(wordStart, wordEnd + 1);

    // 在所有歌词行中查找相同的词汇
    song.lyrics.forEach((l, li) => {
        if (!l.chars || !l.jp) return;
        
        for (let wi = 0; wi <= l.chars.length - wordChars.length; wi++) {
            let match = true;
            for (let k = 0; k < wordChars.length; k++) {
                if (l.chars[wi + k] !== wordChars[k] || l.jp[wi + k] !== wordJp[k]) {
                    match = false;
                    break;
                }
            }
            
            if (!match) continue;
            
            const syncCi = wi + charOffsetInWord;
            
            // 跳过当前选中的字符
            if (sorted.some(sel => {
                const lyricLineElement = document.querySelector(`.lyric-line[data-line="${sel.lineIndex}"]`);
                const actualSongIndex = parseInt(lyricLineElement?.dataset.songIndex);
                return actualSongIndex === li && sel.charIndex === syncCi;
            })) continue;
            
            // 跳过已经同步过的字符
            if (corrections.some(ex => ex.lineIndex === sel.lineIndex && ex.charIndex === syncCi && ex.newJp === correctedJp)) continue;
            
            // 添加同步纠错记录
            corrections.push({
                lineIndex: getDisplayLineIndex(li),
                charIndex: syncCi,
                char: l.chars[syncCi],
                originalJp: l.jp[syncCi],
                newJp: correctedJp
            });
            
            const syncEl = document.querySelector(`.char-group[data-line="${getDisplayLineIndex(li)}"][data-char="${syncCi}"]`);
            if (syncEl) {
                syncEl.classList.add('corrected');
                syncEl.querySelector('.char-jyutping').textContent = correctedJp;
            }
        }
    });
}

// ============================================
// 获取显示行索引
// ============================================
function getDisplayLineIndex(songLineIndex) {
    let displayIndex = 0;
    const lines = document.querySelectorAll('.lyric-line');
    for (let i = 0; i < lines.length; i++) {
        if (parseInt(lines[i].dataset.songIndex) === songLineIndex) {
            return parseInt(lines[i].dataset.line);
        }
    }
    return songLineIndex;
}

// ============================================
// 清除选中状态
// ============================================
function clearSelection() {
    selectedChars = [];
    document.querySelectorAll('.char-group.selected').forEach(el => {
        el.classList.remove('selected');
    });
}

// ============================================
// 清除所有纠错
// ============================================
function clearCorrections() {
    corrections = [];
    document.querySelectorAll('.char-group.corrected').forEach(el => {
        el.classList.remove('corrected');
        const originalJp = el.dataset.originalJp;
        if (originalJp) {
            el.querySelector('.char-jyutping').textContent = originalJp;
        }
    });
}

// ============================================
// 提交纠错
// ============================================
function submitCorrections() {
    if (corrections.length === 0) return;

    const songName = window.currentSong ? window.currentSong.title : '';
    const correctionsData = corrections.map(c => ({
        line: c.lineIndex + 1,
        char: c.char,
        originalJp: c.originalJp,
        newJp: c.newJp,
    }));
    
    localStorage.setItem('submitForm', JSON.stringify({
        type: 'jyutping',
        song: songName,
        corrections: correctionsData,
    }));
    
    window.open('submit.html', '_blank');
}

// ============================================
// 禁用歌曲列表交互
// ============================================
function disableSongListInteraction() {
    const songItems = document.querySelectorAll('.song-item');
    songItems.forEach(item => {
        item.style.pointerEvents = 'none';
        item.style.opacity = '0.6';
    });
}

// ============================================
// 恢复歌曲列表交互
// ============================================
function restoreSongListInteraction() {
    const songItems = document.querySelectorAll('.song-item');
    songItems.forEach(item => {
        item.style.pointerEvents = '';
        item.style.opacity = '';
    });
}

// ============================================
// 导出模块
// ============================================

// ============================================
// 启用歌手/词曲人粤拼纠错
// 功能：为歌手、填词、作曲区域的每个字添加点击事件
// 允许用户修改歌手/词曲人的粤拼
// ============================================
function enableMetaCorrection() {
    const metaIds = ['songArtist', 'songLyricist', 'songComposer'];
    
    metaIds.forEach(id => {
        const el = document.getElementById(id);
        if (!el) {
            console.log(`[MetaCorrection] Element ${id} not found`);
            return;
        }
        
        const charGroups = el.querySelectorAll('.meta-name-group');
        console.log(`[MetaCorrection] Found ${charGroups.length} groups in ${id}`);
        
        charGroups.forEach((group, index) => {
            group.style.cursor = 'pointer';
            group.dataset.metaType = id;
            group.dataset.charIndex = index;
            group.onclick = (e) => handleMetaCharClick(e, id, index);
            console.log(`[MetaCorrection] Enabled click for ${id}[${index}]`);
        });
    });
}

// ============================================
// 禁用歌手/词曲人粤拼纠错
// 功能：移除歌手、填词、作曲区域的点击事件
// ============================================
function disableMetaCorrection() {
    const metaIds = ['songArtist', 'songLyricist', 'songComposer'];
    
    metaIds.forEach(id => {
        const el = document.getElementById(id);
        if (!el) return;
        
        const charGroups = el.querySelectorAll('.meta-name-group');
        charGroups.forEach(group => {
            group.style.cursor = '';
            group.dataset.metaType = '';
            group.dataset.charIndex = '';
            group.onclick = null;
            group.classList.remove('selected', 'corrected');
        });
    });
}

// ============================================
// 处理歌手/词曲人字符点击
// 参数：
//   - event: 点击事件
//   - metaType: 类型（songArtist/songLyricist/songComposer）
//   - charIndex: 字符索引
// ============================================
function handleMetaCharClick(event, metaType, charIndex) {
    console.log('[handleMetaCharClick] Clicked', metaType, 'charIndex:', charIndex);
    
    if (!correctionMode) {
        console.log('[handleMetaCharClick] Not in correction mode');
        return;
    }
    
    event.stopPropagation();
    const charGroup = event.currentTarget;
    
    // 获取当前歌曲
    const song = window.currentSong;
    if (!song) {
        console.log('[handleMetaCharClick] No current song');
        return;
    }
    
    // 获取对应的元数据数组
    let metaValue, metaJp;
    if (metaType === 'songArtist') {
        metaValue = song.artist;
        metaJp = song.artistJyutping;
    } else if (metaType === 'songLyricist') {
        metaValue = song.lyricist;
        metaJp = song.lyricistJyutping;
    } else if (metaType === 'songComposer') {
        metaValue = song.composer;
        metaJp = song.composerJyutping;
    }
    
    console.log('[handleMetaCharClick] metaValue:', metaValue, 'metaJp:', metaJp);
    
    if (!metaValue || !metaJp) {
        console.log('[handleMetaCharClick] Missing metaValue or metaJp');
        return;
    }
    
    // 显示编辑弹窗
    showMetaEditPopup(charGroup, metaType, charIndex, metaValue, metaJp);
}

// ============================================
// 显示歌手/词曲人编辑弹窗
// ============================================
function showMetaEditPopup(charGroup, metaType, charIndex, metaValue, metaJp) {
    console.log('[showMetaEditPopup] Opening popup for', metaType, 'charIndex:', charIndex);
    
    try {
        closeEditPopup();

        const overlay = document.createElement('div');
        overlay.className = 'edit-overlay';
        overlay.id = 'editOverlay';
        overlay.onclick = closeEditPopup;
        document.body.appendChild(overlay);
        console.log('[showMetaEditPopup] Overlay added');

        const popup = document.createElement('div');
        popup.className = 'edit-popup';
        popup.id = 'editPopup';

        const char = metaValue[charIndex];
        const currentJp = metaJp[charIndex] || '';
        
        const typeName = metaType === 'songArtist' ? '歌手' : 
                         metaType === 'songLyricist' ? '填词' : '作曲';

        popup.innerHTML = `
            <div class="edit-popup-title">修改${typeName}粤拼</div>
            <div class="edit-popup-char">${char}</div>
            <div class="edit-popup-input-group">
                <label>当前粤拼：${currentJp}</label>
                <input type="text" id="newMetaJp" class="edit-popup-input" value="${currentJp}" placeholder="输入新粤拼">
            </div>
            <div class="edit-popup-buttons">
                <button class="edit-popup-btn cancel" onclick="closeEditPopup()">取消</button>
                <button class="edit-popup-btn confirm" onclick="confirmMetaEdit('${metaType}', ${charIndex}, '${char}', '${currentJp}')">确定</button>
            </div>
        `;

        document.body.appendChild(popup);
        console.log('[showMetaEditPopup] Popup added');
        
        // 聚焦输入框
        setTimeout(() => {
            const input = document.getElementById('newMetaJp');
            if (input) {
                input.focus();
                console.log('[showMetaEditPopup] Input focused');
            }
        }, 10);
    } catch (err) {
        console.error('[showMetaEditPopup] Error:', err);
    }
}

// ============================================
// 确认歌手/词曲人粤拼修改
// ============================================
function confirmMetaEdit(metaType, charIndex, char, originalJp) {
    const newJp = document.getElementById('newMetaJp')?.value.trim();
    if (!newJp || newJp === originalJp) {
        closeEditPopup();
        return;
    }
    
    // 添加到纠错列表
    corrections.push({
        type: 'meta',
        metaType: metaType,
        charIndex: charIndex,
        char: char,
        originalJp: originalJp,
        newJp: newJp
    });
    
    // 更新UI
    const metaIds = {'songArtist': '歌手', 'songLyricist': '填词', 'songComposer': '作曲'};
    const el = document.getElementById(metaType);
    if (el) {
        const charGroups = el.querySelectorAll('.meta-name-group');
        if (charGroups[charIndex]) {
            charGroups[charIndex].classList.add('corrected');
        }
    }
    
    updateCorrectionCount();
    closeEditPopup();
}

window.CorrectionModule = {
    submitFeedback: submitFeedback,
    toggle: toggleCorrectionMode,
    handleCharClick: handleCharClick,
    confirmEdit: confirmEdit,
    clearSelection: clearSelection,
    clearCorrections: clearCorrections,
    closeEditPopup: closeEditPopup,
    submit: submitCorrections,
    isActive: () => correctionMode
};
