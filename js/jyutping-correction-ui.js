// ============================================
// 粤拼纠错前端模块
// 功能：让用户在前台点击字修改粤拼，提交纠错反馈
// ============================================

// ============================================
// 全局状态变量
// ============================================

// 粤拼纠错模式开关
let jyutpingCorrectionMode = false;

// 纠错列表：存储用户修改的粤拼
// 格式：[{ lineIndex, charIndex, char, originalJp, newJp }]
let jyutpingCorrections = [];

// 当前选中的字符
let selectedJyutpingChars = [];

// ============================================
// 切换粤拼纠错模式
// 功能：点击"纠错"按钮时的入口函数
// ============================================
function toggleJyutpingCorrectionMode() {
    // 获取当前选中的歌曲
    const song = window.currentSong;
    if (!song) {
        alert('请先选择一首歌曲');
        return;
    }

    // 如果已在纠错模式，退出
    if (jyutpingCorrectionMode) {
        exitJyutpingCorrectionMode();
        return;
    }

    // 进入纠错模式
    enterJyutpingCorrectionMode();
}

// ============================================
// 进入粤拼纠错模式
// 功能：初始化纠错界面，设置字符点击事件
// ============================================
function enterJyutpingCorrectionMode() {
    jyutpingCorrectionMode = true;
    jyutpingCorrections = [];
    selectedJyutpingChars = [];

    // 添加纠错模式样式
    const lyricsContent = document.getElementById('lyricsContent');
    if (lyricsContent) {
        lyricsContent.classList.add('jyutping-correction-mode');
    }

    // 显示纠错横幅
    showJyutpingCorrectionBanner();

    // 更新按钮状态
    updateJyutpingCorrectionBtn();
}

// ============================================
// 退出粤拼纠错模式
// 功能：清理所有纠错状态，恢复页面到正常模式
// ============================================
function exitJyutpingCorrectionMode() {
    jyutpingCorrectionMode = false;
    jyutpingCorrections = [];
    selectedJyutpingChars = [];

    // 移除纠错模式样式
    const lyricsContent = document.getElementById('lyricsContent');
    if (lyricsContent) {
        lyricsContent.classList.remove('jyutping-correction-mode');
    }

    // 移除横幅
    hideJyutpingCorrectionBanner();

    // 清除选中状态
    document.querySelectorAll('.char-group.selected-jp, .char-group.corrected-jp').forEach(el => {
        el.classList.remove('selected-jp', 'corrected-jp');
        // 恢复原始粤拼显示
        const originalJp = el.dataset.originalJp;
        const jpEl = el.querySelector('.char-jyutping');
        if (jpEl && originalJp) {
            jpEl.textContent = originalJp;
        }
    });

    // 更新按钮状态
    updateJyutpingCorrectionBtn();
}

// ============================================
// 更新纠错按钮状态
// 功能：根据模式切换按钮文字和样式
// ============================================
function updateJyutpingCorrectionBtn() {
    const btn = document.querySelector('.toolbar-btn[onclick="JyutpingCorrectionModule.toggle()"]');
    if (!btn) return;

    if (jyutpingCorrectionMode) {
        btn.innerHTML = '<span class="icon"><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/></svg></span><span>退出纠错</span>';
        btn.style.color = '#d48806';
    } else {
        btn.innerHTML = '<span class="icon"><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/></svg></span><span>纠错</span>';
        btn.style.color = '';
    }
}

// ============================================
// 显示粤拼纠错横幅
// 功能：在页面顶部显示纠错模式提示横幅
// ============================================
function showJyutpingCorrectionBanner() {
    hideJyutpingCorrectionBanner();

    const banner = document.createElement('div');
    banner.className = 'jyutping-correction-banner';
    banner.id = 'jyutpingCorrectionBanner';
    banner.innerHTML = `
        <span>✏️ 粤拼纠错模式：点击字即可修改粤拼</span>
        <span id="jyutpingCorrectionCountText" style="font-weight:600;"></span>
        <button class="correction-banner-btn submit" id="submitJyutpingCorrectionsBtn" onclick="submitJyutpingCorrections()" disabled>提交反馈</button>
        <button class="correction-banner-btn cancel" onclick="JyutpingCorrectionModule.toggle()">退出</button>
    `;
    document.body.appendChild(banner);
}

// ============================================
// 隐藏粤拼纠错横幅
// ============================================
function hideJyutpingCorrectionBanner() {
    const existing = document.getElementById('jyutpingCorrectionBanner');
    if (existing) existing.remove();
}

