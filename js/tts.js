// TTS 语音播报模块
// 兼容：桌面浏览器、移动端 Safari/Chrome、微信内置浏览器
// 注意：使用 Audio 元素播放，避免 fetch 导致的 CORS 问题

// TTS 状态
let ttsManifest = null;
let ttsBaseUrl = '';
let currentAudio = null;
let currentPlayingBtn = null;
let ttsMode = false;
let currentPlayingChar = null;
let isLoading = false; // 加载状态

// 显示加载提示
function _showLoading() {
    isLoading = true;
    if (currentPlayingBtn) {
        currentPlayingBtn.classList.add('tts-loading');
    }
    if (currentPlayingChar) {
        currentPlayingChar.classList.add('tts-loading');
    }
}

// 隐藏加载提示
function _hideLoading() {
    isLoading = false;
    if (currentPlayingBtn) {
        currentPlayingBtn.classList.remove('tts-loading');
    }
    if (currentPlayingChar) {
        currentPlayingChar.classList.remove('tts-loading');
    }
}

// ===== 音频播放核心 =====
// 策略：只用 HTMLAudioElement，避免 fetch 导致的 CORS 问题

let _hasUserInteraction = false;

// 标记用户交互
function _markUserInteraction() {
    _hasUserInteraction = true;
}

// 微信环境检测与初始化
function _initWechat() {
    if (!/MicroMessenger/i.test(navigator.userAgent)) return;
    console.log('[TTS] WeChat detected');

    const unlock = () => {
        console.log('[TTS] WeChat unlock triggered');
        _markUserInteraction();
    };

    if (window.WeixinJSBridge && window.WeixinJSBridge.invoke) {
        WeixinJSBridge.invoke('getNetworkType', {}, unlock);
    } else {
        document.addEventListener('WeixinJSBridgeReady', unlock, { once: true });
    }
}

// 使用 HTMLAudioElement 播放（避免 CORS）
// 支持重试机制
function _playAudio(url, retryCount = 0) {
    const MAX_RETRIES = 2; // 最大重试次数
    
    return new Promise((resolve, reject) => {
        _showLoading();
        const audio = new Audio();
        currentAudio = audio;

        let resolved = false;
        const done = () => {
            if (!resolved) {
                resolved = true;
                _hideLoading();
                resolve();
            }
        };
        const fail = (e) => {
            if (!resolved) {
                resolved = true;
                _hideLoading();
                reject(e || new Error('Audio error'));
            }
        };

        audio.onended = done;
        audio.onerror = () => {
            console.warn('[TTS] Audio error (attempt ' + (retryCount + 1) + '/' + (MAX_RETRIES + 1) + ')');
            // 错误时尝试重试
            if (retryCount < MAX_RETRIES) {
                console.log('[TTS] Retrying... (' + (retryCount + 1) + '/' + MAX_RETRIES + ')');
                _playAudio(url, retryCount + 1)
                    .then(resolve)
                    .catch(reject);
            } else {
                fail(new Error('Audio load/play error after retries'));
            }
        };

        // 提前结束检测
        audio.addEventListener('timeupdate', function () {
            if (!resolved && audio.duration && audio.currentTime >= audio.duration - 0.06) {
                done();
            }
        });

        // 加载并播放
        audio.src = url;

        // 尝试播放
        const tryPlay = () => {
            const playPromise = audio.play();
            if (playPromise !== undefined) {
                playPromise.catch((err) => {
                    console.warn('[TTS] Play failed:', err.message);
                    // 如果是用户交互问题，不立即失败
                    if (err.name === 'NotAllowedError' && !_hasUserInteraction) {
                        showToast('请点击页面任意位置后再播放');
                    }
                    fail(err);
                });
            }
        };

        // 等待 canplay 事件后再播放（更可靠）
        audio.addEventListener('canplay', tryPlay, { once: true });

        // 超时回退
        setTimeout(() => {
            if (!resolved) tryPlay();
        }, 500);

        // 总超时（增加重试时间）
        setTimeout(() => {
            if (!resolved) {
                if (retryCount < MAX_RETRIES) {
                    console.log('[TTS] Timeout, retrying... (' + (retryCount + 1) + '/' + MAX_RETRIES + ')');
                    _playAudio(url, retryCount + 1)
                        .then(resolve)
                        .catch(reject);
                } else {
                    fail(new Error('timeout after retries'));
                }
            }
        }, 15000); // 15秒总超时（包含重试）
    });
}

// ===== TTS 业务逻辑 =====

