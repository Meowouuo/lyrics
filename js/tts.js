// ============================================
// TTS 语音播报模块
// 功能：提供粤拼语音朗读功能，支持整行、分段、单字播放
// 兼容：桌面浏览器、移动端 Safari/Chrome、微信内置浏览器
// 注意：使用 Audio 元素播放，避免 fetch 导致的 CORS 问题
// ============================================

// ============================================
// 全局状态变量
// ============================================

// TTS 清单数据（从 manifest.v1.json 加载）
let ttsManifest = null;

// TTS 音频文件的基础 URL
let ttsBaseUrl = '';

// 当前正在播放的 Audio 对象
let currentAudio = null;

// 当前播放按钮元素（用于高亮显示）
let currentPlayingBtn = null;

// TTS 播放模式开关
let ttsMode = false;

// 当前正在播放的字符元素（用于单字播放高亮）
let currentPlayingChar = null;

// 是否已有用户交互（用于处理浏览器自动播放策略）
let _hasUserInteraction = false;

// ============================================
// 用户交互标记
// 功能：标记用户已有交互行为，以满足浏览器自动播放策略
// 必须在用户点击后调用，否则音频无法播放
// ============================================
function _markUserInteraction() {
    _hasUserInteraction = true;
}

// ============================================
// 微信环境初始化
// 功能：针对微信内置浏览器的特殊处理
// 微信环境需要特殊触发才能播放音频
// ============================================
function _initWechat() {
    // 检测是否在微信环境中
    if (!/MicroMessenger/i.test(navigator.userAgent)) return;
    console.log('[TTS] WeChat detected');

    // 创建解锁函数
    const unlock = () => { _markUserInteraction(); };

    // 尝试获取网络类型（这是微信的特殊 API）
    if (window.WeixinJSBridge && window.WeixinJSBridge.invoke) {
        WeixinJSBridge.invoke('getNetworkType', {}, unlock);
    } else {
        // 如果 Bridge 还未加载，等待加载完成
        document.addEventListener('WeixinJSBridgeReady', unlock, { once: true });
    }
}

// ============================================
// 播放音频核心函数
// 功能：创建 Audio 对象并播放指定 URL，支持重试机制
//
// 参数：
//   - url: 音频文件 URL
//   - retryCount: 当前重试次数（内部使用）
//
// 返回值：Promise，播放成功或失败时 resolve
// ============================================
function _playAudio(url, retryCount = 0) {
    const MAX_RETRIES = 2;  // 最多重试 2 次

    return new Promise((resolve, reject) => {
        // 显示加载提示
        if (window.TTSLoading && window.currentSong) {
            window.TTSLoading.show(window.currentSong.id);
        }

        // 创建 Audio 对象
        const audio = new Audio();
        currentAudio = audio;

        // 标记是否已完成（避免重复调用 resolve/reject）
        let resolved = false;
        const done = () => { if (!resolved) { resolved = true; resolve(); } };
        const fail = (e) => { if (!resolved) { resolved = true; reject(e || new Error('Audio error')); } };

        // 监听播放结束事件
        audio.onended = done;

        // 监听播放错误事件
        audio.onerror = () => {
            console.warn('[TTS] Audio error (attempt ' + (retryCount + 1) + '/' + (MAX_RETRIES + 1) + ')');
            if (retryCount < MAX_RETRIES) {
                // 未达到最大重试次数，递归重试
                _playAudio(url, retryCount + 1).then(resolve).catch(reject);
            } else {
                fail(new Error('Audio load/play error after retries'));
            }
        };

        // 监听时间更新，用于检测播放是否正常结束
        audio.addEventListener('timeupdate', function () {
            // 如果音频时长已知，且播放到接近结尾（剩余不到 0.06 秒），视为播放完成
            if (!resolved && audio.duration && audio.currentTime >= audio.duration - 0.06) {
                done();
            }
        });

        // 设置音频源
        audio.src = url;

        // 尝试播放函数
        const tryPlay = () => {
            const playPromise = audio.play();
            if (playPromise !== undefined) {
                playPromise.catch((err) => {
                    // 如果是权限错误（用户未交互），提示用户
                    if (err.name === 'NotAllowedError' && !_hasUserInteraction) {
                        showToast('请点击页面任意位置后再播放');
                    }
                    fail(err);
                });
            }
        };

        // 等待可以播放时尝试播放
        audio.addEventListener('canplay', tryPlay, { once: true });

        // 延迟 500ms 后尝试播放（确保加载完成）
        setTimeout(() => { if (!resolved) tryPlay(); }, 500);

        // 设置总超时时间
        setTimeout(() => {
            if (!resolved) {
                if (retryCount < MAX_RETRIES) {
                    // 未超时，重试
                    _playAudio(url, retryCount + 1).then(resolve).catch(reject);
                } else {
                    fail(new Error('timeout after retries'));
                }
            }
        }, 15000);  // 15 秒超时
    });
}

