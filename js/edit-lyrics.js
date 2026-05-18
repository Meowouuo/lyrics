// ============================================
// 修改歌词模式模块 - 子菜单选择版（带确认按钮）
// 功能：提供前端界面让用户编辑歌词，支持逐行纠错、整首替换、插入行三种模式
// 用户完成编辑后，数据存储在 localStorage 中，跳转到提交页面创建 Issue
// ============================================

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
    // 先移除可能已存在的弹窗（避免重复创建）
    hideEditTypeSelector();
    
    // 创建遮罩层
    const overlay = document.createElement('div');
    overlay.className = 'edit-type-overlay';
    overlay.id = 'editTypeOverlay';
    // 点击遮罩可关闭弹窗
    overlay.onclick = hideEditTypeSelector;
    
    // 创建弹窗内容容器
    const popup = document.createElement('div');
    popup.className = 'edit-type-popup';
    popup.id = 'editTypePopup';
    
    // 弹窗HTML结构：标题 + 三个选项卡片 + 取消按钮
    popup.innerHTML = `
        <div class="edit-type-title">选择编辑方式</div>
        <div class="edit-type-options">
            <!-- 逐行纠错选项：点击歌词行进行编辑 -->
            <div class="edit-type-option" onclick="selectEditType('line')">
                <div class="edit-type-icon"><svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/></svg></div>
                <div class="edit-type-name">逐行纠错</div>
                <div class="edit-type-desc">点击歌词行进行编辑</div>
            </div>
            <!-- 整首替换选项：粘贴完整歌词替换整首 -->
            <div class="edit-type-option" onclick="selectEditType('full')">
                <div class="edit-type-icon"><svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"/><path d="M16 16h5v5"/></svg></div>
                <div class="edit-type-name">整首替换</div>
                <div class="edit-type-desc">粘贴完整歌词替换整首</div>
            </div>
            <!-- 插入行选项：在指定位置插入新歌词 -->
            <div class="edit-type-option" onclick="selectEditType('insert')">
                <div class="edit-type-icon"><svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg></div>
                <div class="edit-type-name">插入行</div>
                <div class="edit-type-desc">在指定位置插入新歌词</div>
            </div>
        </div>
        <!-- 取消按钮 -->
        <button class="edit-type-cancel" onclick="hideEditTypeSelector()">取消</button>
    `;
    
    // 将遮罩层和弹窗添加到页面
    document.body.appendChild(overlay);
    document.body.appendChild(popup);
    // 加载必要的CSS样式
    addEditStyles();
}

// ============================================
// 隐藏编辑类型选择弹窗
// 功能：移除弹窗和遮罩层，清理DOM
// ============================================
function hideEditTypeSelector() {
    // 移除遮罩层元素（可选链避免null错误）
    document.getElementById('editTypeOverlay')?.remove();
    // 移除弹窗元素
    document.getElementById('editTypePopup')?.remove();
}

// ============================================
// 选择编辑类型
// 功能：用户选择编辑方式后的处理函数，初始化对应模式的UI
//
// 参数：
//   - type: 编辑类型 'line'（逐行纠错）/'full'（整首替换）/'insert'（插入行）
// ============================================
function selectEditType(type) {
    // 关闭选择弹窗（已选完，不需要再显示了）
    hideEditTypeSelector();
    
    // 设置编辑类型和模式标志
    editLyricsType = type;
    editLyricsMode = true;
    
    // 重置所有编辑数据（清空之前可能存在的修改）
    editedLyrics = [];
    fullReplacements = [];
    insertions = [];
    editedMeta = {};
    currentEdit = null;
    
    // 更新工具栏按钮状态
    updateEditLyricsBtn();
    
    // 根据选择的类型进入对应的编辑模式
    switch (type) {
        case 'line':
            // 逐行纠错：点击歌词行进行编辑
            enterLineEditMode();
            break;
        case 'full':
            // 整首替换：粘贴完整歌词
            enterFullReplaceMode();
            break;
        case 'insert':
            // 插入行：在指定位置添加新歌词
            enterInsertMode();
            break;
    }
}

// ============================================
// 逐行编辑模式
// 功能：进入逐行纠错模式，用户可以点击任意歌词行进行编辑
// 为每行歌词绑定点击事件，显示编辑对话框
// ============================================
function enterLineEditMode() {
    // 获取歌词内容容器（歌词显示区域）
    const lyricsContent = document.getElementById('lyricsContent');
    // 添加编辑模式样式类（视觉区分）
    lyricsContent.classList.add('edit-lyrics-mode');
    
    // 显示编辑横幅提示（告知用户当前模式）
    showEditBanner('逐行纠错', '点击歌词行进行编辑，确认后添加到列表');
    // 启用标题编辑功能（允许修改歌曲信息）
    enableTitleEditing();
    
    // 为每行歌词添加点击事件
    document.querySelectorAll('.lyric-line').forEach((line) => {
        // 获取行索引（用于定位是哪一行）
        const lineIndex = parseInt(line.dataset.line);
        if (isNaN(lineIndex)) return;
        // 绑定点击事件处理器
        line.onclick = (e) => handleLineClick(e, lineIndex);
        // 设置鼠标样式为指针（提示用户可点击）
        line.style.cursor = 'pointer';
    });
    
    // 显示已确认修改列表面板（汇总所有修改）
    showEditListPanel();
}

