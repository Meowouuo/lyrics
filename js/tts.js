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
// 格式为 { "粤拼": "音频文件路径", ... } 的映射表
let ttsManifest = null;

// TTS 音频文件的基础 URL
// 拼接方式：ttsBaseUrl + '/' + manifest中的路径
let ttsBaseUrl = '';

// 当前正在播放的 Audio 对象
// 用于控制播放、暂停和停止
let currentAudio = null;

// 当前播放按钮元素（用于高亮显示）
// 点击同一按钮可停止播放（toggle 行为）
let currentPlayingBtn = null;

// TTS 播放模式开关
// 开启后，点击歌词中的单字即可播放对应发音
let ttsMode = false;

// 当前正在播放的字符元素（用于单字播放高亮）
// 播放时添加高亮样式，播放完成后移除
let currentPlayingChar = null;

// 是否已有用户交互（用于处理浏览器自动播放策略）
// 现代浏览器要求音频播放必须由用户手势触发
let _hasUserInteraction = false;

// ============================================
// 用户交互标记
// 功能：标记用户已有交互行为，以满足浏览器自动播放策略
// 必须在用户点击后调用，否则音频无法播放
// ============================================
function _markUserInteraction() {
    // 设置交互标记为 true，表示用户已与页面交互
    _hasUserInteraction = true;
}

// ============================================
// 微信环境初始化
// 功能：针对微信内置浏览器的特殊处理
// 微信环境需要特殊触发才能播放音频
// 原因：微信的 WebView 对音频自动播放有额外限制
// ============================================
function _initWechat() {
    // 检测是否在微信环境中
    // 通过 User-Agent 中的 MicroMessenger 标识判断
    if (!/MicroMessenger/i.test(navigator.userAgent)) return;
    console.log('[TTS] WeChat detected');

    // 创建解锁函数，标记用户已交互
    const unlock = () => { _markUserInteraction(); };

    // 尝试获取网络类型（这是微信的特殊 API）
    // 调用此 API 会触发微信的音频播放权限解锁
    if (window.WeixinJSBridge && window.WeixinJSBridge.invoke) {
        // WeixinJSBridge 已加载，直接调用
        WeixinJSBridge.invoke('getNetworkType', {}, unlock);
    } else {
        // Bridge 还未加载，注册事件监听等待加载完成
        // once: true 表示只监听一次，触发后自动移除
        document.addEventListener('WeixinJSBridgeReady', unlock, { once: true });
    }
}

