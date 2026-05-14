/**
 * TTS 加载提示模块
 * 独立文件，方便后期维护
 * 功能：首次加载音频时显示提示，避免用户困惑
 */

(function() {
    'use strict';

    // 记录每首歌曲的首次加载状态
    const loadingState = {
        // key: songId, value: boolean (是否已显示过加载提示)
        shown: new Map(),
        // 当前显示的 toast 定时器
        timer: null
    };

    /**
     * 显示加载提示
     * @param {string} songId - 当前歌曲ID
     * @returns {boolean} - 是否显示了提示
     */
    function showLoadingToast(songId) {
        // 如果已经显示过，不再显示
        if (loadingState.shown.get(songId)) {
            return false;
        }

        // 清除之前的定时器
        if (loadingState.timer) {
            clearTimeout(loadingState.timer);
        }

        // 显示提示
        if (typeof showToast === 'function') {
            showToast('音频加载中，请稍候...');
        }

        // 标记已显示
        loadingState.shown.set(songId, true);

        // 3秒后自动隐藏（如果页面有自动隐藏逻辑，这里可以省略）
        loadingState.timer = setTimeout(() => {
            // toast 会自动消失，这里不需要额外处理
        }, 3000);

        return true;
    }

    /**
     * 隐藏加载提示（如果需要手动控制）
     */
    function hideLoadingToast() {
        if (loadingState.timer) {
            clearTimeout(loadingState.timer);
            loadingState.timer = null;
        }
    }

    /**
     * 重置歌曲的加载状态（切换歌曲时调用）
     * @param {string} songId - 歌曲ID
     */
    function resetLoadingState(songId) {
        if (songId) {
            loadingState.shown.delete(songId);
        } else {
            // 重置所有
            loadingState.shown.clear();
        }
    }

    /**
     * 检查是否已显示过加载提示
     * @param {string} songId - 歌曲ID
     * @returns {boolean}
     */
    function hasShownLoading(songId) {
        return loadingState.shown.get(songId) || false;
    }

    // 导出到全局
    window.TTSLoading = {
        show: showLoadingToast,
        hide: hideLoadingToast,
        reset: resetLoadingState,
        hasShown: hasShownLoading
    };

})();