// ============================================
// 更新纠错数量显示
// ============================================
function updateJyutpingCorrectionCount() {
    const text = document.getElementById('jyutpingCorrectionCountText');
    const btn = document.getElementById('submitJyutpingCorrectionsBtn');
    if (!text || !btn) return;

    if (jyutpingCorrections.length > 0) {
        text.innerHTML = `<span style="background:#d48806;color:#fff;padding:2px 8px;border-radius:10px;">${jyutpingCorrections.length}</span> 处修改`;
        btn.disabled = false;
    } else {
        text.textContent = '';
        btn.disabled = true;
    }
}

// ============================================
// 处理字符点击事件
// 功能：在纠错模式下，点击字符弹出编辑框
// ============================================
function handleJyutpingCharClick(event, lineIndex, charIndex) {
    if (!jyutpingCorrectionMode) return false;

    event.stopPropagation();
    const charGroup = event.currentTarget;

    // 如果已修改过，允许重新编辑
    if (charGroup.classList.contains('corrected-jp')) {
        showJyutpingEditPopup(charGroup, lineIndex, charIndex);
        return true;
    }

    // 切换选中状态
    const idx = selectedJyutpingChars.findIndex(s => s.lineIndex === lineIndex && s.charIndex === charIndex);
    if (idx > -1) {
        selectedJyutpingChars.splice(idx, 1);
        charGroup.classList.remove('selected-jp');
    } else {
        selectedJyutpingChars.push({ lineIndex, charIndex });
        charGroup.classList.add('selected-jp');
    }

    // 如果有选中，显示编辑弹窗
    if (selectedJyutpingChars.length > 0) {
        showJyutpingEditPopup(charGroup, lineIndex, charIndex);
    }

    return true;
}

// ============================================
// 显示粤拼编辑弹窗
// ============================================
function showJyutpingEditPopup(charGroup, lineIndex, charIndex) {
    closeJyutpingEditPopup();

    const song = window.currentSong;
    if (!song) return;

    // 创建遮罩层
    const overlay = document.createElement('div');
    overlay.className = 'edit-overlay';
    overlay.id = 'jyutpingEditOverlay';
    overlay.onclick = () => { clearJyutpingSelection(); closeJyutpingEditPopup(); };
    document.body.appendChild(overlay);

    // 收集选中的字符信息
    let charsInfo = [];
    let currentJp = '';

    if (selectedJyutpingChars.length > 0) {
        const sorted = [...selectedJyutpingChars].sort((a, b) => a.lineIndex - b.lineIndex || a.charIndex - b.charIndex);
        charsInfo = sorted.map(s => {
            const line = song.lyrics[s.lineIndex];
            return {
                char: line.chars[s.charIndex],
                jp: line.jp[s.charIndex],
                lineIndex: s.lineIndex,
                charIndex: s.charIndex
            };
        });
        currentJp = charsInfo.map(c => c.jp).join(' ');
    } else {
        // 单个字符重新编辑
        const line = song.lyrics[lineIndex];
        const existingCorrection = jyutpingCorrections.find(c => c.lineIndex === lineIndex && c.charIndex === charIndex);
        charsInfo = [{
            char: line.chars[charIndex],
            jp: existingCorrection ? existingCorrection.newJp : line.jp[charIndex],
            lineIndex,
            charIndex
        }];
        currentJp = charsInfo[0].jp;
    }

    const charsText = charsInfo.map(c => c.char).join('');
    const title = charsInfo.length === 1 ? '修改粤拼' : `修改 ${charsInfo.length} 个字的粤拼`;

    // 创建弹窗
    const popup = document.createElement('div');
    popup.className = 'edit-popup';
    popup.id = 'jyutpingEditPopup';
    popup.innerHTML = `
        <div class="edit-popup-title">${title}</div>
        <div class="edit-popup-chars">${charsText}</div>
        <input class="edit-popup-input" id="jyutpingEditInput" type="text" value="${currentJp}" placeholder="输入粤拼，多字用空格分隔"
               onkeydown="if(event.key==='Enter')confirmJyutpingEdit();if(event.key==='Escape'){clearJyutpingSelection();closeJyutpingEditPopup();}">
        <div class="edit-popup-actions">
            <button class="edit-popup-btn dismiss" onclick="clearJyutpingSelection();closeJyutpingEditPopup();">取消</button>
            <button class="edit-popup-btn confirm" onclick="confirmJyutpingEdit()">确认</button>
        </div>
    `;

    document.body.appendChild(popup);

    // 定位弹窗
    const rect = charGroup.getBoundingClientRect();
    let top = rect.bottom + 8;
    let left = rect.left + rect.width / 2 - 150;

    if (top + 150 > window.innerHeight - 60) {
        top = rect.top - 150 - 8;
    }
    if (left < 8) left = 8;
    if (left + 300 > window.innerWidth - 8) {
        left = window.innerWidth - 308;
    }

    popup.style.top = top + 'px';
    popup.style.left = left + 'px';

    // 聚焦输入框
    setTimeout(() => {
        const input = document.getElementById('jyutpingEditInput');
        if (input) { input.focus(); input.select(); }
    }, 50);
}

