// ============================================
// 歌词纠错页面模块
// 功能：提供前端界面让用户提交歌词纠错，支持表格格式输入
// 数据存储在 localStorage，跳转到提交页面创建 Issue
// ============================================

// ============================================
// 全局状态变量
// ============================================

// 纠错模式开关：是否处于歌词纠错编辑状态
let correctionMode = false;

// 纠错列表：存储用户填写的所有纠错项
// 格式：[{ lineNum, originalText, newText }]
let correctionList = [];

// 当前选中的纠错行索引（用于高亮显示）
let selectedCorrectionIndex = -1;

// ============================================
// 切换纠错模式
// 功能：点击"纠错"按钮时的入口函数
// 如果未选择歌曲则提示用户先选择歌曲
// ============================================
function toggleCorrectionMode() {
    // 获取当前选中的歌曲
    const song = window.currentSong;
    if (!song) {
        // 未选择歌曲，弹出提示
        alert('请先选择一首歌曲');
        return;
    }

    // 如果已在纠错模式，退出纠错
    if (correctionMode) {
        exitCorrectionMode();
        return;
    }

    // 进入纠错模式
    enterCorrectionMode();
}

// ============================================
// 进入纠错模式
// 功能：初始化纠错界面，设置歌词行的点击事件
// ============================================
function enterCorrectionMode() {
    // 重置纠错状态
    correctionMode = true;
    correctionList = [];
    selectedCorrectionIndex = -1;

    // 获取歌词内容容器
    const lyricsContent = document.getElementById('lyricsContent');
    if (lyricsContent) {
        // 添加纠错模式样式类
        lyricsContent.classList.add('correction-mode');
    }

    // 显示纠错横幅
    showCorrectionBanner();

    // 为每行歌词添加点击事件
    document.querySelectorAll('.lyric-line').forEach((line) => {
        // 获取行索引
        const lineIndex = parseInt(line.dataset.line);
        // 跳过段落分隔符（没有 chars 属性的行）
        if (isNaN(lineIndex)) return;

        // 绑定点击事件用于选择纠错行
        line.onclick = (e) => handleCorrectionLineClick(e, lineIndex);
        // 设置鼠标样式为指针，提示用户可点击
        line.style.cursor = 'pointer';
    });

    // 启用标题编辑功能（让用户可以修改歌曲信息）
    enableTitleEditing();

    // 禁用导航列表的点击事件（避免与纠错冲突）
    disableSongListInteraction();
}

// ============================================
// 处理纠错行点击
// 功能：用户点击某行歌词时，弹出编辑框让用户输入正确歌词
//
// 参数：
//   - event: 点击事件对象
//   - displayLineIndex: 显示行索引（0-based，与 data-line 属性对应）
// ============================================
function handleCorrectionLineClick(event, displayLineIndex) {
    // 检查是否在纠错模式
    if (!correctionMode) return false;

    // 阻止事件冒泡，避免触发其他点击事件
    event.stopPropagation();

    // 获取当前歌曲
    const song = window.currentSong;
    // 从行元素获取实际歌曲歌词数组中的索引
    const songIndex = parseInt(event.currentTarget.dataset.songIndex);
    if (isNaN(songIndex)) return;

    // 获取该行的歌词数据
    const line = song.lyrics[songIndex];
    if (!line || !line.chars) return;

    // displayLineIndex + 1 就是用户看到的行号（从1开始）
    const displayLine = displayLineIndex + 1;

    // 获取原始歌词文本
    const originalText = line.chars.join('');
    // 检查该行是否已经在纠错列表中
    const existingIndex = correctionList.findIndex(c => c.lineNum === displayLine);
    const currentText = existingIndex >= 0 ? correctionList[existingIndex].newText : originalText;

    // 弹出编辑对话框，让用户输入正确歌词
    const newText = prompt(`修改第 ${displayLine} 行歌词：`, currentText);

    // 用户取消编辑，不做任何操作
    if (newText === null) return;

    // 处理编辑结果
    if (newText === originalText) {
        // 用户输入的内容与原文相同
        // 如果之前有编辑记录，则删除
        if (existingIndex >= 0) {
            correctionList.splice(existingIndex, 1);
        }
    } else if (newText.trim()) {
        // 用户输入了新内容
        if (existingIndex >= 0) {
            // 该行已在纠错列表中，更新新歌词
            correctionList[existingIndex].newText = newText.trim();
        } else {
            // 该行不在纠错列表中，新增纠错项
            correctionList.push({
                lineNum: displayLine,
                originalText: originalText,
                newText: newText.trim()
            });
        }
    }

    // 更新界面显示
    updateCorrectionUI();
}

