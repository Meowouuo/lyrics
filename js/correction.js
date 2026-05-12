// 纠错模式模块

let correctionMode = false;
let corrections = []; // { lineIndex, charIndex, originalJp, newJp, char }
let selectedChars = []; // [{ lineIndex, charIndex }]

function toggleCorrectionMode() {
    correctionMode = !correctionMode;
    const lyricsContent = document.getElementById('lyricsContent');

    if (correctionMode) {
        lyricsContent.classList.add('correction-mode');
        corrections = [];
        selectedChars = [];
        showCorrectionBanner();
        updateCorrectionBtn();
    } else {
        lyricsContent.classList.remove('correction-mode');
        hideCorrectionBanner();
        clearSelection();
        clearCorrections();
        updateCorrectionBtn();
    }
}

function updateCorrectionBtn() {
    const btn = document.querySelector('.toolbar-btn[onclick="submitFeedback()"]');
    if (!btn) return;
    if (correctionMode) {
        btn.innerHTML = '<span class="icon">✏️</span><span>退出纠错</span>';
        btn.style.color = '#d48806';
    } else {
        btn.innerHTML = '<span class="icon">✏️</span><span>纠错</span>';
        btn.style.color = '';
    }
}

function showCorrectionBanner() {
    hideCorrectionBanner();
    const banner = document.createElement('div');
    banner.className = 'correction-banner';
    banner.id = 'correctionBanner';
    banner.innerHTML = `
        <span>✏️ 纠错模式：点击字即可修改粤拼</span>
        <span id="correctionCountText" style="font-weight:600;"></span>
        <button class="correction-banner-btn submit" id="submitCorrectionsBtn" onclick="CorrectionModule.submit()" disabled>提交反馈</button>
        <button class="correction-banner-btn cancel" onclick="CorrectionModule.toggle()">退出</button>
    `;
    document.body.appendChild(banner);
}

function hideCorrectionBanner() {
    const existing = document.getElementById('correctionBanner');
    if (existing) existing.remove();
}

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

function handleCharClick(event, lineIndex, charIndex) {
    if (!correctionMode) return false; // 不处理，让其他模块处理

    event.stopPropagation();
    const charGroup = event.currentTarget;

    // If already corrected, allow re-edit
    if (charGroup.classList.contains('corrected')) {
        showEditPopup(charGroup, lineIndex, charIndex);
        return true;
    }

    // Toggle selection
    const idx = selectedChars.findIndex(s => s.lineIndex === lineIndex && s.charIndex === charIndex);
    if (idx > -1) {
        selectedChars.splice(idx, 1);
        charGroup.classList.remove('selected');
    } else {
        selectedChars.push({ lineIndex, charIndex });
        charGroup.classList.add('selected');
    }

    // If we have selection, show edit popup
    if (selectedChars.length > 0) {
        showEditPopup(charGroup, lineIndex, charIndex);
    }
    return true;
}

