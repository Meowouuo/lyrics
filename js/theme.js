// ============================================
// Theme Module - 主题切换模块
// 功能：支持日间模式、夜间模式、自动跟随系统三种主题切换
// 主题通过 CSS 变量实现全局样式变更
// ============================================
(function() {
    'use strict';

    // ============================================
    // 常量定义
    // ============================================

    // localStorage 存储键名
    const STORAGE_KEY = 'theme-mode';

    // ============================================
    // 主题配色定义
    // 每个主题包含一组 CSS 变量，用于全局样式变更
    // ============================================
    const themes = {
        // 日间模式：白色背景，深色文字
        light: {
            '--bg-primary': '#fff',      // 主背景色
            '--bg-secondary': '#f5f5f5', // 次背景色
            '--bg-tertiary': '#f0f0f0',  // 第三背景色
            '--text-primary': '#333',    // 主文字色
            '--text-secondary': '#666',  // 次文字色
            '--text-tertiary': '#999',  // 第三文字色
            '--border-color': '#eee',    // 边框色
            '--border-dark': '#e8e8e8',  // 深边框色
            '--accent': '#000',          // 强调色
            '--accent-hover': '#333',    // 强调色悬停
            '--danger': '#dc2626',       // 危险/错误色
            '--success': '#4CAF50',       // 成功色
            '--info': '#4a9eff'          // 信息色
        },
        // 夜间模式：深色背景，浅色文字
        dark: {
            '--bg-primary': '#1a1a1a',   // 主背景色
            '--bg-secondary': '#2a2a2a', // 次背景色
            '--bg-tertiary': '#333',     // 第三背景色
            '--text-primary': '#e0e0e0', // 主文字色
            '--text-secondary': '#aaa',  // 次文字色
            '--text-tertiary': '#777',  // 第三文字色
            '--border-color': '#444',    // 边框色
            '--border-dark': '#555',     // 深边框色
            '--accent': '#fff',          // 强调色
            '--accent-hover': '#ddd',    // 强调色悬停
            '--danger': '#ef5350',        // 危险/错误色
            '--success': '#66bb6a',       // 成功色
            '--info': '#64b5f6'          // 信息色
        }
    };

    // 当前主题模式：'light' | 'dark' | 'auto'
    let currentMode = 'auto';

    // ============================================
    // 获取系统主题偏好
    // 功能：检测用户系统的主题设置（暗黑模式）
    //
    // 返回值：'dark' 或 'light'
    // ============================================
    function getSystemPreference() {
        return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
            ? 'dark'
            : 'light';
    }

    // ============================================
    // 获取实际生效的主题
    // 功能：根据当前模式返回实际应用的主题名称
    //
    // 返回值：'light' 或 'dark'
    // ============================================
    function getEffectiveMode() {
        if (currentMode === 'auto') {
            // 自动模式：跟随系统
            return getSystemPreference();
        }
        return currentMode;
    }

    // ============================================
    // 应用主题
    // 功能：将指定主题的 CSS 变量应用到根元素
    //
    // 参数：
    //   - mode: 主题名称 'light' 或 'dark'
    // ============================================
    function applyTheme(mode) {
        // 获取主题配置
        const theme = themes[mode] || themes.light;
        const root = document.documentElement;

        // 遍历应用所有 CSS 变量
        Object.keys(theme).forEach(function(key) {
            root.style.setProperty(key, theme[key]);
        });
    }

    // ============================================
    // 保存主题模式
    // 功能：将当前模式保存到 localStorage
    //
    // 参数：
    //   - mode: 主题模式 'light' | 'dark' | 'auto'
    // ============================================
    function saveMode(mode) {
        try {
            localStorage.setItem(STORAGE_KEY, mode);
        } catch (e) {
            // localStorage 不可用（如隐私模式）
        }
    }

    // ============================================
    // 加载主题模式
    // 功能：从 localStorage 读取保存的主题模式
    //
    // 返回值：保存的模式，未保存则返回 'auto'
    // ============================================
    function loadMode() {
        try {
            const saved = localStorage.getItem(STORAGE_KEY);
            if (saved === 'light' || saved === 'dark' || saved === 'auto') {
                return saved;
            }
        } catch (e) {
            // localStorage 不可用
        }
        return 'auto';
    }

    // ============================================
    // 获取模式显示标签
    // 功能：将模式代码转换为用户友好的中文显示
    //
    // 参数：
    //   - mode: 模式代码
    //
    // 返回值：中文标签
    // ============================================
    function getModeLabel(mode) {
        switch (mode) {
            case 'light': return '日间';
            case 'dark': return '夜间';
            case 'auto': return '跟随系统';
            default: return '跟随系统';
        }
    }

    // ============================================
    // 更新主题按钮显示
    // 功能：更新按钮上的文字和图标
    // ============================================
    function updateThemeButton() {
        // 获取按钮元素
        const btn = document.getElementById('themeToggleBtn');
        if (!btn) return;

        // 获取当前模式的标签
        const label = getModeLabel(currentMode);

        // 更新按钮内容（月亮图标 + 文字）
        btn.innerHTML = '\uD83C\uDF19 夜间模式（' + label + '）';
    }

    // ============================================
    // 模块初始化
    // 功能：加载保存的模式，应用主题，设置系统主题变化监听
    // ============================================
    window.ThemeModule = {
        init: function() {
            // 加载保存的模式
            currentMode = loadMode();
            // 应用主题
            applyTheme(getEffectiveMode());
            // 更新按钮显示
            updateThemeButton();

            // 监听系统主题变化
            if (window.matchMedia) {
                window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', function() {
                    // 仅在自动模式下响应系统变化
                    if (currentMode === 'auto') {
                        applyTheme(getEffectiveMode());
                    }
                });
            }
        },

        // ============================================
        // 切换主题模式
        // 功能：循环切换三种模式
        // 顺序：日间 → 夜间 → 跟随系统 → 日间
        // ============================================
        toggle: function() {
            // 循环切换模式
            if (currentMode === 'light') {
                currentMode = 'dark';
            } else if (currentMode === 'dark') {
                currentMode = 'auto';
            } else {
                currentMode = 'light';
            }

            // 保存并应用
            saveMode(currentMode);
            applyTheme(getEffectiveMode());
            updateThemeButton();
        },

        // ============================================
        // 设置主题模式
        // 功能：直接设置指定的模式
        //
        // 参数：
        //   - mode: 模式 'light' | 'dark' | 'auto'
        // ============================================
        set: function(mode) {
            // 验证模式有效性
            if (mode !== 'light' && mode !== 'dark' && mode !== 'auto') return;

            currentMode = mode;
            saveMode(currentMode);
            applyTheme(getEffectiveMode());
            updateThemeButton();
        },

        // ============================================
        // 获取当前模式
        // 功能：返回当前设置的模式（非实际生效模式）
        //
        // 返回值：'light' | 'dark' | 'auto'
        // ============================================
        getMode: function() {
            return currentMode;
        }
    };
})();