// ============================================
// 加载 TTS 清单
// 功能：从 manifest.v1.json 加载音频文件映射表
// manifest 包含粤拼到音频文件的映射关系
// ============================================
function loadTTSManifest() {
    return new Promise(function(resolve) {
        // 尝试加载 manifest
        fetch('tts/manifest.v1.json')
            .then(function(resp) {
                if (resp.ok) return resp.json();
                throw new Error('HTTP ' + resp.status);
            })
            .then(function(data) {
                // 保存清单数据和基础 URL
                ttsManifest = data.items;
                ttsBaseUrl = data.baseUrl;
                resolve();
            })
            .catch(function(e) {
                console.warn('[TTS] Manifest load error:', e.message || e);
                // 1 秒后重试一次
                setTimeout(function() {
                    fetch('tts/manifest.v1.json')
                        .then(function(resp) { return resp.json(); })
                        .then(function(data) {
                            ttsManifest = data.items;
                            ttsBaseUrl = data.baseUrl;
                        })
                        .catch(function(e2) {
                            console.warn('[TTS] Manifest retry error:', e2.message || e2);
                        });
                }, 1000);
                resolve();  // 即使失败也继续（manifest 可能不影响基本功能）
            });
    });
}

// ============================================
// 播放整行语音
// 功能：播放指定行的所有粤拼发音
// 点击同一按钮可停止播放
//
// 参数：
//   - lineIndex: 行索引（歌词数组中的索引）
//   - btn: 播放按钮元素
// ============================================
async function playLineTTS(lineIndex, btn) {
    // 检查 manifest 是否加载
    if (!ttsManifest || !window.currentSong) {
        showToast('语音数据未加载');
        return;
    }

    // 获取该行歌词数据
    const line = window.currentSong.lyrics[lineIndex];
    if (!line || !line.jp) {
        showToast('该行没有粤拼数据');
        return;
    }

    // 点击同一按钮则停止播放
    if (currentPlayingBtn === btn) {
        stopCurrentTTS();
        return;
    }

    // 停止之前的播放
    stopCurrentTTS();

    // 过滤掉空的粤拼
    const arr = line.jp.filter(Boolean);
    if (!arr.length) {
        showToast('该行没有粤拼数据');
        return;
    }

    // 记录当前播放按钮
    currentPlayingBtn = btn;
    btn.classList.add('playing');  // 添加播放中样式

    // 按顺序播放所有粤拼
    await _playSequence(arr, btn);
}

// ============================================
// 播放分段语音
// 功能：播放指定粤拼数组的发音
// 用于播放一行中的部分内容
//
// 参数：
//   - arr: 粤拼数组
//   - btn: 播放按钮元素
// ============================================
async function playSegmentTTS(arr, btn) {
    // 检查参数有效性
    if (!ttsManifest || !arr || !arr.length) return;

    // 点击同一按钮则停止播放
    if (currentPlayingBtn === btn) {
        stopCurrentTTS();
        return;
    }

    // 停止之前的播放
    stopCurrentTTS();

    // 记录当前播放按钮
    currentPlayingBtn = btn;
    btn.classList.add('playing');

    // 按顺序播放
    await _playSequence(arr, btn);
}

// ============================================
// 按顺序播放粤拼数组
// 功能：循环播放数组中的每个粤拼
// 支持中途停止（通过检查 currentPlayingBtn）
//
// 参数：
//   - arr: 粤拼数组
//   - btn: 播放按钮元素（用于判断是否被停止）
// ============================================
async function _playSequence(arr, btn) {
    // 遍历每个粤拼
    for (const jp of arr) {
        // 检查是否被用户停止
        if (!currentPlayingBtn || currentPlayingBtn !== btn) break;

        // 获取对应的音频文件路径
        const p = ttsManifest[jp];
        if (!p) continue;  // 没有对应音频，跳过

        try {
            // 播放音频
            await _playAudio(ttsBaseUrl + '/' + p);
        } catch (e) {
            console.warn('[TTS] Play failed:', jp, e.message);
        }
    }

    // 播放完成，清除状态
    if (currentPlayingBtn === btn) {
        btn.classList.remove('playing');
        currentAudio = null;
        currentPlayingBtn = null;
    }
}