// ============================================
// 播放音频核心函数
// 功能：创建 Audio 对象并播放指定 URL，支持重试机制
//
// 参数：
//   - url: 音频文件 URL（完整路径）
//   - retryCount: 当前重试次数（内部递归使用，默认为 0）
//
// 返回值：Promise，播放成功或失败时 resolve
// 设计思路：使用 Audio 元素而非 fetch，避免 CORS 跨域问题
// ============================================
function _playAudio(url, retryCount = 0) {
    const MAX_RETRIES = 2;  // 最多重试 2 次（共尝试 3 次）

    return new Promise((resolve, reject) => {
        // 显示加载提示（如果加载提示组件存在）
        // TTSLoading 是全局加载提示组件
        if (window.TTSLoading && window.currentSong) {
            window.TTSLoading.show(window.currentSong.id);
        }

        // 创建新的 Audio 对象
        const audio = new Audio();
        currentAudio = audio;  // 保存引用，用于后续停止控制

        // 标记是否已完成（避免重复调用 resolve/reject）
        // Promise 只能 resolve 或 reject 一次
        let resolved = false;
        // 成功完成回调
        const done = () => { if (!resolved) { resolved = true; resolve(); } };
        // 失败回调，传入错误对象
        const fail = (e) => { if (!resolved) { resolved = true; reject(e || new Error('Audio error')); } };

        // 监听播放结束事件（音频自然播放完毕）
        audio.onended = done;

        // 监听播放错误事件（加载失败或解码错误）
        audio.onerror = () => {
            // 打印当前重试次数，便于调试
            console.warn('[TTS] Audio error (attempt ' + (retryCount + 1) + '/' + (MAX_RETRIES + 1) + ')');
            if (retryCount < MAX_RETRIES) {
                // 未达到最大重试次数，递归调用自身进行重试
                // 重试时会创建新的 Audio 对象
                _playAudio(url, retryCount + 1).then(resolve).catch(reject);
            } else {
                // 已达到最大重试次数，放弃并报错
                fail(new Error('Audio load/play error after retries'));
            }
        };

        // 监听时间更新事件，用于检测播放是否正常结束
        // 某些浏览器可能不触发 onended 事件，需要兜底检测
        audio.addEventListener('timeupdate', function () {
            // 判断条件：音频时长已知，且播放到接近结尾（剩余不到 0.06 秒）
            // 0.06 秒是经验值，足以判断播放即将结束
            if (!resolved && audio.duration && audio.currentTime >= audio.duration - 0.06) {
                done();  // 视为播放完成
            }
        });

        // 设置音频源 URL
        audio.src = url;

        // 尝试播放函数
        const tryPlay = () => {
            // 调用 audio.play()，返回 Promise
            const playPromise = audio.play();
            if (playPromise !== undefined) {
                // play() 返回 Promise，需要处理可能的异常
                playPromise.catch((err) => {
                    // NotAllowedError 表示浏览器阻止了自动播放
                    // 通常是因为用户尚未与页面交互
                    if (err.name === 'NotAllowedError' && !_hasUserInteraction) {
                        showToast('请点击页面任意位置后再播放');
                    }
                    fail(err);  // 播放失败
                });
            }
        };

        // 监听 canplay 事件，音频可以播放时尝试播放
        // once: true 确保只触发一次
        audio.addEventListener('canplay', tryPlay, { once: true });

        // 延迟 500ms 后再次尝试播放（兜底机制）
        // 某情况下 canplay 事件可能不触发，需要手动重试
        setTimeout(() => { if (!resolved) tryPlay(); }, 500);

        // 设置总超时时间 15 秒
        // 防止音频加载卡住导致永远等待
        setTimeout(() => {
            if (!resolved) {
                if (retryCount < MAX_RETRIES) {
                    // 超时但未达到最大重试次数，重试
                    _playAudio(url, retryCount + 1).then(resolve).catch(reject);
                } else {
                    // 超时且已达到最大重试次数，放弃
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
// 加载失败时会自动重试一次（延迟 1 秒）
// ============================================
function loadTTSManifest() {
    return new Promise(function(resolve) {
        // 首次尝试加载 manifest 文件
        fetch('tts/manifest.v1.json')
            .then(function(resp) {
                // 检查 HTTP 响应状态码
                if (resp.ok) return resp.json();
                throw new Error('HTTP ' + resp.status);
            })
            .then(function(data) {
                // 保存清单数据（粤拼→文件路径映射）
                ttsManifest = data.items;
                // 保存基础 URL（音频文件的公共前缀）
                ttsBaseUrl = data.baseUrl;
                resolve();  // 加载成功
            })
            .catch(function(e) {
                // 首次加载失败，打印警告
                console.warn('[TTS] Manifest load error:', e.message || e);
                // 1 秒后重试一次（可能是临时网络问题）
                setTimeout(function() {
                    fetch('tts/manifest.v1.json')
                        .then(function(resp) { return resp.json(); })
                        .then(function(data) {
                            // 重试成功，保存数据
                            ttsManifest = data.items;
                            ttsBaseUrl = data.baseUrl;
                        })
                        .catch(function(e2) {
                            // 重试仍然失败，打印警告但不阻塞
                            console.warn('[TTS] Manifest retry error:', e2.message || e2);
                        });
                }, 1000);
                // 即使失败也 resolve，因为 TTS 不影响基本功能
                resolve();
            });
    });
}

// ============================================
// 播放整行语音
// 功能：播放指定行的所有粤拼发音
// 点击同一按钮可停止播放（toggle 行为）
//
// 参数：
//   - lineIndex: 行索引（歌词数组中的索引，从 0 开始）
//   - btn: 播放按钮元素（用于高亮和 toggle 判断）
// ============================================
async function playLineTTS(lineIndex, btn) {
    // 前置检查：manifest 是否已加载，当前歌曲是否存在
    if (!ttsManifest || !window.currentSong) {
        showToast('语音数据未加载');
        return;
    }

    // 根据行索引获取该行歌词数据
    const line = window.currentSong.lyrics[lineIndex];
    if (!line || !line.jp) {
        // 该行不存在或没有粤拼数据
        showToast('该行没有粤拼数据');
        return;
    }

    // Toggle 逻辑：如果点击的是当前正在播放的按钮，则停止播放
    if (currentPlayingBtn === btn) {
        stopCurrentTTS();
        return;
    }

    // 停止之前的播放（避免多个音频同时播放）
    stopCurrentTTS();

    // 过滤掉空的粤拼（undefined、null、空字符串）
    const arr = line.jp.filter(Boolean);
    if (!arr.length) {
        showToast('该行没有粤拼数据');
        return;
    }

    // 记录当前播放按钮，用于 toggle 判断和高亮
    currentPlayingBtn = btn;
    btn.classList.add('playing');  // 添加播放中的 CSS 样式类

    // 按顺序逐个播放粤拼
    await _playSequence(arr, btn);
}

// ============================================
// 播放分段语音
// 功能：播放指定粤拼数组的发音
// 用于播放一行中的部分内容（如用户选中的片段）
//
// 参数：
//   - arr: 粤拼数组（如 ["jyut", "ping"]）
//   - btn: 播放按钮元素（用于高亮和 toggle 判断）
// ============================================
async function playSegmentTTS(arr, btn) {
    // 前置检查：manifest 是否已加载，数组是否有效
    if (!ttsManifest || !arr || !arr.length) return;

    // Toggle 逻辑：点击同一按钮则停止播放
    if (currentPlayingBtn === btn) {
        stopCurrentTTS();
        return;
    }

    // 停止之前的播放
    stopCurrentTTS();

    // 记录当前播放按钮
    currentPlayingBtn = btn;
    btn.classList.add('playing');  // 添加播放中样式

    // 按顺序播放粤拼数组
    await _playSequence(arr, btn);
}

// ============================================
// 按顺序播放粤拼数组
// 功能：循环播放数组中的每个粤拼，一个接一个
// 支持中途停止（通过检查 currentPlayingBtn 是否仍匹配）
//
// 参数：
//   - arr: 粤拼数组（如 ["ngo5", "hai6", "hong1", "kong3"]）
//   - btn: 播放按钮元素（用于判断是否被用户中途停止）
// ============================================
async function _playSequence(arr, btn) {
    // 遍历每个粤拼，按顺序播放
    for (const jp of arr) {
        // 每次播放前检查是否被用户停止
        // 如果 currentPlayingBtn 不再等于当前按钮，说明用户点击了停止
        if (!currentPlayingBtn || currentPlayingBtn !== btn) break;

        // 从 manifest 中查找粤拼对应的音频文件路径
        const p = ttsManifest[jp];
        if (!p) continue;  // 没有对应音频文件，跳过该粤拼

        try {
            // 拼接完整 URL 并播放
            // 等待播放完成后再播放下一个（顺序播放）
            await _playAudio(ttsBaseUrl + '/' + p);
        } catch (e) {
            // 单个粤拼播放失败不影响后续播放
            console.warn('[TTS] Play failed:', jp, e.message);
        }
    }

    // 播放完成后的清理工作
    // 再次检查是否被中途停止（避免清理其他播放的状态）
    if (currentPlayingBtn === btn) {
        btn.classList.remove('playing');  // 移除播放中样式
        currentAudio = null;              // 清除音频引用
        currentPlayingBtn = null;         // 清除按钮引用
    }
}

// ============================================
// 播放单字语音
// 功能：播放单个粤拼的发音，用于单字学习模式
// 播放时会高亮当前字符，播放完成后自动移除高亮
//
// 参数：
//   - jp: 粤拼（如 "jyut"）
//   - charEl: 字符 DOM 元素（用于高亮显示）
// ============================================
async function playCharTTS(jp, charEl) {
    // 前置检查：manifest 是否已加载，粤拼是否有效
    if (!ttsManifest || !jp) return;

    // 清除上一个正在播放的字符的高亮
    // 确保同一时间只有一个字符被高亮
    if (currentPlayingChar) {
        currentPlayingChar.classList.remove('tts-char-playing');
    }

    // 从 manifest 中查找粤拼对应的音频文件路径
    const p = ttsManifest[jp];
    if (!p) return;  // 没有对应音频，直接返回

    // 记录当前播放的字符元素
    currentPlayingChar = charEl;
    charEl.classList.add('tts-char-playing');  // 添加高亮样式

    try {
        // 拼接完整 URL 并播放
        await _playAudio(ttsBaseUrl + '/' + p);
    } catch (e) {
        // 播放失败，提示用户
        console.error('[TTS] Char play failed:', e);
        showToast('播放失败，请重试');
    }

    // 播放完成，移除字符高亮
    _clearChar(charEl);
}

// ============================================
// 清除字符高亮
// 功能：移除字符元素的高亮样式，并更新全局状态
//
// 参数：
//   - el: 字符 DOM 元素
// ============================================
function _clearChar(el) {
    // 移除高亮 CSS 类
    el.classList.remove('tts-char-playing');
    // 仅当该元素是当前播放字符时才清除全局引用
    // 避免误清除其他字符的状态
    if (currentPlayingChar === el) {
        currentPlayingChar = null;
    }
}

// ============================================
// 停止当前播放
// 功能：停止所有正在播放的音频，清除所有播放状态
// 包括：音频对象、按钮高亮、字符高亮
// ============================================
function stopCurrentTTS() {
    // 停止音频播放
    if (currentAudio) {
        try {
            currentAudio.pause();          // 暂停播放
            currentAudio.currentTime = 0;  // 重置播放进度到开头
        } catch(e) {
            // 忽略停止时的异常（如音频已加载完成）
        }
        currentAudio = null;  // 清除音频引用
    }

    // 清除播放按钮的高亮样式和引用
    if (currentPlayingBtn) {
        currentPlayingBtn.classList.remove('playing');
        currentPlayingBtn = null;
    }

    // 清除字符的高亮样式和引用
    if (currentPlayingChar) {
        currentPlayingChar.classList.remove('tts-char-playing');
        currentPlayingChar = null;
    }
}

// ============================================
// 切换 TTS 模式
// 功能：开启/关闭单字播放模式
// 单字模式下，点击歌词中的任意字符可播放其发音
// 关闭模式时会自动停止当前播放
// ============================================
function toggleTTSMode() {
    // 切换模式状态（true ↔ false）
    ttsMode = !ttsMode;

    // 获取模式按钮和歌词视图的 DOM 元素
    const btn = document.getElementById('ttsModeBtn');
    const view = document.getElementById('lyricsView');

    if (ttsMode) {
        // 开启单字播放模式
        btn.classList.add('tts-active');     // 按钮添加激活样式
        view.classList.add('tts-mode');      // 视图添加 TTS 模式样式
        _markUserInteraction();              // 标记用户交互（确保音频可播放）
        _initWechat();                       // 初始化微信环境（如果在微信中）
        showToast('已进入播放模式，点击单字播放语音');
    } else {
        // 关闭单字播放模式
        btn.classList.remove('tts-active');  // 移除按钮激活样式
        view.classList.remove('tts-mode');   // 移除视图 TTS 模式样式
        stopCurrentTTS();                    // 停止当前播放
        showToast('已退出播放模式');
    }
}

// ============================================
// 初始化微信环境
// 功能：在页面加载时初始化微信特殊处理
// 根据文档加载状态选择合适的初始化时机
// ============================================
if (document.readyState === 'loading') {
    // 文档仍在加载中，等待 DOMContentLoaded 事件
    document.addEventListener('DOMContentLoaded', _initWechat);
} else {
    // 文档已加载完成，直接初始化
    _initWechat();
}

// ============================================
// 监听用户交互事件
// 功能：标记用户交互，以满足浏览器自动播放策略
// 监听触摸和点击事件，passive: true 提升滚动性能
// ============================================
document.addEventListener('touchstart', _markUserInteraction, { passive: true });
document.addEventListener('click', _markUserInteraction, { passive: true });

// ============================================
// 导出模块
// 将功能挂载到全局对象，供 HTML 页面中的事件处理函数调用
// 使用模块化设计，各功能独立导出
// ============================================
window.TTSModule = {
    init: loadTTSManifest,      // 初始化：加载 manifest 清单
    playLine: playLineTTS,      // 播放整行：播放指定行的所有粤拼
    playSegment: playSegmentTTS,  // 播放分段：播放选中的粤拼片段
    playChar: playCharTTS,      // 播放单字：播放单个字符的粤拼发音
    toggleMode: toggleTTSMode,  // 切换模式：开启/关闭单字播放模式
    stop: stopCurrentTTS,        // 停止播放：停止所有音频并清除状态
    isModeActive: () => ttsMode  // 查询状态：返回当前是否处于 TTS 模式
};