// 加载 manifest（iOS Safari 兼容版本）
function loadTTSManifest() {
    return new Promise(function(resolve) {
        fetch('tts/manifest.v1.json')
            .then(function(resp) {
                if (resp.ok) {
                    return resp.json();
                }
                throw new Error('HTTP ' + resp.status);
            })
            .then(function(data) {
                ttsManifest = data.items;
                ttsBaseUrl = data.baseUrl;
                console.log('[TTS] Manifest loaded:', Object.keys(ttsManifest).length, 'items');
                resolve();
            })
            .catch(function(e) {
                console.warn('[TTS] Manifest load error:', e.message || e);
                // 重试一次
                setTimeout(function() {
                    fetch('tts/manifest.v1.json')
                        .then(function(resp) { return resp.json(); })
                        .then(function(data) {
                            ttsManifest = data.items;
                            ttsBaseUrl = data.baseUrl;
                            console.log('[TTS] Manifest loaded (retry):', Object.keys(ttsManifest).length, 'items');
                        })
                        .catch(function(e2) {
                            console.warn('[TTS] Manifest load error (retry):', e2.message || e2);
                        });
                }, 1000);
                resolve();
            });
    });
}

// 播放整行
async function playLineTTS(lineIndex, btn) {
    if (!ttsManifest || !window.currentSong) {
        showToast('语音数据未加载');
        return;
    }
    const line = window.currentSong.lyrics[lineIndex];
    if (!line || !line.jp) {
        showToast('该行没有粤拼数据');
        return;
    }

    stopCurrentTTS();
    const arr = line.jp.filter(Boolean);
    if (!arr.length) {
        showToast('该行没有粤拼数据');
        return;
    }

    currentPlayingBtn = btn;
    btn.classList.add('playing');
    await _playSequence(arr, btn);
}

// 播放分段
async function playSegmentTTS(arr, btn) {
    if (!ttsManifest || !arr || !arr.length) return;
    stopCurrentTTS();
    currentPlayingBtn = btn;
    btn.classList.add('playing');
    await _playSequence(arr, btn);
}

// 逐词播放
async function _playSequence(arr, btn) {
    for (const jp of arr) {
        if (!currentPlayingBtn || currentPlayingBtn !== btn) break;
        const p = ttsManifest[jp];
        if (!p) continue;
        try {
            await _playAudio(ttsBaseUrl + '/' + p);
        } catch (e) {
            console.warn('[TTS] Play failed:', jp, e.message);
            // 单个音频失败继续播放下一个
        }
    }
    if (currentPlayingBtn === btn) {
        btn.classList.remove('playing');
        btn.classList.remove('tts-loading');
        currentAudio = null;
        currentPlayingBtn = null;
    }
}

// 播放单字
async function playCharTTS(jp, charEl) {
    if (!ttsManifest || !jp) return;
    if (currentPlayingChar) currentPlayingChar.classList.remove('tts-char-playing');

    const p = ttsManifest[jp];
    if (!p) return;

    currentPlayingChar = charEl;
    charEl.classList.add('tts-char-playing');

    try {
        await _playAudio(ttsBaseUrl + '/' + p);
    } catch (e) {
        console.error('[TTS] Char play failed:', e);
        showToast('播放失败，请重试');
    }
    _clearChar(charEl);
}

function _clearChar(el) {
    el.classList.remove('tts-char-playing');
    el.classList.remove('tts-loading');
    if (currentPlayingChar === el) currentPlayingChar = null;
}

// 停止
function stopCurrentTTS() {
    if (currentAudio) {
        try { currentAudio.pause(); currentAudio.currentTime = 0; } catch(e){}
        currentAudio = null;
    }
    if (currentPlayingBtn) {
        currentPlayingBtn.classList.remove('playing');
        currentPlayingBtn.classList.remove('tts-loading');
        currentPlayingBtn = null;
    }
    if (currentPlayingChar) {
        currentPlayingChar.classList.remove('tts-char-playing');
        currentPlayingChar.classList.remove('tts-loading');
        currentPlayingChar = null;
    }
    isLoading = false;
}

// 切换模式
function toggleTTSMode() {
    ttsMode = !ttsMode;
    const btn = document.getElementById('ttsModeBtn');
    const view = document.getElementById('lyricsView');
    if (ttsMode) {
        btn.classList.add('tts-active');
        view.classList.add('tts-mode');
        _markUserInteraction();
        _initWechat();
        showToast('已进入播放模式，点击单字播放语音');
    } else {
        btn.classList.remove('tts-active');
        view.classList.remove('tts-mode');
        stopCurrentTTS();
        showToast('已退出播放模式');
    }
}

// 页面加载时初始化
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', _initWechat);
} else {
    _initWechat();
}

// 全局点击/触摸解锁
document.addEventListener('touchstart', _markUserInteraction, { passive: true });
document.addEventListener('click', _markUserInteraction, { passive: true });

// 导出
window.TTSModule = {
    init: loadTTSManifest,
    playLine: playLineTTS,
    playSegment: playSegmentTTS,
    playChar: playCharTTS,
    toggleMode: toggleTTSMode,
    stop: stopCurrentTTS,
    isModeActive: () => ttsMode
};
