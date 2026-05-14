// 删除歌曲功能模块

let deleteMode = false;
let selectedForDelete = [];

function toggleDeleteMode() {
    deleteMode = !deleteMode;
    selectedForDelete = [];
    const list = document.getElementById('songList');
    const btn = document.getElementById('deleteModeBtn');
    const bar = document.getElementById('deleteBar');
    
    if (!btn || !bar || !list) {
        console.warn('[Delete] Required elements not found');
        return;
    }
    
    if (deleteMode) {
        list.classList.add('delete-mode');
        btn.innerHTML = '✅ 完成';
        btn.classList.add('active');
        bar.style.display = 'flex';
        updateDeleteBar();
    } else {
        list.classList.remove('delete-mode');
        btn.innerHTML = '🗑️ 管理歌曲';
        btn.classList.remove('active');
        bar.style.display = 'none';
        // 重新渲染列表，恢复正常的 selectSong 点击
        if (window.renderSongList) window.renderSongList();
    }
}

function toggleDeleteSelect(id, event) {
    event.stopPropagation();
    const idx = selectedForDelete.indexOf(id);
    if (idx > -1) {
        selectedForDelete.splice(idx, 1);
    } else {
        selectedForDelete.push(id);
    }
    // 更新样式
    const items = document.querySelectorAll('.song-item');
    items.forEach(item => {
        const onclick = item.getAttribute('onclick');
        if (onclick && onclick.includes(`selectSong(${id})`)) {
            item.classList.toggle('delete-selected', selectedForDelete.includes(id));
        }
    });
    updateDeleteBar();
}

function updateDeleteBar() {
    const countEl = document.getElementById('deleteCount');
    const btnEl = document.getElementById('deleteSubmitBtn');
    if (!countEl || !btnEl) return;
    
    const count = selectedForDelete.length;
    countEl.textContent = count > 0 ? `已选 ${count} 首` : '请选择要删除的歌曲';
    btnEl.disabled = count === 0;
}

function submitDeleteRequest() {
    if (selectedForDelete.length === 0) return;
    const songsList = window.songs || [];
    const songsToDelete = selectedForDelete.map(id => songsList.find(s => s.id === id)).filter(Boolean);

    // 将删除数据存入 localStorage，跳转到表单页面
    const deleteData = songsToDelete.map(s => ({
        title: s.title,
        artist: s.artist,
        id: s.id,
    }));
    localStorage.setItem('submitForm', JSON.stringify({
        type: 'delete',
        songs: deleteData,
    }));
    window.open('submit.html', '_blank');

    toggleDeleteMode();
}

// 导出模块
window.DeleteModule = {
    toggle: toggleDeleteMode,
    toggleSelect: toggleDeleteSelect,
    submit: submitDeleteRequest,
    isActive: () => deleteMode
};