// ============================================
// 显示纠错横幅
// 功能：在页面顶部显示纠错模式提示横幅
// ============================================
function showCorrectionBanner() {
    // 先移除可能已存在的横幅
    hideCorrectionBanner();

    // 创建横幅元素
    const banner = document.createElement('div');
    banner.className = 'correction-banner';
    banner.id = 'correctionBanner';
    banner.innerHTML = `
        <div class="correction-banner-content">
            <div class="correction-banner-title">
                <span>📝 歌词纠错模式</span>
            </div>
            <div class="correction-banner-subtitle">
                点击歌词行进行编辑，确认后添加到列表
            </div>
        </div>
        <div class="correction-banner-actions">
            <span id="correctionStatusText" style="font-size:13px;margin-right:8px;"></span>
            <button class="correction-banner-btn submit" id="submitCorrectionBtn" onclick="submitCorrection()" disabled>
                提交纠错
            </button>
            <button class="correction-banner-btn cancel" onclick="exitCorrectionMode()">
                退出
            </button>
        </div>
    `;

    // 添加到页面顶部
    document.body.appendChild(banner);

    // 调整页面内容位置，避免被横幅遮挡
    document.body.style.paddingTop = '60px';
}

// ============================================
// 隐藏纠错横幅
// 功能：移除纠错模式横幅，恢复页面布局
// ============================================
function hideCorrectionBanner() {
    // 移除横幅元素
    document.getElementById('correctionBanner')?.remove();
    // 恢复页面 padding
    document.body.style.paddingTop = '';
}

// ============================================
// 启用标题编辑功能
// 功能：让用户可以点击歌曲标题进行编辑
// 用于修改歌曲的歌手、填词等信息
// ============================================
function enableTitleEditing() {
    // 获取当前歌曲
    const song = window.currentSong;

    // 定义可编辑的字段
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
            // 设置鼠标样式为指针
            el.style.cursor = 'pointer';
            // 设置提示文字
            el.title = `点击编辑${field.label}`;
            // 绑定点击事件
            el.onclick = (e) => {
                e.stopPropagation();
                // 弹出编辑对话框
                const newValue = prompt(`修改${field.label}：`, field.value);
                if (newValue !== null && newValue !== field.value) {
                    // 保存修改到歌曲对象
                    song[field.key] = newValue.trim();
                    // 添加视觉提示（绿色边框）
                    el.style.outline = '2px solid #28a745';
                    el.style.borderRadius = '4px';
                    // 更新界面
                    updateCorrectionUI();
                }
            };
        }
    });
}

// ============================================
// 禁用歌曲列表交互
// 功能：在纠错模式下禁用歌曲列表的点击事件，避免冲突
// ============================================
function disableSongListInteraction() {
    // 获取歌曲列表项
    const songItems = document.querySelectorAll('.song-item');
    songItems.forEach(item => {
        // 备份原有的 onclick
        const originalOnclick = item.getAttribute('onclick');
        // 移除点击事件
        item.style.pointerEvents = 'none';
        item.style.opacity = '0.6';
        // 存储原始 onclick 以便恢复
        item.dataset.originalOnclick = originalOnclick;
    });
}

