// 修改歌词模式模块

let editLyricsMode = false;
let editedLyrics = []; // { lineIndex, originalText, newText }

function toggleEditLyricsMode() {
    editLyricsMode = !editLyricsMode;
    const lyricsContent = document.getElementById('lyricsContent');

    if (editLyricsMode) {
        if (window.CorrectionModule && window.CorrectionModule.isActive()) {
            window.CorrectionModule.toggle();
        }
        lyricsContent.classList.add('edit-lyrics-mode');
        editedLyrics = [];
        showEditLyricsBanner();
        updateEditLyricsBtn();
    } else {
        lyricsContent.classList.remove('edit-lyrics-mode');
        hideEditLyricsBanner();
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

function showEditLyricsBanner() {
    hideEditLyricsBanner();
    const banner = document.createElement('div');
    banner.className = 'correction-banner';
    banner.id = 'editLyricsBanner';
    banner.style.background = '#d4edda';
    banner.style.borderBottomColor = '#28a745';
    banner.style.color = '#155724';
    banner.innerHTML = `
        <span>📝 修改歌词模式：点击行即可编辑整句歌词</span>
        <span id="editLyricsCountText" style="font-weight:600;"></span>
        <button class="correction-banner-btn submit" id="submitEditLyricsBtn" onclick="EditLyricsModule.submit()" disabled>提交反馈</button>
        <button class="correction-banner-btn cancel" onclick="EditLyricsModule.toggle()">退出</button>
    `;
    banner.querySelector('#submitEditLyricsBtn').style.background = '#28a745';
    document.body.appendChild(banner);
}

function hideEditLyricsBanner() {
    const existing = document.getElementById('editLyricsBanner');
    if (existing) existing.remove();
}

function updateEditLyricsCount() {
    const text = document.getElementById('editLyricsCountText');
    const btn = document.getElementById('submitEditLyricsBtn');
    if (!text || !btn) return;
    if (editedLyrics.length > 0) {
        text.innerHTML = `<span class="correction-count">${editedLyrics.length}</span> 处修改`;
        btn.disabled = false;
    } else {
        text.textContent = '';
        btn.disabled = true;
    }
}

function handleLyricLineClick(event, lineIndex) {
    if (!editLyricsMode) return false;

    event.stopPropagation();

    document.querySelectorAll('.lyric-line.selected').forEach(el => el.classList.remove('selected'));

    const lineEl = event.currentTarget;
    lineEl.classList.add('selected');

    showEditLyricsPopup(lineEl, lineIndex);
    return true;
}

function showEditLyricsPopup(lineEl, lineIndex) {
    closeEditLyricsPopup();

    const overlay = document.createElement('div');
    overlay.className = 'edit-overlay';
    overlay.id = 'editLyricsOverlay';
    overlay.onclick = () => { closeEditLyricsPopup(); };
    document.body.appendChild(overlay);

    const popup = document.createElement('div');
    popup.className = 'edit-lyrics-popup';
    popup.id = 'editLyricsPopup';

    const song = window.currentSong;
    const line = song.lyrics[lineIndex];
    const originalText = line.chars ? line.chars.join('') : '';

    const existingEdit = editedLyrics.find(e => e.lineIndex === lineIndex);
    const currentText = existingEdit ? existingEdit.newText : originalText;

    popup.innerHTML = `
        <div class="edit-lyrics-popup-title">修改歌词</div>
        <div class="edit-lyrics-popup-line-num">第 ${lineIndex + 1} 行</div>
        <div class="edit-lyrics-popup-original">原歌词：${originalText}</div>
        <input class="edit-lyrics-popup-input" id="editLyricsInput" type="text" value="${currentText}" placeholder="输入修改后的歌词"
               onkeydown="if(event.key==='Enter')EditLyricsModule.confirmEdit(${lineIndex}, '${originalText.replace(/'/g, "\\'")}');if(event.key==='Escape'){EditLyricsModule.closePopup();}">
        <div class="edit-lyrics-popup-actions">
            <button class="edit-lyrics-popup-btn dismiss" onclick="EditLyricsModule.closePopup()">取消</button>
            <button class="edit-lyrics-popup-btn confirm" onclick="EditLyricsModule.confirmEdit(${lineIndex}, '${originalText.replace(/'/g, "\\'")}')">确认</button>
        </div>
    `;

    document.body.appendChild(popup);

    const rect = lineEl.getBoundingClientRect();
    const popupRect = popup.getBoundingClientRect();
    let top = rect.bottom + 8;
    let left = rect.left;

    if (top + 200 > window.innerHeight - 60) {
        top = rect.top - 200 - 8;
    }
    if (left + 320 > window.innerWidth - 8) {
        left = window.innerWidth - 320 - 8;
    }
    if (left < 8) left = 8;

    popup.style.top = top + 'px';
    popup.style.left = left + 'px';

    setTimeout(() => {
        const input = document.getElementById('editLyricsInput');
        if (input) { input.focus(); input.select(); }
    }, 50);
}

function closeEditLyricsPopup() {
    const popup = document.getElementById('editLyricsPopup');
    const overlay = document.getElementById('editLyricsOverlay');
    if (popup) popup.remove();
    if (overlay) overlay.remove();
    document.querySelectorAll('.lyric-line.selected').forEach(el => el.classList.remove('selected'));
}

function confirmEditLyrics(lineIndex, originalText) {
    const input = document.getElementById('editLyricsInput');
    if (!input) return;
    const newText = input.value.trim();

    if (newText === originalText) {
        const existingIdx = editedLyrics.findIndex(e => e.lineIndex === lineIndex);
        if (existingIdx > -1) {
            editedLyrics.splice(existingIdx, 1);
        }
        closeEditLyricsPopup();
        updateEditLyricsCount();
        return;
    }

    if (!newText) {
        alert('歌词不能为空');
        return;
    }

    const existingIdx = editedLyrics.findIndex(e => e.lineIndex === lineIndex);
    if (existingIdx > -1) {
        editedLyrics[existingIdx].newText = newText;
    } else {
        editedLyrics.push({
            lineIndex: lineIndex,
            originalText: originalText,
            newText: newText
        });
    }

    closeEditLyricsPopup();
    updateEditLyricsCount();
}

function clearEditLyricsSelection() {
    editedLyrics = [];
    document.querySelectorAll('.lyric-line.selected').forEach(el => el.classList.remove('selected'));
}

function submitEditLyrics() {
    if (editedLyrics.length === 0) return;

    const song = window.currentSong ? `${window.currentSong.title} - ${window.currentSong.artist}` : '';

    let editDetails = editedLyrics.map(e => {
        return `| 第${e.lineIndex + 1}行 | ${e.originalText} | ${e.newText} |`;
    }).join('\n');

    const title = encodeURIComponent(`[歌词纠错] ${song}`);
    const body = encodeURIComponent(`## 歌词纠错

**歌曲：** ${song}
**修改数量：** ${editedLyrics.length} 处

| 行号 | 原歌词 | 修改后歌词 |
|---|---|---|
${editDetails}

---
*由网页修改歌词模式提交*`);
    window.open(`https://github.com/Meowouuo/lyrics/issues/new?title=${title}&body=${body}&labels=歌词纠错`, '_blank');
}

// 投稿：跳转到 GitHub Issues
function submitNewSong() {
    const title = encodeURIComponent('[新歌投稿]');
    const body = encodeURIComponent(`## 投稿新歌\n\n**歌曲名称：**\n\n**歌手：**\n\n**填词：**\n\n**作曲：**\n\n**完整歌词：**\n\`\`\`\n请在这里粘贴完整歌词\n\`\`\`\n\n---\n\n请尽量提供完整歌词，粤拼会由我们添加，谢谢投稿！`);
    window.open(`https://github.com/Meowouuo/lyrics/issues/new?title=${title}&body=${body}&labels=投稿`, '_blank');
}

// 导出模块
window.EditLyricsModule = {
    toggle: toggleEditLyricsMode,
    handleLineClick: handleLyricLineClick,
    confirmEdit: confirmEditLyrics,
    closePopup: closeEditLyricsPopup,
    submit: submitEditLyrics,
    submitNewSong: submitNewSong,
    isActive: () => editLyricsMode
};
