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

let _hasUserInteraction = false;

function _markUserInteraction() {
    _hasUserInteraction = true;
}

function _initWechat() {
    if (!/MicroMessenger/i.test(navigator.userAgent)) return;
    console.log('[TTS] WeChat detected');
    const unlock = () => { _markUserInteraction(); };
    if (window.WeixinJSBridge && window.WeixinJSBridge.invoke) {
        WeixinJSBridge.invoke('getNetworkType', {}, unlock);
    } else {
        document.addEventListener('WeixinJSBridgeReady', unlock, { once: true });
    }
}

function _playAudio(url, retryCount = 0) {
    const MAX_RETRIES = 2;
    return new Promise((resolve, reject) => {
        if (window.TTSLoading && window.currentSong) {
            window.TTSLoading.show(window.currentSong.id);
        }
        const audio = new Audio();
        currentAudio = audio;
        let resolved = false;
        const done = () => { if (!resolved) { resolved = true; resolve(); } };
        const fail = (e) => { if (!resolved) { resolved = true; reject(e || new Error('Audio error')); } };
        audio.onended = done;
        audio.onerror = () => {
            console.warn('[TTS] Audio error (attempt ' + (retryCount + 1) + '/' + (MAX_RETRIES + 1) + ')');
            if (retryCount < MAX_RETRIES) {
                _playAudio(url, retryCount + 1).then(resolve).catch(reject);
            } else { fail(new Error('Audio load/play error after retries')); }
        };
        audio.addEventListener('timeupdate', function () {
            if (!resolved && audio.duration && audio.currentTime >= audio.duration - 0.06) { done(); }
        });
        audio.src = url;
        const tryPlay = () => {
            const playPromise = audio.play();
            if (playPromise !== undefined) {
                playPromise.catch((err) => {
                    if (err.name === 'NotAllowedError' && !_hasUserInteraction) { showToast('请点击页面任意位置后再播放'); }
                    fail(err);
                });
            }
        };
        audio.addEventListener('canplay', tryPlay, { once: true });
        setTimeout(() => { if (!resolved) tryPlay(); }, 500);
        setTimeout(() => {
            if (!resolved) {
                if (retryCount < MAX_RETRIES) { _playAudio(url, retryCount + 1).then(resolve).catch(reject); }
                else { fail(new Error('timeout after retries')); }
            }
        }, 15000);
    });
}

// ===== TTS 业务逻辑 =====

function loadTTSManifest() {
    return new Promise(function(resolve) {
        fetch('tts/manifest.v1.json')
            .then(function(resp) { if (resp.ok) return resp.json(); throw new Error('HTTP ' + resp.status); })
            .then(function(data) { ttsManifest = data.items; ttsBaseUrl = data.baseUrl; resolve(); })
            .catch(function(e) {
                console.warn('[TTS] Manifest load error:', e.message || e);
                setTimeout(function() {
                    fetch('tts/manifest.v1.json')
                        .then(function(resp) { return resp.json(); })
                        .then(function(data) { ttsManifest = data.items; ttsBaseUrl = data.baseUrl; })
                        .catch(function(e2) { console.warn('[TTS] Manifest retry error:', e2.message || e2); });
                }, 1000);
                resolve();
            });
    });
}

// 播放整行（点击同一按钮可停止）
async function playLineTTS(lineIndex, btn) {
    if (!ttsManifest || !window.currentSong) { showToast('语音数据未加载'); return; }
    const line = window.currentSong.lyrics[lineIndex];
    if (!line || !line.jp) { showToast('该行没有粤拼数据'); return; }
    if (currentPlayingBtn === btn) { stopCurrentTTS(); return; }
    stopCurrentTTS();
    const arr = line.jp.filter(Boolean);
    if (!arr.length) { showToast('该行没有粤拼数据'); return; }
    currentPlayingBtn = btn;
    btn.classList.add('playing');
    await _playSequence(arr, btn);
}

// 播放分段（点击同一按钮可停止）
async function playSegmentTTS(arr, btn) {
    if (!ttsManifest || !arr || !arr.length) return;
    if (currentPlayingBtn === btn) { stopCurrentTTS(); return; }
    stopCurrentTTS();
    currentPlayingBtn = btn;
    btn.classList.add('playing');
    await _playSequence(arr, btn);
}

async function _playSequence(arr, btn) {
    for (const jp of arr) {
        if (!currentPlayingBtn || currentPlayingBtn !== btn) break;
        const p = ttsManifest[jp];
        if (!p) continue;
        try { await _playAudio(ttsBaseUrl + '/' + p); }
        catch (e) { console.warn('[TTS] Play failed:', jp, e.message); }
    }
    if (currentPlayingBtn === btn) {
        btn.classList.remove('playing');
        currentAudio = null;
        currentPlayingBtn = null;
    }
}

async function playCharTTS(jp, charEl) {
    if (!ttsManifest || !jp) return;
    if (currentPlayingChar) currentPlayingChar.classList.remove('tts-char-playing');
    const p = ttsManifest[jp];
    if (!p) return;
    currentPlayingChar = charEl;
    charEl.classList.add('tts-char-playing');
    try { await _playAudio(ttsBaseUrl + '/' + p); }
    catch (e) { console.error('[TTS] Char play failed:', e); showToast('播放失败，请重试'); }
    _clearChar(charEl);
}

function _clearChar(el) {
    el.classList.remove('tts-char-playing');
    if (currentPlayingChar === el) currentPlayingChar = null;
}

function stopCurrentTTS() {
    if (currentAudio) { try { currentAudio.pause(); currentAudio.currentTime = 0; } catch(e){} currentAudio = null; }
    if (currentPlayingBtn) { currentPlayingBtn.classList.remove('playing'); currentPlayingBtn = null; }
    if (currentPlayingChar) { currentPlayingChar.classList.remove('tts-char-playing'); currentPlayingChar = null; }
}

function toggleTTSMode() {
    ttsMode = !ttsMode;
    const btn = document.getElementById('ttsModeBtn');
    const view = document.getElementById('lyricsView');
    if (ttsMode) {
        btn.classList.add('tts-active'); view.classList.add('tts-mode');
        _markUserInteraction(); _initWechat();
        showToast('已进入播放模式，点击单字播放语音');
    } else {
        btn.classList.remove('tts-active'); view.classList.remove('tts-mode');
        stopCurrentTTS(); showToast('已退出播放模式');
    }
}

if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', _initWechat); }
else { _initWechat(); }
document.addEventListener('touchstart', _markUserInteraction, { passive: true });
document.addEventListener('click', _markUserInteraction, { passive: true });

window.TTSModule = {
    init: loadTTSManifest, playLine: playLineTTS, playSegment: playSegmentTTS,
    playChar: playCharTTS, toggleMode: toggleTTSMode, stop: stopCurrentTTS,
    isModeActive: () => ttsMode
};
