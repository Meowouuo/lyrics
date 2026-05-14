// Theme Module - 主题切换模块
(function() {
    'use strict';

    const STORAGE_KEY = 'theme-mode';

    const themes = {
        light: {
            '--bg-primary': '#fff',
            '--bg-secondary': '#f5f5f5',
            '--bg-tertiary': '#f0f0f0',
            '--text-primary': '#333',
            '--text-secondary': '#666',
            '--text-tertiary': '#999',
            '--border-color': '#eee',
            '--border-dark': '#e8e8e8',
            '--accent': '#000',
            '--accent-hover': '#333',
            '--danger': '#dc2626',
            '--success': '#4CAF50',
            '--info': '#4a9eff'
        },
        dark: {
            '--bg-primary': '#1a1a1a',
            '--bg-secondary': '#2a2a2a',
            '--bg-tertiary': '#333',
            '--text-primary': '#e0e0e0',
            '--text-secondary': '#aaa',
            '--text-tertiary': '#777',
            '--border-color': '#444',
            '--border-dark': '#555',
            '--accent': '#fff',
            '--accent-hover': '#ddd',
            '--danger': '#ef5350',
            '--success': '#66bb6a',
            '--info': '#64b5f6'
        }
    };

    let currentMode = 'auto'; // 'light' | 'dark' | 'auto'

    function getSystemPreference() {
        return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
            ? 'dark'
            : 'light';
    }

    function getEffectiveMode() {
        if (currentMode === 'auto') {
            return getSystemPreference();
        }
        return currentMode;
    }

    function applyTheme(mode) {
        const theme = themes[mode] || themes.light;
        const root = document.documentElement;
        Object.keys(theme).forEach(function(key) {
            root.style.setProperty(key, theme[key]);
        });
    }

    function saveMode(mode) {
        try {
            localStorage.setItem(STORAGE_KEY, mode);
        } catch (e) {
            // localStorage not available
        }
    }

    function loadMode() {
        try {
            const saved = localStorage.getItem(STORAGE_KEY);
            if (saved === 'light' || saved === 'dark' || saved === 'auto') {
                return saved;
            }
        } catch (e) {
            // localStorage not available
        }
        return 'auto';
    }

    function getModeLabel(mode) {
        switch (mode) {
            case 'light': return '日间';
            case 'dark': return '夜间';
            case 'auto': return '跟随系统';
            default: return '跟随系统';
        }
    }

    function updateThemeButton() {
        const btn = document.getElementById('themeToggleBtn');
        if (!btn) return;
        const label = getModeLabel(currentMode);
        btn.innerHTML = '\uD83C\uDF19 夜间模式（' + label + '）';
    }

    window.ThemeModule = {
        init: function() {
            currentMode = loadMode();
            applyTheme(getEffectiveMode());
            updateThemeButton();

            // Listen for system theme changes
            if (window.matchMedia) {
                window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', function() {
                    if (currentMode === 'auto') {
                        applyTheme(getEffectiveMode());
                    }
                });
            }
        },

        toggle: function() {
            // Cycle: light -> dark -> auto
            if (currentMode === 'light') {
                currentMode = 'dark';
            } else if (currentMode === 'dark') {
                currentMode = 'auto';
            } else {
                currentMode = 'light';
            }
            saveMode(currentMode);
            applyTheme(getEffectiveMode());
            updateThemeButton();
        },

        set: function(mode) {
            if (mode !== 'light' && mode !== 'dark' && mode !== 'auto') return;
            currentMode = mode;
            saveMode(currentMode);
            applyTheme(getEffectiveMode());
            updateThemeButton();
        },

        getMode: function() {
            return currentMode;
        }
    };
})();
