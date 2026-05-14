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
// 3. iOS Safari 需要特殊处理
// 策略：优先 AudioContext，失败时回退 HTMLAudioElement

let _audioCtx = null;

function _getAudioContext() {
    if (!_audioCtx) {
        const Ctor = window.AudioContext || window.webkitAudioContext;
        if (Ctor) {
            _audioCtx = new Ctor();
            console.log('[TTS] AudioContext created, state:', _audioCtx.state);
        }
    }
    return _audioCtx;
}

// 解锁音频上下文 - 必须在用户交互中调用
async function _unlockAudio() {
    try {
        const ctx = _getAudioContext();
        if (!ctx) return false;
        
        if (ctx.state === 'suspended') {
            await ctx.resume();
            console.log('[TTS] AudioContext resumed, state:', ctx.state);
        }
        return ctx.state === 'running';
    } catch (e) {
        console.warn('[TTS] unlockAudio failed:', e);
        return false;
    }
}

// 微信环境检测与初始化
function _initWechat() {
    if (!/MicroMessenger/i.test(navigator.userAgent)) return;
    console.log('[TTS] WeChat detected');
    
    const unlock = async () => {
        console.log('[TTS] WeChat unlock triggered');
        await _unlockAudio();
    };
    
    if (window.WeixinJSBridge && window.WeixinJSBridge.invoke) {
        WeixinJSBridge.invoke('getNetworkType', {}, unlock);
    } else {
        document.addEventListener('WeixinJSBridgeReady', unlock, { once: true });
    }
}

// 方式1: AudioContext 播放
async function _playWithAudioContext(url) {
    const ctx = _getAudioContext();
    if (!ctx) throw new Error('No AudioContext');
    
    // 确保音频上下文是 running 状态
    if (ctx.state !== 'running') {
        await ctx.resume();
        if (ctx.state !== 'running') {
            throw new Error('AudioContext not running: ' + ctx.state);
        }
    }

    const resp = await fetch(url);
    if (!resp.ok) throw new Error('HTTP ' + resp.status);
    const buf = await resp.arrayBuffer();
    const audioBuf = await ctx.decodeAudioData(buf);

    return new Promise((resolve, reject) => {
        const src = ctx.createBufferSource();
        src.buffer = audioBuf;
        src.connect(ctx.destination);
        
        let resolved = false;
        const done = () => {
            if (!resolved) {
                resolved = true;
                resolve();
            }
        };
        
        src.onended = done;
        src.start(0);
        
        // 安全超时
        const timeout = Math.max((audioBuf.duration + 0.5) * 1000, 1000);
        setTimeout(done, timeout);
    });
}

// 方式2: HTMLAudioElement 播放（回退方案）
function _playWithAudioElement(url) {
    return new Promise((resolve, reject) => {
        const audio = new Audio();
        audio.preload = 'auto';
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
        
        // iOS Safari 需要设置这些属性
        audio.muted = false;
        audio.playsInline = true;
        
        // 提前结束检测
        audio.addEventListener('timeupdate', function () {
            if (!resolved && audio.duration && audio.currentTime >= audio.duration - 0.05) {
                done();
            }
        });

        audio.src = url;
        
        // 播放
        const playPromise = audio.play();
        if (playPromise !== undefined) {
            playPromise.catch(fail);
        }
        
        // 超时
        setTimeout(() => fail(new Error('timeout')), 10000);
    });
}

// 统一播放入口
async function _playAudio(url) {
    console.log('[TTS] Playing:', url);
    
    // 每次播放前都尝试解锁音频上下文
    const unlocked = await _unlockAudio();
    console.log('[TTS] Audio unlocked:', unlocked);
    
    // 尝试 AudioContext
    try {
        await _playWithAudioContext(url);
        console.log('[TTS] AudioContext playback success');
        return;
    } catch (e) {
        console.warn('[TTS] AudioContext failed:', e.message);
    }
    
    // 回退到 AudioElement
    try {
        await _playWithAudioElement(url);
        console.log('[TTS] AudioElement playback success');
    } catch (e) {
        console.error('[TTS] AudioElement failed:', e.message);
        throw e;
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
            console.log('[TTS] Manifest loaded:', Object.keys(ttsManifest).length, 'items');
        }
    } catch (e) {
        console.warn('[TTS] Manifest load error:', e);
    }
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
        try { currentAudio.pause(); } catch(e){} 
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
async function toggleTTSMode() {
    ttsMode = !ttsMode;
    const btn = document.getElementById('ttsModeBtn');
    const view = document.getElementById('lyricsView');
    if (ttsMode) {
        btn.classList.add('tts-active');
        view.classList.add('tts-mode');
        // 进入模式时立即解锁音频
        await _unlockAudio();
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

// 全局点击/触摸解锁（多次，确保有效）
['touchstart', 'click', 'touchend'].forEach(evt => {
    document.addEventListener(evt, () => _unlockAudio(), { passive: true });
});

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