// ============================================
// 关闭粤拼编辑弹窗
// ============================================
function closeJyutpingEditPopup() {
    const popup = document.getElementById('jyutpingEditPopup');
    const overlay = document.getElementById('jyutpingEditOverlay');
    if (popup) popup.remove();
    if (overlay) overlay.remove();
}

// ============================================
// 确认粤拼编辑
// ============================================
function confirmJyutpingEdit() {
    const input = document.getElementById('jyutpingEditInput');
    if (!input) return;

    const newJp = input.value.trim();
    if (!newJp) return;

    const song = window.currentSong;
    if (!song) return;

    if (selectedJyutpingChars.length > 0) {
        const sorted = [...selectedJyutpingChars].sort((a, b) => a.lineIndex - b.lineIndex || a.charIndex - b.charIndex);
        const newJpArr = newJp.split(/\s+/);

        sorted.forEach((s, i) => {
            const line = song.lyrics[s.lineIndex];
            const originalJp = line.jp[s.charIndex];
            const correctedJp = newJpArr[i] || newJpArr[newJpArr.length - 1] || newJp;

            // 更新或添加纠错记录
            const existingIdx = jyutpingCorrections.findIndex(c => c.lineIndex === s.lineIndex && c.charIndex === s.charIndex);
            if (existingIdx > -1) {
                jyutpingCorrections[existingIdx].newJp = correctedJp;
            } else {
                jyutpingCorrections.push({
                    lineIndex: s.lineIndex,
                    charIndex: s.charIndex,
                    char: line.chars[s.charIndex],
                    originalJp: originalJp,
                    newJp: correctedJp
                });
            }

            // 更新 DOM
            const charEl = document.querySelector(`.char-group[data-line="${s.lineIndex}"][data-char="${s.charIndex}"]`);
            if (charEl) {
                charEl.classList.remove('selected-jp');
                charEl.classList.add('corrected-jp');
                const jpEl = charEl.querySelector('.char-jyutping');
                if (jpEl) jpEl.textContent = correctedJp;
            }
        });
    }

    selectedJyutpingChars = [];
    closeJyutpingEditPopup();
    updateJyutpingCorrectionCount();
}

// ============================================
// 清除选中状态
// ============================================
function clearJyutpingSelection() {
    selectedJyutpingChars = [];
    document.querySelectorAll('.char-group.selected-jp').forEach(el => el.classList.remove('selected-jp'));
}

// ============================================
// 提交粤拼纠错
// 功能：跳转到 GitHub Issues 创建纠错 Issue
// ============================================
function submitJyutpingCorrections() {
    if (jyutpingCorrections.length === 0) return;

    const song = window.currentSong;
    if (!song) return;

    const songName = `${song.title} - ${song.artist}`;

    // 构建纠错详情表格
    const correctionDetails = jyutpingCorrections.map(c => {
        const line = song.lyrics[c.lineIndex];
        const lineText = line.chars.join('');
        return `| 第${c.lineIndex + 1}行 | ${c.char} | ${c.originalJp} | ${c.newJp} | ${lineText} |`;
    }).join('\n');

    // 构建 Issue 内容
    const title = encodeURIComponent(`[粤拼纠错] ${songName}（${jyutpingCorrections.length}处）`);
    const body = encodeURIComponent(`## 纠错内容\n\n**歌曲：** ${songName}\n**修改数量：** ${jyutpingCorrections.length} 处\n\n| 行 | 字 | 原粤拼 | 正确粤拼 | 所在行 |\n|---|---|---|---|---|\n${correctionDetails}\n\n---\n*由网页纠错模式提交*`);

    // 跳转到 GitHub Issues
    window.open(`https://github.com/Meowouuo/lyrics/issues/new?title=${title}&body=${body}&labels=投稿-粤拼`, '_blank');

    // 退出纠错模式
    exitJyutpingCorrectionMode();
}

// ============================================
// 导出模块
// ============================================
window.JyutpingCorrectionModule = {
    toggle: toggleJyutpingCorrectionMode,
    isActive: () => jyutpingCorrectionMode,
    getCorrections: () => jyutpingCorrections,
    handleCharClick: handleJyutpingCharClick
};
