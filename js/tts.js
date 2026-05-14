// TTS 语音播报模块

// TTS 状态
let ttsManifest = null;       // 存储 manifest 数据
let ttsBaseUrl = '';          // 存储 baseUrl
let currentAudio = null;      // 当前播放的音频
let currentPlayingBtn = null; // 当前播放按钮
let ttsMode = false;          // 播放模式开关
let currentPlayingChar = null; // 当前播放的单字元素

// 加载 TTS manifest 文件
async function loadTTSManifest() {
    try {
        const response = await fetch('tts/manifest.v1.json');
        if (response.ok) {
            const data = await response.json();
            ttsManifest = data.items;
            ttsBaseUrl = data.baseUrl;
            console.log('TTS manifest 加载成功，共', Object.keys(ttsManifest).length, '个语音项');
        } else {
            console.warn('TTS manifest 加载失败:', response.status);
        }
    } catch (error) {
        console.warn('TTS manifest 加载出错:', error);
    }
}

// 播放歌词行的语音
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

    // 停止当前播放
    stopCurrentTTS();

    // 获取该行的粤拼数组（过滤空值）
    const jyutpingArr = line.jp.filter(jp => jp);
    if (jyutpingArr.length === 0) {
        showToast('该行没有粤拼数据');
        return;
    }

    // 设置当前播放按钮
    currentPlayingBtn = btn;
    btn.classList.add('playing');

    // 逐词播放
    await playJyutpingSequence(jyutpingArr, btn);
}

// 播放分段的语音（用于空格分割后的子行）
async function playSegmentTTS(jyutpingArr, btn) {
    if (!ttsManifest || !jyutpingArr || jyutpingArr.length === 0) return;

    stopCurrentTTS();

    currentPlayingBtn = btn;
    btn.classList.add('playing');

    await playJyutpingSequence(jyutpingArr, btn);
}

// 逐词播放粤拼序列
async function playJyutpingSequence(jyutpingArr, btn) {
    for (let i = 0; i < jyutpingArr.length; i++) {
        // 如果用户点击了其他按钮或停止播放，则中断
        if (!currentPlayingBtn || currentPlayingBtn !== btn) {
            break;
        }

        const jp = jyutpingArr[i];
        const audioPath = ttsManifest[jp];
        
        if (!audioPath) {
            console.log('未找到粤拼:', jp);
            continue; // 跳过未找到的词，继续播放下一个
        }

        const audioUrl = `${ttsBaseUrl}/${audioPath}`;
        
        try {
            await playAudio(audioUrl);
        } catch (err) {
            console.log('播放失败:', jp, err);
        }
    }

    // 播放完成
    if (currentPlayingBtn === btn) {
        btn.classList.remove('playing');
        currentAudio = null;
        currentPlayingBtn = null;
    }
}

// 播放单个音频（返回 Promise）
// 提前触发下一个音频以缩短字间间隔
function playAudio(url) {
    return new Promise((resolve, reject) => {
        const audio = new Audio(url);
        currentAudio = audio;
        let resolved = false;

        // 移动端兼容性：预加载音频
        audio.preload = 'auto';
        
        // 当音频播放到接近结尾时提前 resolve，缩短字间间隔
        audio.addEventListener('timeupdate', function onTimeUpdate() {
            if (!resolved && audio.duration && audio.currentTime >= audio.duration - 0.08) {
                resolved = true;
                audio.removeEventListener('timeupdate', onTimeUpdate);
                resolve();
            }
        });

        audio.onended = () => {
            if (!resolved) {
                resolved = true;
                resolve();
            }
        };
        audio.onerror = (err) => {
            if (!resolved) {
                resolved = true;
                reject(err);
            }
        };

        // 移动端兼容性：先尝试加载再播放
        audio.load();
        
        // 使用 canplaythrough 事件确保音频可以播放
        const playWhenReady = () => {
            audio.play().then(() => {
                // 播放成功
            }).catch(err => {
                if (!resolved) {
                    resolved = true;
                    reject(err);
                }
            });
        };

        // 如果已经加载完成，直接播放
        if (audio.readyState >= 3) {
            playWhenReady();
        } else {
            audio.addEventListener('canplaythrough', playWhenReady, { once: true });
            // 超时处理
            setTimeout(() => {
                if (!resolved) {
                    resolved = true;
                    reject(new Error('Audio load timeout'));
                }
            }, 5000);
        }
    });
}

// 停止当前播放
function stopCurrentTTS() {
    if (currentAudio) {
        currentAudio.pause();
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

// 切换播放模式
function toggleTTSMode() {
    ttsMode = !ttsMode;
    const btn = document.getElementById('ttsModeBtn');
    const lyricsView = document.getElementById('lyricsView');
    if (ttsMode) {
        btn.classList.add('tts-active');
        lyricsView.classList.add('tts-mode');
        showToast('已进入播放模式，点击单字播放语音');
    } else {
        btn.classList.remove('tts-active');
        lyricsView.classList.remove('tts-mode');
        stopCurrentTTS();
        showToast('已退出播放模式');
    }
}

// 播放单字语音
function playCharTTS(jp, charEl) {
    if (!ttsManifest || !jp) return;

    // 清除上一个播放高亮
    if (currentPlayingChar) {
        currentPlayingChar.classList.remove('tts-char-playing');
    }

    const audioPath = ttsManifest[jp];
    if (!audioPath) return;

    const audioUrl = `${ttsBaseUrl}/${audioPath}`;
    const audio = new Audio(audioUrl);
    // 移动端兼容性
    audio.preload = 'auto';
    currentAudio = audio;
    currentPlayingChar = charEl;
    charEl.classList.add('tts-char-playing');

    audio.onended = () => {
        charEl.classList.remove('tts-char-playing');
        if (currentPlayingChar === charEl) {
            currentPlayingChar = null;
        }
    };
    audio.onerror = () => {
        charEl.classList.remove('tts-char-playing');
        if (currentPlayingChar === charEl) {
            currentPlayingChar = null;
        }
    };

    // 移动端兼容性：先加载再播放
    audio.load();
    const playAudio = () => {
        audio.play().catch(() => {
            charEl.classList.remove('tts-char-playing');
            if (currentPlayingChar === charEl) {
                currentPlayingChar = null;
            }
        });
    };

    if (audio.readyState >= 3) {
        playAudio();
    } else {
        audio.addEventListener('canplaythrough', playAudio, { once: true });
        // 超时处理
        setTimeout(() => {
            if (charEl.classList.contains('tts-char-playing')) {
                charEl.classList.remove('tts-char-playing');
                if (currentPlayingChar === charEl) {
                    currentPlayingChar = null;
                }
            }
        }, 5000);
    }
}

// 导出 TTS 模块初始化函数
window.TTSModule = {
    init: loadTTSManifest,
    playLine: playLineTTS,
    playSegment: playSegmentTTS,
    playChar: playCharTTS,
    toggleMode: toggleTTSMode,
    stop: stopCurrentTTS,
    isModeActive: () => ttsMode
};