// ============================================
// 恢复歌曲列表交互
// 功能：退出纠错模式后恢复歌曲列表的点击事件
// ============================================
function restoreSongListInteraction() {
    // 获取歌曲列表项
    const songItems = document.querySelectorAll('.song-item');
    songItems.forEach(item => {
        // 恢复点击事件
        item.style.pointerEvents = '';
        item.style.opacity = '';
        // 移除视觉提示
        item.style.outline = '';
        item.style.borderRadius = '';
    });
}

// ============================================
// 更新纠错界面
// 功能：刷新纠错状态显示，包括横幅上的计数和列表内容
// ============================================
function updateCorrectionUI() {
    // 更新状态文本和按钮状态
    updateCorrectionStatus();

    // 更新纠错列表显示
    updateCorrectionListDisplay();
}

// ============================================
// 更新纠错状态
// 功能：更新横幅上的纠错计数和提交按钮状态
// ============================================
function updateCorrectionStatus() {
    // 获取状态文本元素和提交按钮元素
    const statusText = document.getElementById('correctionStatusText');
    const submitBtn = document.getElementById('submitCorrectionBtn');

    // 计算总纠错数
    const totalCount = correctionList.length;

    // 更新状态文本
    if (statusText) {
        statusText.textContent = totalCount > 0 ? `${totalCount} 处修改` : '';
    }

    // 启用/禁用提交按钮（有待纠错时才启用）
    if (submitBtn) {
        submitBtn.disabled = totalCount === 0;
    }
}

// ============================================
// 更新纠错列表显示
// 功能：显示用户已添加的所有纠错项
// ============================================
function updateCorrectionListDisplay() {
    // 获取歌曲列表容器
    const songListContainer = document.querySelector('.song-list-container');
    if (!songListContainer) return;

    // 获取或创建纠错列表面板
    let panel = document.getElementById('correctionListPanel');
    if (!panel) {
        panel = document.createElement('div');
        panel.id = 'correctionListPanel';
        panel.className = 'correction-list-panel';
        songListContainer.appendChild(panel);
    }

    // 构建列表 HTML
    let html = '<div class="correction-list-title">已添加的纠错</div>';

    if (correctionList.length === 0) {
        // 没有纠错项
        html += '<div class="correction-list-empty">暂无纠错，请点击歌词行进行编辑</div>';
    } else {
        // 渲染每个纠错项
        correctionList.forEach((item, index) => {
            html += `
                <div class="correction-list-item ${selectedCorrectionIndex === index ? 'selected' : ''}" 
                     onclick="selectCorrectionItem(${index})">
                    <div class="correction-item-line">第 ${item.lineNum} 行</div>
                    <div class="correction-item-text">
                        <div class="correction-item-original">原：${item.originalText.substring(0, 15)}${item.originalText.length > 15 ? '...' : ''}</div>
                        <div class="correction-item-new">改：${item.newText.substring(0, 15)}${item.newText.length > 15 ? '...' : ''}</div>
                    </div>
                    <button class="correction-item-remove" onclick="removeCorrectionItem(${index}, event)">×</button>
                </div>
            `;
        });
    }

    // 更新面板内容
    panel.innerHTML = html;
}

// ============================================
// 选中纠错项
// 功能：高亮显示选中的纠错项，并滚动到对应歌词行
//
// 参数：
//   - index: 纠错项在数组中的索引
// ============================================
function selectCorrectionItem(index) {
    // 更新选中索引
    selectedCorrectionIndex = index;

    // 获取对应的纠错项
    const item = correctionList[index];
    if (!item) return;

    // 在歌词中找到对应的行并滚动到视野内
    const lines = document.querySelectorAll('.lyric-line');
    lines.forEach(line => {
        const lineIndex = parseInt(line.dataset.line);
        // 判断是否匹配（displayLineIndex = item.lineNum - 1）
        if (lineIndex === item.lineNum - 1) {
            line.scrollIntoView({ behavior: 'smooth', block: 'center' });
            line.classList.add('highlight');
            setTimeout(() => line.classList.remove('highlight'), 1500);
        }
    });

    // 更新列表显示（更新选中状态）
    updateCorrectionListDisplay();
}