// ============================================
// 整首替换模式
// 功能：进入整首替换模式，用户可以粘贴完整歌词替换整首
// 显示文本输入框，收集用户粘贴的完整歌词
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
    
    // 显示整首替换输入面板（文本输入区）
    showFullReplacePanel();
    // 显示已确认修改列表面板
    showEditListPanel();
}

// ============================================
// 插入行模式
// 功能：进入插入行模式，用户可以在指定位置插入新歌词
// 计算最大行号（考虑segment分割），高亮可点击的行
// ============================================
function enterInsertMode() {
    // 获取歌词内容容器
    const lyricsContent = document.getElementById('lyricsContent');
    // 添加编辑模式样式类
    lyricsContent.classList.add('edit-lyrics-mode');
    
    // 获取当前歌曲数据
    const song = window.currentSong;
    
    // 计算最大显示行号（用户可见的行号）
    // 规则：每个segment算一行，书名号和括号内的空格不分割
    let maxLine = 0;
    song.lyrics.forEach(l => {
        // 跳过段落分隔符
        if (!l.chars) return;
        
        let segments = 1;  // 至少有一个segment
        let inBrackets = 0;  // 括号嵌套层级
        
        // 遍历每个字符，统计segment数量
        for (const c of l.chars) {
            // 进入书名号或括号，层级+1
            if (c === '《' || c === '(' || c === '（') inBrackets++;
            // 退出书名号或括号，层级-1
            if (c === '》' || c === ')' || c === '）') inBrackets = Math.max(0, inBrackets - 1);
            // 括号外的空格算作segment分隔符
            if (c === ' ' && inBrackets === 0) segments++;
        }
        // 累加到总行号
        maxLine += segments;
    });
    
    // 显示编辑横幅提示
    showEditBanner('插入行', '选择位置并输入歌词，确认后添加到列表');
    // 启用标题编辑功能
    enableTitleEditing();
    
    // 显示插入行输入面板（传入最大行号限制输入范围）
    showInsertPanel(maxLine);
    // 显示已确认修改列表面板
    showEditListPanel();
    
    // 高亮显示可点击的行（用于选择插入位置）
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
// 功能：显示用户已确认的所有修改项列表，支持删除操作
// 位于页面右侧，显示所有修改的摘要
// ============================================
function showEditListPanel() {
    // 移除已存在的面板（避免重复）
    const existing = document.getElementById('editListPanel');
    if (existing) existing.remove();
    
    // 创建面板元素
    const panel = document.createElement('div');
    panel.className = 'edit-list-panel';
    panel.id = 'editListPanel';
    // 面板HTML结构：标题 + 内容区 + 空状态提示
    panel.innerHTML = `
        <div class="edit-list-title">已确认的修改</div>
        <div class="edit-list-content" id="editListContent">
            <div class="edit-list-empty">暂无修改，请在上方操作</div>
        </div>
    `;
    // 添加到页面（固定定位在右侧）
    document.body.appendChild(panel);
    
    // 初始化列表内容（显示空状态或已有修改）
    updateEditList();
}

// ============================================
// 显示整首替换输入面板
// 功能：显示文本输入框让用户粘贴完整歌词
// 提供textarea和确认按钮
// ============================================
function showFullReplacePanel() {
    // 移除已存在的面板
    const existing = document.getElementById('fullReplaceInputPanel');
    if (existing) existing.remove();
    
    // 创建面板元素
    const panel = document.createElement('div');
    panel.className = 'edit-input-panel';
    panel.id = 'fullReplaceInputPanel';
    // 面板HTML：标题 + textarea + 确认按钮
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
// 包含位置下拉框、行号输入框、歌词输入区
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
    // 面板HTML：标题 + 位置选择行 + 行号输入 + 歌词输入区 + 确认按钮
    panel.innerHTML = `
        <div class="edit-input-title">插入行</div>
        <div class="edit-input-row">
            <!-- 位置选择：在行前或行后插入 -->
            <select id="insertPositionInput">
                <option value="after">在行后插入</option>
                <option value="before">在行前插入</option>
            </select>
            <!-- 行号输入：限制在1到maxLine之间 -->
            <input type="number" id="insertLineInput" min="1" max="${maxLine}" value="1" placeholder="行号">
        </div>
        <!-- 歌词输入区：支持多行输入 -->
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
// 验证输入非空，然后添加到fullReplacements数组
// ============================================
function confirmFullReplace() {
    // 获取输入的歌词内容
    const lyrics = document.getElementById('fullLyricsInput')?.value.trim();
    if (!lyrics) {
        // 未输入内容，提示用户
        alert('请输入完整歌词');
        return;
    }
    
    // 添加到整首替换数组（可多次添加，取最后一个）
    fullReplacements.push({ lyrics });
    // 清空输入框，方便下次输入
    document.getElementById('fullLyricsInput').value = '';
    // 更新列表显示（刷新已确认修改面板）
    updateEditList();
    // 更新状态显示（更新修改计数）
    updateEditStatus();
}

// ============================================
// 确认插入行
// 功能：用户点击确认按钮后，将插入信息添加到插入列表
// 支持插入空白行（用于歌词分段）
// ============================================
function confirmInsert() {
    // 获取插入位置：'before'（行前）或'after'（行后）
    const position = document.getElementById('insertPositionInput')?.value || 'after';
    // 获取用户输入的行号
    const line = parseInt(document.getElementById('insertLineInput')?.value) || 1;
    // 获取要插入的歌词内容
    const lyrics = document.getElementById('insertLyricsInput')?.value;
    
    // 验证输入：歌词内容不能为空
    if (!lyrics) {
        // 提示用户（空行也是一种有效输入）
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
// 显示所有类型的修改：标题、逐行、整首、插入
// ============================================
function updateEditList() {
    // 获取列表内容容器
    const content = document.getElementById('editListContent');
    if (!content) return;  // 容器不存在则跳过
    
    let html = '';  // 累积HTML内容
    let count = 0;  // 统计修改数量
    
    // 显示标题修改（歌名、歌手、填词、作曲）
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
    
    // 获取当前歌曲数据（用于计算行号）
    const song = window.currentSong;
    
    // 显示逐行纠错项
    editedLyrics.forEach((item, idx) => {
        // 计算displayLine（基于segment的行号，与渲染逻辑一致）
        // 确保用户看到的行号与前端显示一致
        let displayLine = 0;
        // 遍历之前的所有歌词行
        for (let i = 0; i < item.lineIndex; i++) {
            // 跳过段落分隔符
            if (song.lyrics[i].paragraphBreak) continue;
            if (!song.lyrics[i].chars) continue;
            
            // 统计这行的segment数（与前端渲染逻辑一致）
            // 规则1：连续重复词中间空格 → 不分割
            // 规则2：英文单词间空格 → 不分割
            // 规则3：空格前汉字数<3 → 不分割
            // 规则4：其他空格 → 分割
            // 规则5：括号内空格 → 不分割
            let segments = 1;
            let inBrackets = 0;
            let charCountSinceLastSpace = 0;
            let prevWord = '';
            // 提取上一个词（用于规则1判断）
            let lastWord = '';
            for (let ci = song.lyrics[i].chars.length - 1; ci >= 0; ci--) {
                const ch = song.lyrics[i].chars[ci];
                if (ch === ' ' || ch === '\u3000') break;
                lastWord = ch + lastWord;
            }
            for (let ci = 0; ci < song.lyrics[i].chars.length; ci++) {
                const c = song.lyrics[i].chars[ci];
                if (c === '《' || c === '(' || c === '（') inBrackets++;
                if (c === '》' || c === ')' || c === '）') inBrackets = Math.max(0, inBrackets - 1);
                if ((c === ' ' || c === '\u3000') && inBrackets === 0) {
                    // 收集空格后的下一个词
                    let nextWord = '';
                    for (let ni = ci + 1; ni < song.lyrics[i].chars.length; ni++) {
                        if (song.lyrics[i].chars[ni] === ' ' || song.lyrics[i].chars[ni] === '\u3000') break;
                        nextWord += song.lyrics[i].chars[ni];
                    }
                    // 规则1：连续重复词 → 不分割
                    if (nextWord && prevWord === nextWord) { /* 不分割 */ }
                    // 规则2：英文间空格 → 不分割
                    else if (/^[a-zA-Z]/.test(prevWord) && /^[a-zA-Z]/.test(nextWord)) { /* 不分割 */ }
                    // 规则3：空格前汉字数<3 → 不分割
                    else if (charCountSinceLastSpace < 3) { /* 不分割 */ }
                    // 规则4：其他 → 分割
                    else { segments++; }
                    charCountSinceLastSpace = 0;
                    prevWord = '';
                    // 收集空格后的词作为新的 prevWord
                    for (let ni = ci + 1; ni < song.lyrics[i].chars.length; ni++) {
                        if (song.lyrics[i].chars[ni] === ' ' || song.lyrics[i].chars[ni] === '\u3000') break;
                        prevWord += song.lyrics[i].chars[ni];
                    }
                } else {
                    if (/[\u4e00-\u9fff\u3400-\u4dbf]/.test(c)) charCountSinceLastSpace++;
                    // 累积 prevWord（非空格字符）
                    if (c !== ' ' && c !== '\u3000') {
                        if (!prevWord || song.lyrics[i].chars[ci - 1] === ' ' || song.lyrics[i].chars[ci - 1] === '\u3000') {
                            prevWord = c;
                        } else {
                            prevWord += c;
                        }
                    }
                }
            }
            displayLine += segments;
        }
        displayLine += 1; // 转换为1-based索引
        
        // 显示修改项（截断过长的文本）
        const preview = item.newText.substring(0, 20);
        html += `<div class="edit-list-item"><span class="edit-list-tag line">第${displayLine}行</span> ${preview}${item.newText.length > 20 ? '...' : ''} <button onclick="removeLineEdit(${idx})" class="edit-list-remove">删除</button></div>`;
        count++;
    });
    
    // 显示整首替换项
    fullReplacements.forEach((item, idx) => {
        // 统计歌词行数
        const lines = item.lyrics.split('\n').filter(l => l.trim()).length;
        html += `<div class="edit-list-item"><span class="edit-list-tag full">整首</span> ${lines}行歌词 <button onclick="removeFullReplace(${idx})" class="edit-list-remove">删除</button></div>`;
        count++;
    });
    
    // 显示插入行项
    insertions.forEach((item, idx) => {
        // 统计插入的歌词行数
        const lines = item.lyrics.split('\n').filter(l => l.trim()).length;
        const posText = item.position === 'before' ? '前' : '后';
        html += `<div class="edit-list-item"><span class="edit-list-tag insert">插入</span> 第${item.line}行${posText} ${lines}行 <button onclick="removeInsert(${idx})" class="edit-list-remove">删除</button></div>`;
        count++;
    });
    
    // 如果没有修改，显示空状态提示
    if (count === 0) {
        html = '<div class="edit-list-empty">暂无修改，请在上方操作</div>';
    }
    
    // 更新DOM内容
    content.innerHTML = html;
}

// ============================================
// 删除编辑项
// 功能：从对应数组中移除指定的编辑项，刷新显示
// 提供三个函数分别处理三种编辑类型
//
// 参数：
//   - idx: 数组索引，指定要删除的项
// ============================================

// 删除逐行纠错项
function removeLineEdit(idx) {
    editedLyrics.splice(idx, 1);
    updateEditList();
    updateEditStatus();
}

// 删除整首替换项
function removeFullReplace(idx) {
    fullReplacements.splice(idx, 1);
    updateEditList();
    updateEditStatus();
}

// 删除插入行项
function removeInsert(idx) {
    insertions.splice(idx, 1);
    updateEditList();
    updateEditStatus();
}

// ============================================
// 逐行编辑点击处理
// 功能：用户点击某行歌词时，弹出编辑对话框
// 支持修改歌词内容，自动追踪编辑记录
//
// 参数：
//   - event: 点击事件对象
//   - displayLineIndex: 显示行索引（0-based）
// ============================================
function handleLineClick(event, displayLineIndex) {
    // 检查是否在编辑模式（非编辑模式不处理点击）
    if (!editLyricsMode) return false;
    
    // 阻止事件冒泡（避免触发歌曲选择等父级事件）
    event.stopPropagation();
    
    // 获取当前歌曲数据
    const song = window.currentSong;
    // displayLineIndex是用户可见的行号，通过data-song-index获取实际的数组索引
    const songIndex = parseInt(event.currentTarget.dataset.songIndex);
    if (isNaN(songIndex)) return;
    const line = song.lyrics[songIndex];
    if (!line || !line.chars) return;
    
    // displayLineIndex + 1 就是用户看到的行号（1-based）
    const displayLine = displayLineIndex + 1;
    
    // 获取原始歌词文本（从chars数组拼接）
    const originalText = line.chars.join('');
    // 检查是否已有编辑记录（同一行可能被编辑多次）
    const existingEdit = editedLyrics.find(e => e.lineIndex === songIndex);
    // 如果有记录，用记录中的新文本；否则用原始文本
    const currentText = existingEdit ? existingEdit.newText : originalText;
    
    // 弹出编辑对话框（prompt会显示当前文本供编辑）
    const newText = prompt(`修改第 ${displayLine} 行歌词：`, currentText);
    if (newText === null) return; // 用户取消编辑
    
    // 处理编辑结果
    if (newText === originalText) {
        // 内容与原文相同（用户未修改或还原）
        // 如果有编辑记录则删除（撤销之前的修改）
        const idx = editedLyrics.findIndex(e => e.lineIndex === songIndex);
        if (idx > -1) editedLyrics.splice(idx, 1);
    } else if (newText.trim()) {
        // 有新内容（去除首尾空格后非空）
        // 查找是否已有该行的编辑记录
        const idx = editedLyrics.findIndex(e => e.lineIndex === songIndex);
        if (idx > -1) {
            // 已存在记录，更新新文本
            editedLyrics[idx].newText = newText.trim();
        } else {
            // 不存在记录，添加新记录
            editedLyrics.push({ lineIndex: songIndex, originalText, newText: newText.trim() });
        }
    }
    
    // 刷新列表和状态显示
    updateEditList();
    updateEditStatus();
}

// ============================================
// 选择插入行
// 功能：用户点击某行歌词时，将其设置为插入位置
// 更新输入框中的行号，高亮选中的行
//
// 参数：
//   - event: 点击事件对象
//   - displayLineIndex: 显示行索引（0-based）
// ============================================
function selectInsertLine(event, displayLineIndex) {
    // 阻止事件冒泡
    event.stopPropagation();
    
    // data-line 现在是 displayLineIndex（从0开始）
    // +1 就是用户看到的行号（1-based）
    const displayLine = displayLineIndex + 1;
    
    // 更新输入框中的行号（同步显示）
    const input = document.getElementById('insertLineInput');
    if (input) input.value = displayLine;
    
    // 高亮选中的行（视觉反馈）
    // 先清除所有行的高亮
    document.querySelectorAll('.lyric-line').forEach(l => l.style.background = '');
    // 高亮当前选中的行
    event.currentTarget.style.background = '#e6f7ff';
}

// ============================================
// 显示编辑横幅
// 功能：在页面顶部显示编辑模式提示横幅
// 包含标题、说明、状态、提交和退出按钮
//
// 参数：
//   - title: 横幅标题（如"逐行纠错"）
//   - subtitle: 横幅副标题/说明文字
// ============================================
function showEditBanner(title, subtitle) {
    // 移除已存在的横幅（避免重复）
    hideEditBanner();
    
    // 创建横幅元素
    const banner = document.createElement('div');
    banner.className = 'edit-mode-banner';
    banner.id = 'editModeBanner';
    
    // 横幅HTML：左侧标题和说明，右侧状态和按钮
    banner.innerHTML = `
        <div>
            <!-- 编辑模式图标 + 标题 -->
            <div class="edit-mode-banner-title"><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.375 2.625a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4Z"/></svg> ${title}</div>
            <!-- 副标题说明 -->
            <div style="font-size:12px;opacity:0.9;">${subtitle}</div>
        </div>
        <div class="edit-mode-banner-actions">
            <!-- 状态文本（显示修改数量） -->
            <span id="editStatusText" style="font-size:13px;margin-right:8px;"></span>
            <!-- 提交按钮（初始禁用） -->
            <button class="edit-mode-banner-btn submit" id="submitEditBtn" onclick="submitEdit()" disabled>提交反馈</button>
            <!-- 退出按钮 -->
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
    document.body.style.paddingTop = '';  // 恢复默认padding
}

// ============================================
// 标题行可编辑
// 功能：让用户可以编辑歌曲的元信息（歌名、歌手、填词、作曲）
// 为每个字段绑定点击事件，弹出编辑对话框
// ============================================
function enableTitleEditing() {
    // 获取当前歌曲
    const song = window.currentSong;
    
    // 定义可编辑字段配置
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
            // 设置鼠标样式和提示
            el.style.cursor = 'pointer';
            el.title = `点击编辑${field.label}`;
            
            // 绑定点击事件
            el.onclick = (e) => {
                // 阻止冒泡（避免触发其他事件）
                e.stopPropagation();
                
                // 弹出编辑对话框
                const newValue = prompt(`修改${field.label}：`, field.value);
                if (newValue !== null) {
                    // 保存修改到editedMeta对象
                    editedMeta[field.key] = newValue.trim();
                    // 添加视觉提示（绿色边框）
                    el.style.outline = '2px solid #28a745';
                    el.style.borderRadius = '4px';
                    // 刷新列表和状态
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
// 恢复默认样式
// ============================================
function disableTitleEditing() {
    // 遍历所有可编辑字段，重置样式和事件
    ['songTitle', 'songArtist', 'songLyricist', 'songComposer'].forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.style.cursor = '';  // 恢复默认鼠标样式
            el.title = '';  // 移除提示
            el.onclick = null;  // 移除点击事件
            el.style.outline = '';  // 移除边框
            el.style.borderRadius = '';  // 恢复圆角
        }
    });
}

// ============================================
// 更新编辑状态
// 功能：更新横幅上的修改计数和提交按钮状态
// 根据当前修改数量决定按钮是否可用
// ============================================
function updateEditStatus() {
    // 获取状态文本元素和提交按钮
    const statusText = document.getElementById('editStatusText');
    const submitBtn = document.getElementById('submitEditBtn');
    
    // 计算总修改数（标题 + 逐行 + 整首 + 插入）
    const metaCount = Object.keys(editedMeta).length;
    const totalCount = metaCount + editedLyrics.length + fullReplacements.length + insertions.length;
    
    // 更新状态文本（显示修改数量）
    if (statusText) {
        statusText.textContent = totalCount > 0 ? `${totalCount} 处修改` : '';
    }
    
    // 根据是否有修改决定提交按钮状态
    if (submitBtn) {
        submitBtn.disabled = totalCount === 0;
    }
}

// ============================================
// 提交编辑
// 功能：将编辑数据保存到 localStorage，并跳转到提交页面
// 根据编辑类型构建对应的提交数据格式
// ============================================
function submitEdit() {
    // 获取当前歌曲
    const song = window.currentSong;
    if (!song) return;
    
    // 构建提交数据基础对象
    let submitData = {
        type: 'lyrics',  // 标识为歌词修改类型
        song: song.title,  // 歌曲名称
        correctionType: editLyricsType  // 具体修改类型
    };
    
    // 如果有标题修改，添加到提交数据
    if (Object.keys(editedMeta).length > 0) {
        submitData.meta = editedMeta;
    }
    
    // 根据编辑类型添加对应数据
    switch (editLyricsType) {
        case 'line':
            // 逐行纠错模式：添加纠错列表
            if (editedLyrics.length === 0) return;  // 没有修改则不提交
            
            // 将编辑记录转换为提交格式
            submitData.corrections = editedLyrics.map(e => {
                // 计算displayLine（基于segment的行号）
                // 确保与前端渲染逻辑一致
                let displayLine = 0;
                // 遍历之前的歌词行，累加segment数
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
                
                // 返回格式化后的纠错项
                return {
                    line: displayLine,  // 行号
                    originalText: e.originalText,  // 原歌词
                    newText: e.newText  // 新歌词
                };
            });
            break;
            
        case 'full':
            // 整首替换模式：添加完整歌词
            if (fullReplacements.length === 0) return;  // 没有修改则不提交
            // 如果有多个整首替换，取最后一个（覆盖之前的）
            submitData.fullLyrics = fullReplacements[fullReplacements.length - 1].lyrics;
            break;
            
        case 'insert':
            // 插入行模式：添加插入列表
            if (insertions.length === 0) return;  // 没有修改则不提交
            // 传递所有插入项
            submitData.insertions = insertions;
            break;
    }
    
    // 保存到 localStorage（供提交页面读取）
    localStorage.setItem('submitForm', JSON.stringify(submitData));
    // 跳转到提交页面（在新标签页打开）
    window.open('submit.html?type=lyrics', '_blank');
}

// ============================================
// 退出编辑模式
// 功能：清理所有编辑状态，恢复页面到正常模式
// 重置变量、移除UI元素、恢复事件绑定
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
    hideEditBanner();  // 移除编辑横幅
    document.getElementById('editListPanel')?.remove();  // 移除列表面板
    document.getElementById('fullReplaceInputPanel')?.remove();  // 移除整首替换面板
    document.getElementById('insertInputPanel')?.remove();  // 移除插入行面板
    
    // 移除歌词行的点击事件和样式
    document.querySelectorAll('.lyric-line').forEach(line => {
        line.onclick = null;  // 移除点击事件
        line.style.cursor = '';  // 恢复鼠标样式
        line.style.background = '';  // 清除高亮
    });
    
    // 禁用标题编辑功能
    disableTitleEditing();
    // 移除编辑模式样式类
    document.getElementById('lyricsContent')?.classList.remove('edit-lyrics-mode');
    
    // 更新按钮显示
    updateEditLyricsBtn();
}