// ============================================
// 播放单字语音
// 功能：播放单个粤拼的发音
// 用于单字学习模式
//
// 参数：
//   - jp: 粤拼
//   - charEl: 字符元素（用于高亮显示）
// ============================================
async function playCharTTS(jp, charEl) {
    // 检查参数有效性
    if (!ttsManifest || !jp) return;

    // 清除上一个高亮的字符
    if (currentPlayingChar) {
        currentPlayingChar.classList.remove('tts-char-playing');
    }

    // 获取音频文件路径
    const p = ttsManifest[jp];
    if (!p) return;

    // 记录当前播放的字符
    currentPlayingChar = charEl;
    charEl.classList.add('tts-char-playing');  // 添加高亮样式

    try {
        // 播放音频
        await _playAudio(ttsBaseUrl + '/' + p);
    } catch (e) {
        console.error('[TTS] Char play failed:', e);
        showToast('播放失败，请重试');
    }

    // 播放完成，清除高亮
    _clearChar(charEl);
}

// ============================================
// 清除字符高亮
// 功能：移除字符的高亮样式
//
// 参数：
//   - el: 字符元素
// ============================================
function _clearChar(el) {
    el.classList.remove('tts-char-playing');
    if (currentPlayingChar === el) {
        currentPlayingChar = null;
    }
}

// ============================================
// 停止当前播放
// 功能：停止所有正在播放的音频，清除播放状态
// ============================================
function stopCurrentTTS() {
    // 停止音频播放
    if (currentAudio) {
        try { currentAudio.pause(); currentAudio.currentTime = 0; } catch(e){}
        currentAudio = null;
    }

    // 清除播放按钮高亮
    if (currentPlayingBtn) {
        currentPlayingBtn.classList.remove('playing');
        currentPlayingBtn = null;
    }

    // 清除字符高亮
    if (currentPlayingChar) {
        currentPlayingChar.classList.remove('tts-char-playing');
        currentPlayingChar = null;
    }
}

// ============================================
// 切换 TTS 模式
// 功能：开启/关闭单字播放模式
// 单字模式下，点击任意字符可播放其发音
// ============================================
function toggleTTSMode() {
    // 切换模式状态
    ttsMode = !ttsMode;

    // 获取相关元素
    const btn = document.getElementById('ttsModeBtn');
    const view = document.getElementById('lyricsView');

    if (ttsMode) {
        // 开启模式
        btn.classList.add('tts-active');
        view.classList.add('tts-mode');
        _markUserInteraction();  // 标记用户交互
        _initWechat();  // 初始化微信环境
        showToast('已进入播放模式，点击单字播放语音');
    } else {
        // 关闭模式
        btn.classList.remove('tts-active');
        view.classList.remove('tts-mode');
        stopCurrentTTS();  // 停止播放
        showToast('已退出播放模式');
    }
}

// ============================================
// 初始化微信环境
// 功能：在页面加载时初始化微信特殊处理
// ============================================
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', _initWechat);
} else {
    _initWechat();
}

// ============================================
// 监听用户交互事件
// 功能：标记用户交互，以满足浏览器自动播放策略
// ============================================
document.addEventListener('touchstart', _markUserInteraction, { passive: true });
document.addEventListener('click', _markUserInteraction, { passive: true });

// ============================================
// 导出模块
// 将功能挂载到全局对象，供 HTML 页面调用
// ============================================
window.TTSModule = {
    init: loadTTSManifest,      // 初始化加载 manifest
    playLine: playLineTTS,      // 播放整行
    playSegment: playSegmentTTS,  // 播放分段
    playChar: playCharTTS,      // 播放单字
    toggleMode: toggleTTSMode,  // 切换播放模式
    stop: stopCurrentTTS,        // 停止播放
    isModeActive: () => ttsMode  // 检查模式状态
};