// ============================================
// 删除纠错项
// 功能：从纠错列表中移除指定的纠错项
//
// 参数：
//   - index: 纠错项在数组中的索引
//   - event: 点击事件对象
// ============================================
function removeCorrectionItem(index, event) {
    // 阻止事件冒泡
    event.stopPropagation();

    // 从数组中移除该项
    correctionList.splice(index, 1);

    // 调整选中索引
    if (selectedCorrectionIndex >= index && selectedCorrectionIndex > 0) {
        selectedCorrectionIndex--;
    }

    // 更新界面
    updateCorrectionUI();
}

// ============================================
// 提交纠错
// 功能：将纠错数据保存到 localStorage，跳转到提交页面
// ============================================
function submitCorrection() {
    // 检查是否有纠错项
    if (correctionList.length === 0) return;

    // 获取当前歌曲
    const song = window.currentSong;
    if (!song) return;

    // 构建提交数据对象
    const submitData = {
        // 提交类型：歌词纠错
        type: 'correction',
        // 歌曲名称
        song: song.title,
        // 纠错列表
        corrections: correctionList.map(c => ({
            // 行号
            line: c.lineNum,
            // 原始歌词
            originalText: c.originalText,
            // 正确歌词
            newText: c.newText
        }))
    };

    // 保存到 localStorage
    localStorage.setItem('submitForm', JSON.stringify(submitData));

    // 提示用户
    alert(`已将 ${correctionList.length} 处纠错保存，准备跳转到提交页面...`);

    // 跳转到提交页面
    window.open('submit.html?type=correction', '_blank');

    // 退出纠错模式
    exitCorrectionMode();
}

// ============================================
// 退出纠错模式
// 功能：清理所有纠错状态，恢复页面到正常模式
// ============================================
function exitCorrectionMode() {
    // 重置状态变量
    correctionMode = false;
    correctionList = [];
    selectedCorrectionIndex = -1;

    // 移除横幅
    hideCorrectionBanner();

    // 移除纠错列表面板
    document.getElementById('correctionListPanel')?.remove();

    // 移除歌词行的点击事件和样式
    document.querySelectorAll('.lyric-line').forEach(line => {
        line.onclick = null;
        line.style.cursor = '';
        line.classList.remove('highlight');
    });

    // 移除歌词内容容器的纠错模式样式
    const lyricsContent = document.getElementById('lyricsContent');
    if (lyricsContent) {
        lyricsContent.classList.remove('correction-mode');
    }

    // 恢复歌曲列表交互
    restoreSongListInteraction();

    // 禁用标题编辑
    disableTitleEditing();

    // 重新渲染歌曲列表（恢复正常状态）
    if (window.renderSongList) {
        window.renderSongList();
    }
}

// ============================================
// 禁用标题编辑功能
// 功能：退出纠错模式时，移除标题的编辑功能
// ============================================
function disableTitleEditing() {
    // 定义需要禁用编辑的字段
    const fields = ['songTitle', 'songArtist', 'songLyricist', 'songComposer'];

    fields.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            // 清除编辑相关的样式和事件
            el.style.cursor = '';
            el.title = '';
            el.onclick = null;
            el.style.outline = '';
            el.style.borderRadius = '';
        }
    });
}

// ============================================
// 导出模块
// 将功能挂载到全局对象，供 HTML 页面调用
// ============================================
window.CorrectionModule = {
    // 切换纠错模式
    toggle: toggleCorrectionMode,
    // 检查是否在纠错模式
    isActive: () => correctionMode,
    // 获取纠错列表
    getList: () => correctionList
};