// ============================================
// 更新改歌词按钮
// 功能：根据编辑状态更新按钮的显示文字和样式
// 编辑模式时显示"退出改歌词"
// ============================================
function updateEditLyricsBtn() {
    // 获取按钮元素（通过选择器查找）
    const btn = document.querySelector('.toolbar-btn[onclick="EditLyricsModule.toggle()"]');
    if (!btn) return;
    
    // 编辑图标SVG
    const svgIcon = '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.375 2.625a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4Z"/></svg>';
    
    // 根据编辑状态更新按钮内容
    if (editLyricsMode) {
        btn.innerHTML = `<span class="icon">${svgIcon}</span><span>退出改歌词</span>`;
        btn.style.color = '#28a745';  // 绿色高亮
    } else {
        btn.innerHTML = `<span class="icon">${svgIcon}</span><span>改歌词</span>`;
        btn.style.color = '';  // 恢复默认颜色
    }
}

// ============================================
// 添加编辑样式
// 功能：动态添加编辑模式所需的 CSS 样式
// 包含遮罩、弹窗、横幅、面板、按钮等样式
// ============================================
function addEditStyles() {
    // 检查样式是否已存在（避免重复添加）
    if (document.getElementById('editLyricsStyles')) return;
    
    // 创建style元素
    const styles = document.createElement('style');
    styles.id = 'editLyricsStyles';
    
    // CSS样式定义
    styles.textContent = `
        /* ============================================ */
        /* 编辑类型选择弹窗样式 */
        /* ============================================ */
        
        /* 遮罩层：半透明黑色背景，铺满全屏 */
        .edit-type-overlay { 
            position: fixed; 
            top: 0; left: 0; right: 0; bottom: 0; 
            background: rgba(0,0,0,0.5); 
            z-index: 2000; 
        }
        
        /* 弹窗容器：居中显示，带阴影和圆角 */
        .edit-type-popup { 
            position: fixed; 
            top: 50%; left: 50%; 
            transform: translate(-50%, -50%); 
            background: var(--bg-primary); 
            border-radius: 12px; 
            padding: 24px; 
            width: 360px; 
            max-width: 90vw; 
            z-index: 2001; 
            box-shadow: 0 8px 32px rgba(0,0,0,0.2); 
        }
        
        /* 弹窗标题 */
        .edit-type-title { 
            font-size: 18px; 
            font-weight: 600; 
            text-align: center; 
            margin-bottom: 20px; 
            color: var(--text-primary); 
        }
        
        /* 选项容器：垂直排列 */
        .edit-type-options { 
            display: flex; 
            flex-direction: column; 
            gap: 12px; 
            margin-bottom: 20px; 
        }
        
        /* 单个选项卡片 */
        .edit-type-option { 
            display: flex; 
            align-items: center; 
            padding: 16px; 
            border: 2px solid var(--border-color); 
            border-radius: 8px; 
            cursor: pointer; 
            transition: all 0.2s;  /* 过渡动画 */
        }
        
        /* 选项悬停效果 */
        .edit-type-option:hover { 
            border-color: #28a745; 
            background: rgba(40, 167, 69, 0.1); 
        }
        
        /* 选项图标 */
        .edit-type-icon { 
            margin-right: 16px; 
            width: 40px; 
            text-align: center; 
            display: flex; 
            align-items: center; 
            justify-content: center; 
            color: #28a745; 
        }
        
        /* 选项名称 */
        .edit-type-name { 
            font-size: 16px; 
            font-weight: 600; 
            color: var(--text-primary); 
        }
        
        /* 选项描述 */
        .edit-type-desc { 
            font-size: 13px; 
            color: var(--text-tertiary); 
            margin-left: auto;  /* 靠右对齐 */
        }
        
        /* 取消按钮 */
        .edit-type-cancel { 
            width: 100%; 
            padding: 12px; 
            background: var(--bg-secondary); 
            border: none; 
            border-radius: 6px; 
            font-size: 15px; 
            cursor: pointer; 
            color: var(--text-secondary); 
        }
        
        .edit-type-cancel:hover { 
            background: var(--bg-tertiary); 
        }
        
        /* ============================================ */
        /* 编辑模式横幅样式 */
        /* ============================================ */
        
        /* 横幅容器：固定在顶部 */
        .edit-mode-banner { 
            position: fixed; 
            top: 0; left: 0; right: 0; 
            background: #28a745;  /* 绿色背景 */
            color: #fff; 
            padding: 12px 20px; 
            display: flex; 
            justify-content: space-between; 
            align-items: center; 
            z-index: 1000; 
        }
        
        /* 横幅标题 */
        .edit-mode-banner-title { 
            font-weight: 600; 
            display: flex; 
            align-items: center; 
            gap: 8px;  /* 图标和文字间距 */
        }
        
        /* 横幅按钮容器 */
        .edit-mode-banner-actions { 
            display: flex; 
            gap: 12px; 
        }
        
        /* 横幅按钮基础样式 */
        .edit-mode-banner-btn { 
            padding: 8px 16px; 
            border: none; 
            border-radius: 4px; 
            font-size: 14px; 
            cursor: pointer; 
        }
        
        /* 提交按钮：白色背景 */
        .edit-mode-banner-btn.submit { 
            background: var(--bg-primary); 
            color: #28a745; 
            font-weight: 600; 
        }
        
        /* 禁用状态 */
        .edit-mode-banner-btn.submit:disabled { 
            background: rgba(255,255,255,0.5); 
            cursor: not-allowed; 
        }
        
        /* 取消按钮：半透明背景 */
        .edit-mode-banner-btn.cancel { 
            background: rgba(255,255,255,0.2); 
            color: #fff; 
        }
        
        /* ============================================ */
        /* 编辑列表面板样式 */
        /* ============================================ */
        
        /* 面板容器：固定在右上角 */
        .edit-list-panel { 
            position: fixed; 
            top: 70px; 
            right: 20px; 
            width: 320px; 
            max-height: calc(100vh - 100px);  /* 最大高度限制 */
            background: var(--bg-primary); 
            border-radius: 8px; 
            box-shadow: 0 4px 16px rgba(0,0,0,0.15); 
            padding: 16px; 
            z-index: 999; 
            overflow-y: auto;  /* 内容超出时滚动 */
        }
        
        /* 面板标题 */
        .edit-list-title { 
            font-weight: 600; 
            margin-bottom: 12px; 
            color: var(--text-primary); 
            border-bottom: 1px solid var(--border-color); 
            padding-bottom: 8px; 
        }
        
        /* 列表内容区 */
        .edit-list-content { 
            font-size: 14px; 
        }
        
        /* 空状态提示 */
        .edit-list-empty { 
            color: var(--text-tertiary); 
            text-align: center; 
            padding: 20px; 
        }
        
        /* 列表项 */
        .edit-list-item { 
            padding: 8px 12px; 
            background: var(--bg-secondary); 
            border-radius: 4px; 
            margin-bottom: 8px; 
            display: flex; 
            align-items: center; 
            gap: 8px; 
        }
        
        /* 标签样式（歌名、歌手、逐行等） */
        .edit-list-tag { 
            font-size: 12px; 
            padding: 2px 8px; 
            border-radius: 4px; 
            color: #fff; 
            white-space: nowrap;  /* 不换行 */
        }
        
        /* 各类型标签颜色 */
        .edit-list-tag.meta { background: #1890ff; }    /* 蓝色：元信息 */
        .edit-list-tag.line { background: #52c41a; }    /* 绿色：逐行纠错 */
        .edit-list-tag.full { background: #fa8c16; }     /* 橙色：整首替换 */
        .edit-list-tag.insert { background: #722ed1; }   /* 紫色：插入行 */
        
        /* 删除按钮 */
        .edit-list-remove { 
            margin-left: auto;  /* 靠右对齐 */
            background: #ff4d4f; 
            color: #fff; 
            border: none; 
            border-radius: 4px; 
            padding: 2px 8px; 
            font-size: 12px; 
            cursor: pointer; 
        }
        
        /* ============================================ */
        /* 输入面板样式 */
        /* ============================================ */
        
        /* 输入面板容器 */
        .edit-input-panel { 
            position: fixed; 
            top: 70px; 
            right: 360px;  /* 在列表面板左侧 */
            width: 300px; 
            background: var(--bg-primary); 
            border-radius: 8px; 
            box-shadow: 0 4px 16px rgba(0,0,0,0.15); 
            padding: 16px; 
            z-index: 999; 
        }
        
        /* 输入面板标题 */
        .edit-input-title { 
            font-weight: 600; 
            margin-bottom: 12px; 
            color: var(--text-primary); 
        }
        
        /* 输入行（位置+行号） */
        .edit-input-row { 
            display: flex; 
            gap: 8px; 
            margin-bottom: 12px; 
        }
        
        /* 输入框样式 */
        .edit-input-row select, 
        .edit-input-row input { 
            flex: 1; 
            padding: 8px; 
            border: 1px solid #d9d9d9; 
            border-radius: 4px; 
        }
        
        /* 文本输入区 */
        .edit-input-textarea { 
            width: 100%; 
            min-height: 150px; 
            padding: 12px; 
            border: 1px solid #d9d9d9; 
            border-radius: 4px; 
            resize: vertical;  /* 允许垂直调整大小 */
            font-family: inherit;  /* 继承页面字体 */
            margin-bottom: 12px; 
        }
        
        /* 确认按钮 */
        .edit-input-confirm { 
            width: 100%; 
            padding: 10px; 
            background: #28a745; 
            color: #fff; 
            border: none; 
            border-radius: 4px; 
            cursor: pointer; 
            font-size: 14px; 
        }
        
        .edit-input-confirm:hover { 
            background: #218838;  /* 悬停时颜色加深 */
        }
    `;
    
    // 添加到页面head
    document.head.appendChild(styles);
}

// ============================================
// 模块导出
// 将功能挂载到全局对象，供其他脚本调用
// 提供toggle（切换）、isActive（检查状态）、handleLineClick（处理点击）
// ============================================
window.EditLyricsModule = {
    toggle: toggleEditLyricsMode,  // 切换编辑模式
    isActive: () => editLyricsMode,  // 检查是否在编辑模式
    handleLineClick: handleLineClick  // 处理歌词行点击
};
