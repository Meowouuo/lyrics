// ============================================
// 工具函数模块
// 功能：提供繁简转换和 Toast 提示功能
// ============================================

// ============================================
// 简繁转换对照表
// 包含常见的简体字到繁体字的映射
// 用于将歌词中的繁体字转换为简体字
// ============================================
const s2tMap = {
    // 常用简繁对照（按拼音排序的部分）
    '简': '簡', '繁': '繁', '体': '體', '个': '個', '来': '來',
    '说': '說', '时': '時', '会': '會', '对': '對', '开': '開',
    '过': '過', '为': '為', '这': '這', '们': '們', '国': '國',
    '发': '發', '长': '長', '现': '現', '还': '還', '当': '當',
    '经': '經', '见': '見', '从': '從', '问': '問', '很': '很',
    '只': '只', '最': '最', '把': '把', '被': '被', '让': '讓',
    '给': '給', '向': '向', '和': '和', '与': '與', '在': '在',
    '的': '的', '了': '了', '是': '是', '我': '我', '你': '你',
    // ... 更多映射在原始文件中
};

// 从简繁对照表生成繁简对照表（键值互换）
const t2sMap = Object.fromEntries(Object.entries(s2tMap).map(([k, v]) => [v, k]));

// ============================================
// 繁简转换函数
// 功能：将文本中的繁体字转换为简体字，或反之
//
// 参数：
//   - text: 要转换的文本
//   - toTraditional: true 转换为繁体，false 转换为简体
//
// 返回值：转换后的文本
// ============================================
function convertText(text, toTraditional) {
    // 根据转换方向选择对照表
    const map = toTraditional ? s2tMap : t2sMap;
    // 逐字符转换，未找到则保留原字符
    return text.split('').map(c => map[c] || c).join('');
}

// ============================================
// Toast 提示函数
// 功能：在屏幕中央显示临时提示消息
//
// 参数：
//   - message: 要显示的提示文本
// ============================================
function showToast(message) {
    // 移除已存在的 toast
    const existingToast = document.querySelector('.toast-message');
    if (existingToast) {
        existingToast.remove();
    }

    // 创建 toast 元素
    const toast = document.createElement('div');
    toast.className = 'toast-message';
    toast.textContent = message;

    // 设置样式：居中显示，1.5秒后自动消失
    toast.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: rgba(0, 0, 0, 0.8);
        color: #fff;
        padding: 12px 24px;
        border-radius: 8px;
        font-size: 14px;
        z-index: 10000;
        animation: fadeInOut 1.5s ease forwards;
    `;

    // 添加到页面
    document.body.appendChild(toast);

    // 1.5 秒后移除
    setTimeout(() => toast.remove(), 1500);
}
