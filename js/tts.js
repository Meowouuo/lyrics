// TTS 语音播报模块
// 兼容：桌面浏览器、移动端 Safari/Chrome、微信内置浏览器

// TTS 状态
let ttsManifest = null;
let ttsBaseUrl = '';
let currentAudio = null;
let currentPlayingBtn = null;
let ttsMode = false;
let currentPlayingChar = null;

// ===== 音频播放核心 =====
// 移动端（含微信）的关键问题：
// 1. AudioContext 必须在用户交互中创建/恢复
// 2. 微信 WeixinJSBridgeReady 事件后才允许播放
// 3. 跨域音频需要 fetch + decodeAudioData（部分环境）
// 策略：优先 AudioContext，失败时回退 HTMLAudioElement

let _audioCtx = null;
let _audioCtxReady = false;

function _getAudioContext() {
    if (!_audioCtx) {
        const Ctor = window.AudioContext || window.webkitAudioContext;
        if (Ctor) _audioCtx = new Ctor();
    }
    return _audioCtx;
}

// 在用户交互中调用一次，解锁音频
function _unlockAudio() {
    if (_audioCtxReady) return;
    try {
        const ctx = _getAudioContext();
        if (ctx && ctx.state === 'suspended') ctx.resume();
        _audioCtxReady = true;
    } catch (e) { /* ignore */ }
}

// 微信环境检测与初始化
function _initWechat() {
    if (!/MicroMessenger/i.test(navigator.userAgent)) return;
    const unlock = () => _unlockAudio();
    if (window.WeixinJSBridge) {
        WeixinJSBridge.invoke('getNetworkType', {}, unlock);
    } else {
        document.addEventListener('WeixinJSBridgeReady', unlock, { once: true });
    }
}

// 方式1: AudioContext 播放（移动端最稳定）
async function _playWithAudioContext(url) {
    const ctx = _getAudioContext();
    if (!ctx) throw new Error('No AudioContext');

    const resp = await fetch(url);
    if (!resp.ok) throw new Error('HTTP ' + resp.status);
    const buf = await resp.arrayBuffer();
    const audioBuf = await ctx.decodeAudioData(buf);

    return new Promise((resolve, reject) => {
        if (ctx.state === 'suspended') {
            ctx.resume().then(() => _startSource(ctx, audioBuf, resolve, reject))
                .catch(reject);
        } else {
            _startSource(ctx, audioBuf, resolve, reject);
        }
    });
}

function _startSource(ctx, audioBuf, resolve, reject) {
    const src = ctx.createBufferSource();
    src.buffer = audioBuf;
    src.connect(ctx.destination);
    src.onended = resolve;
    src.onerror = reject;
    src.start(0);
    // 安全超时
    setTimeout(resolve, Math.max((audioBuf.duration - 0.05) * 1000, 500));
}

// 方式2: HTMLAudioElement 播放（回退方案）
function _playWithAudioElement(url) {
    return new Promise((resolve, reject) => {
        const audio = new Audio();
        audio.preload = 'auto';
        currentAudio = audio;
        let done = false;
        const finish = () => { if (!done) { done = true; resolve(); } };
        const fail = (e) => { if (!done) { done = true; reject(e); } };

        audio.onended = finish;
        audio.onerror = fail;
        audio.addEventListener('timeupdate', function () {
            if (!done && audio.duration && audio.currentTime >= audio.duration - 0.06) finish();
        });

        audio.play().catch(fail);
        // 超时
        setTimeout(() => fail(new Error('timeout')), 8000);
    });
}

// 统一播放入口：先 AudioContext，失败回退 AudioElement
async function _playAudio(url) {
    _unlockAudio();
    try {
        await _playWithAudioContext(url);
    } catch (e) {
        console.warn('AudioContext 播放失败，回退 AudioElement:', e.message);
        await _playWithAudioElement(url);
    }
}

// ===== TTS 业务逻辑 =====

// 加载 manifest
async function loadTTSManifest() {
    try {
        const resp = await fetch('tts/manifest.v1.json');
        if (resp.ok) {
            const data = await resp.json();
            ttsManifest = data.items;
            ttsBaseUrl = data.baseUrl;
            console.log('TTS manifest 加载成功，共', Object.keys(ttsManifest).length, '个语音项');
        }
    } catch (e) {
        console.warn('TTS manifest 加载出错:', e);
    }
}

// 播放整行
async function playLineTTS(lineIndex, btn) {
    if (!ttsManifest || !window.currentSong) { showToast('语音数据未加载'); return; }
    const line = window.currentSong.lyrics[lineIndex];
    if (!line || !line.jp) { showToast('该行没有粤拼数据'); return; }

    stopCurrentTTS();
    const arr = line.jp.filter(Boolean);
    if (!arr.length) { showToast('该行没有粤拼数据'); return; }

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
            console.warn('播放失败:', jp, e.message);
        }
    }
    if (currentPlayingBtn === btn) {
        btn.classList.remove('playing');
        currentAudio = null;
        currentPlayingBtn = null;
    }
}

// 播放单字
function playCharTTS(jp, charEl) {
    if (!ttsManifest || !jp) return;
    if (currentPlayingChar) currentPlayingChar.classList.remove('tts-char-playing');

    const p = ttsManifest[jp];
    if (!p) return;

    currentPlayingChar = charEl;
    charEl.classList.add('tts-char-playing');

    _playAudio(`${ttsBaseUrl}/${p}`)
        .then(() => _clearChar(charEl))
        .catch(() => _clearChar(charEl));
}

function _clearChar(el) {
    el.classList.remove('tts-char-playing');
    if (currentPlayingChar === el) currentPlayingChar = null;
}

// 停止
function stopCurrentTTS() {
    if (currentAudio) { try { currentAudio.pause(); } catch(e){} currentAudio = null; }
    if (currentPlayingBtn) { currentPlayingBtn.classList.remove('playing'); currentPlayingBtn = null; }
    if (currentPlayingChar) { currentPlayingChar.classList.remove('tts-char-playing'); currentPlayingChar = null; }
}

// 切换模式
function toggleTTSMode() {
    ttsMode = !ttsMode;
    const btn = document.getElementById('ttsModeBtn');
    const view = document.getElementById('lyricsView');
    if (ttsMode) {
        btn.classList.add('tts-active');
        view.classList.add('tts-mode');
        _unlockAudio();
        _initWechat();
        showToast('已进入播放模式，点击单字播放语音');
    } else {
        btn.classList.remove('tts-active');
        view.classList.remove('tts-mode');
        stopCurrentTTS();
        showToast('已退出播放模式');
    }
}

// 页面加载时初始化微信环境
document.addEventListener('DOMContentLoaded', _initWechat);
// 首次触摸/点击也解锁
document.addEventListener('touchstart', _unlockAudio, { once: true });
document.addEventListener('click', _unlockAudio, { once: true });

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
