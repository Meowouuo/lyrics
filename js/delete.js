// 删除歌曲功能模块

let deleteMode = false;
let selectedForDelete = [];

function toggleDeleteMode() {
    deleteMode = !deleteMode;
    selectedForDelete = [];
    const list = document.getElementById('songList');
    const btn = document.getElementById('deleteModeBtn');
    const bar = document.getElementById('deleteBar');
    if (deleteMode) {
        list.classList.add('delete-mode');
        btn.textContent = '✅ 完成';
        btn.classList.add('active');
        bar.style.display = 'flex';
        updateDeleteBar();
    } else {
        list.classList.remove('delete-mode');
        btn.textContent = '🗑️ 管理';
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
    const count = selectedForDelete.length;
    document.getElementById('deleteCount').textContent = count > 0 ? `已选 ${count} 首` : '请选择要删除的歌曲';
    document.getElementById('deleteSubmitBtn').disabled = count === 0;
}

function submitDeleteRequest() {
    if (selectedForDelete.length === 0) return;
    const songsList = window.songs || [];
    const songsToDelete = selectedForDelete.map(id => songsList.find(s => s.id === id)).filter(Boolean);
    if (!confirm(`确定删除以下 ${songsToDelete.length} 首歌曲吗？\n\n${songsToDelete.map(s => `· ${s.title} - ${s.artist}`).join('\n')}\n\n删除请求将提交到 GitHub Issues。`)) return;

    const songList = songsToDelete.map((s, i) =>
        `${i + 1}. **${s.title}** - ${s.artist}（ID: ${s.id}）`
    ).join('\n');

    const title = encodeURIComponent(`[删除歌曲] ${songsToDelete.length}首歌曲`);
    const body = encodeURIComponent(`## 删除歌曲请求\n\n**删除数量：** ${songsToDelete.length} 首\n\n${songList}\n\n---\n\n请确认后删除对应歌曲的 JS 文件，并从 index.html 的 songFiles 数组中移除。`);
    window.open(`https://github.com/Meowouuo/lyrics/issues/new?title=${title}&body=${body}&labels=删除`, '_blank');

    toggleDeleteMode();
}

// 导出模块
window.DeleteModule = {
    toggle: toggleDeleteMode,
    toggleSelect: toggleDeleteSelect,
    submit: submitDeleteRequest,
    isActive: () => deleteMode
};
