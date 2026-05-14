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
function _playAudio(url) {
    return new Promise((resolve, reject) => {
        const audio = new Audio();
        currentAudio = audio;

        let resolved = false;
        const done = () => {
            if (!resolved) {
                resolved = true;
                resolve();
            }
        };
        const fail = (e) => {
            if (!resolved) {
                resolved = true;
                reject(e || new Error('Audio error'));
            }
        };

        audio.onended = done;
        audio.onerror = () => fail(new Error('Audio load/play error'));

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

        // 总超时
        setTimeout(() => fail(new Error('timeout')), 10000);
    });
}

// ===== TTS 业务逻辑 =====

// 加载 manifest（使用 XMLHttpRequest，iOS Safari 更兼容）
function loadTTSManifest() {
    return new Promise(function(resolve) {
        var xhr = new XMLHttpRequest();
        xhr.open('GET', 'tts/manifest.v1.json', true);
        xhr.timeout = 10000;  // 10秒超时
        
        xhr.onload = function() {
            if (xhr.status === 200) {
                try {
                    var data = JSON.parse(xhr.responseText);
                    ttsManifest = data.items;
                    ttsBaseUrl = data.baseUrl;
                    console.log('[TTS] Manifest loaded:', Object.keys(ttsManifest).length, 'items');
                } catch (e) {
                    console.warn('[TTS] Manifest parse error:', e.message);
                }
            } else {
                console.warn('[TTS] Manifest load error: HTTP', xhr.status);
                // 重试一次
                setTimeout(retryLoad, 1000);
            }
            resolve();
        };
        
        xhr.onerror = function() {
            console.warn('[TTS] Manifest load error: network error');
            // 重试一次
            setTimeout(retryLoad, 1000);
            resolve();
        };
        
        xhr.ontimeout = function() {
            console.warn('[TTS] Manifest load error: timeout');
            // 重试一次
            setTimeout(retryLoad, 1000);
            resolve();
        };
        
        xhr.send();
        
        // 重试函数
        function retryLoad() {
            var retryXhr = new XMLHttpRequest();
            retryXhr.open('GET', 'tts/manifest.v1.json', true);
            retryXhr.timeout = 10000;
            retryXhr.onload = function() {
                if (retryXhr.status === 200) {
                    try {
                        var data = JSON.parse(retryXhr.responseText);
                        ttsManifest = data.items;
                        ttsBaseUrl = data.baseUrl;
                        console.log('[TTS] Manifest loaded (retry):', Object.keys(ttsManifest).length, 'items');
                    } catch (e) {
                        console.warn('[TTS] Manifest parse error (retry):', e.message);
                    }
                } else {
                    console.warn('[TTS] Manifest load error (retry): HTTP', retryXhr.status);
                }
            };
            retryXhr.onerror = function() {
                console.warn('[TTS] Manifest load error (retry): network error');
            };
            retryXhr.ontimeout = function() {
                console.warn('[TTS] Manifest load error (retry): timeout');
            };
            retryXhr.send();
        }
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
            await _playAudio(`${ttsBaseUrl}/${p}`);
        } catch (e) {
            console.warn('[TTS] Play failed:', jp, e.message);
        }
    }
    if (currentPlayingBtn === btn) {
        btn.classList.remove('playing');
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
        await _playAudio(`${ttsBaseUrl}/${p}`);
    } catch (e) {
        console.error('[TTS] Char play failed:', e);
    }
    _clearChar(charEl);
}

function _clearChar(el) {
    el.classList.remove('tts-char-playing');
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
        currentPlayingBtn = null;
    }
    if (currentPlayingChar) {
        currentPlayingChar.classList.remove('tts-char-playing');
        currentPlayingChar = null;
    }
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
