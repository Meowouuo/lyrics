// ============================================
// 删除歌曲模块
// 功能：提供前端界面让用户选择并删除歌曲
// 数据存储在 localStorage，跳转到提交页面创建 Issue
// ============================================

// ============================================
// 全局状态变量
// ============================================

// 删除模式开关：是否处于歌曲删除选择状态
let deleteMode = false;

// 已选中的待删除歌曲 ID 列表
let selectedForDelete = [];

// ============================================
// 切换删除模式
// 功能：点击"管理歌曲"按钮时的入口函数
// 切换删除模式的开/关状态
// ============================================
function toggleDeleteMode() {
    // 切换删除模式状态
    deleteMode = !deleteMode;
    // 清空已选择的歌曲列表
    selectedForDelete = [];

    // 获取相关 DOM 元素
    const list = document.getElementById('songList');
    const btn = document.getElementById('deleteModeBtn');
    const bar = document.getElementById('deleteBar');

    // 检查必要元素是否存在
    if (!btn || !bar || !list) {
        console.warn('[Delete] Required elements not found');
        return;
    }

    if (deleteMode) {
        // 进入删除模式
        // 添加删除模式样式
        list.classList.add('delete-mode');
        // 更新按钮文字
        btn.innerHTML = '✅ 完成';
        btn.classList.add('active');
        // 显示删除操作栏
        bar.style.display = 'flex';
        // 更新操作栏状态
        updateDeleteBar();
    } else {
        // 退出删除模式
        // 移除删除模式样式
        list.classList.remove('delete-mode');
        // 恢复按钮文字
        btn.innerHTML = '🗑️ 管理歌曲';
        btn.classList.remove('active');
        // 隐藏删除操作栏
        bar.style.display = 'none';
        // 重新渲染歌曲列表，恢复正常的 selectSong 点击
        if (window.renderSongList) window.renderSongList();
    }
}

// ============================================
// 切换删除选择
// 功能：用户点击歌曲项时，切换该歌曲的选中状态
//
// 参数：
//   - id: 歌曲 ID
//   - event: 点击事件对象
// ============================================
function toggleDeleteSelect(id, event) {
    // 阻止事件冒泡，避免触发歌曲选择
    event.stopPropagation();

    // 检查该歌曲是否已在选中列表中
    const idx = selectedForDelete.indexOf(id);
    if (idx > -1) {
        // 已选中，取消选中
        selectedForDelete.splice(idx, 1);
    } else {
        // 未选中，添加到选中列表
        selectedForDelete.push(id);
    }

    // 更新选中歌曲项的视觉样式
    const items = document.querySelectorAll('.song-item');
    items.forEach(item => {
        const onclick = item.getAttribute('onclick');
        if (onclick && onclick.includes(`selectSong(${id})`)) {
            // 切换选中样式
            item.classList.toggle('delete-selected', selectedForDelete.includes(id));
        }
    });

    // 更新删除操作栏显示
    updateDeleteBar();
}

// ============================================
// 更新删除操作栏
// 功能：更新操作栏中的选中计数和提交按钮状态
// ============================================
function updateDeleteBar() {
    // 获取操作栏中的元素
    const countEl = document.getElementById('deleteCount');
    const btnEl = document.getElementById('deleteSubmitBtn');

    // 检查元素是否存在
    if (!countEl || !btnEl) return;

    // 获取已选中的歌曲数量
    const count = selectedForDelete.length;

    // 更新计数文本
    countEl.textContent = count > 0 ? `已选 ${count} 首` : '请选择要删除的歌曲';

    // 启用/禁用提交按钮（有待删除歌曲时才启用）
    btnEl.disabled = count === 0;
}

// ============================================
// 提交删除请求
// 功能：将删除数据保存到 localStorage，跳转到提交页面
// ============================================
function submitDeleteRequest() {
    // 检查是否有选中的歌曲
    if (selectedForDelete.length === 0) return;

    // 获取歌曲列表
    const songsList = window.songs || [];

    // 根据 ID 查找选中的歌曲详情
    const songsToDelete = selectedForDelete.map(id =>
        songsList.find(s => s.id === id)
    ).filter(Boolean);

    // 构建删除数据对象
    const deleteData = songsToDelete.map(s => ({
        title: s.title,    // 歌曲名称
        artist: s.artist,  // 歌手
        id: s.id,          // 歌曲 ID
    }));

    // 保存到 localStorage
    localStorage.setItem('submitForm', JSON.stringify({
        type: 'delete',           // 类型：删除
        songs: deleteData,        // 待删除歌曲列表
    }));

    // 打开提交页面
    window.open('submit.html', '_blank');

    // 退出删除模式
    toggleDeleteMode();
}

// ============================================
// 导出模块
// 将功能挂载到全局对象，供 HTML 页面调用
// ============================================
window.DeleteModule = {
    toggle: toggleDeleteMode,           // 切换删除模式
    toggleSelect: toggleDeleteSelect,   // 切换删除选择
    submit: submitDeleteRequest,        // 提交删除请求
    isActive: () => deleteMode          // 检查是否在删除模式
};