function showEditPopup(charGroup, lineIndex, charIndex) {
    closeEditPopup();

    const overlay = document.createElement('div');
    overlay.className = 'edit-overlay';
    overlay.id = 'editOverlay';
    overlay.onclick = () => { clearSelection(); closeEditPopup(); };
    document.body.appendChild(overlay);

    const popup = document.createElement('div');
    popup.className = 'edit-popup';
    popup.id = 'editPopup';

    const song = window.currentSong;

    // Gather selected chars info
    let charsInfo = [];
    let currentJp = '';

    if (selectedChars.length > 0) {
        const sorted = [...selectedChars].sort((a, b) => a.lineIndex - b.lineIndex || a.charIndex - b.charIndex);
        charsInfo = sorted.map(s => {
            const line = song.lyrics[s.lineIndex];
            return { char: line.chars[s.charIndex], jp: line.jp[s.charIndex], lineIndex: s.lineIndex, charIndex: s.charIndex };
        });
        currentJp = charsInfo.map(c => c.jp).join(' ');
    } else {
        const line = song.lyrics[lineIndex];
        const existingCorrection = corrections.find(c => c.lineIndex === lineIndex && c.charIndex === charIndex);
        charsInfo = [{ char: line.chars[charIndex], jp: existingCorrection ? existingCorrection.newJp : line.jp[charIndex], lineIndex, charIndex }];
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

    // Position popup near the clicked element
    const rect = charGroup.getBoundingClientRect();
    const popupRect = popup.getBoundingClientRect();
    let top = rect.bottom + 8;
    let left = rect.left + rect.width / 2 - popupRect.width / 2;

    if (top + popupRect.height > window.innerHeight - 60) {
        top = rect.top - popupRect.height - 8;
    }
    if (left < 8) left = 8;
    if (left + popupRect.width > window.innerWidth - 8) {
        left = window.innerWidth - popupRect.width - 8;
    }

    popup.style.top = top + 'px';
    popup.style.left = left + 'px';

    setTimeout(() => {
        const input = document.getElementById('editJpInput');
        if (input) { input.focus(); input.select(); }
    }, 50);
}

function closeEditPopup() {
    const popup = document.getElementById('editPopup');
    const overlay = document.getElementById('editOverlay');
    if (popup) popup.remove();
    if (overlay) overlay.remove();
}

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
            const line = song.lyrics[s.lineIndex];
            const originalJp = line.jp[s.charIndex];
            const correctedJp = newJpArr[i] || newJpArr[newJpArr.length - 1] || newJp;
            const char = line.chars[s.charIndex];

            const existingIdx = corrections.findIndex(c => c.lineIndex === s.lineIndex && c.charIndex === s.charIndex);
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

            const charEl = document.querySelector(`.char-group[data-line="${s.lineIndex}"][data-char="${s.charIndex}"]`);
            if (charEl) {
                charEl.classList.remove('selected');
                charEl.classList.add('corrected');
                charEl.querySelector('.char-jyutping').textContent = correctedJp;
            }

            // 同步相同词汇
            const line_chars = line.chars;
            const line_jp = line.jp;
            const ci = s.charIndex;
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
                    if (sorted.some(sel => sel.lineIndex === li && sel.charIndex === syncCi)) continue;
                    if (corrections.some(ex => ex.lineIndex === li && ex.charIndex === syncCi && ex.newJp === correctedJp)) continue;
                    corrections.push({
                        lineIndex: li,
                        charIndex: syncCi,
                        char: l.chars[syncCi],
                        originalJp: l.jp[syncCi],
                        newJp: correctedJp
                    });
                    const syncEl = document.querySelector(`.char-group[data-line="${li}"][data-char="${syncCi}"]`);
                    if (syncEl) {
                        syncEl.classList.add('corrected');
                        syncEl.querySelector('.char-jyutping').textContent = correctedJp;
                    }
                }
            });
        });
    }

    selectedChars = [];
    closeEditPopup();
    updateCorrectionCount();
}

function clearSelection() {
    selectedChars = [];
    document.querySelectorAll('.char-group.selected').forEach(el => el.classList.remove('selected'));
}

function clearCorrections() {
    corrections = [];
    document.querySelectorAll('.char-group.corrected').forEach(el => {
        el.classList.remove('corrected');
        const originalJp = el.dataset.originalJp;
        el.querySelector('.char-jyutping').textContent = originalJp;
    });
}

function submitCorrections() {
    if (corrections.length === 0) return;

    const song = window.currentSong ? `${window.currentSong.title} - ${window.currentSong.artist}` : '';

    let correctionDetails = corrections.map(c => {
        const line = window.currentSong.lyrics[c.lineIndex];
        const lineText = line.chars.join('');
        return `| 第${c.lineIndex + 1}行 | ${c.char} | ${c.originalJp} | ${c.newJp} | ${lineText} |`;
    }).join('\n');

    const title = encodeURIComponent(`[粤拼纠错] ${song}（${corrections.length}处）`);
    const body = encodeURIComponent(`## 纠错内容\n\n**歌曲：** ${song}\n**修改数量：** ${corrections.length} 处\n\n| 行 | 字 | 原粤拼 | 正确粤拼 | 所在行 |\n|---|---|---|---|---|\n${correctionDetails}\n\n---\n*由网页纠错模式提交*`);
    window.open(`https://github.com/Meowouuo/lyrics/issues/new?title=${title}&body=${body}&labels=纠错`, '_blank');
}

// 纠错：进入纠错模式（替换原跳转逻辑）
function submitFeedback() {
    if (!window.currentSong) return;
    if (window.EditLyricsModule && window.EditLyricsModule.isActive()) {
        window.EditLyricsModule.toggle();
    }
    toggleCorrectionMode();
}

// 导出模块
window.CorrectionModule = {
    toggle: toggleCorrectionMode,
    handleCharClick: handleCharClick,
    confirmEdit: confirmEdit,
    clearSelection: clearSelection,
    clearCorrections: clearCorrections,
    closeEditPopup: closeEditPopup,
    submit: submitCorrections,
    submitFeedback: submitFeedback,
    isActive: () => correctionMode
};
