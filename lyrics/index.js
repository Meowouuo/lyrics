/**
 * 歌曲清单文件
 * 
 * ===== 新增歌曲步骤 =====
 * 1. 在 lyrics/ 文件夹下创建 "歌名.js" 文件（参照现有文件格式）
 * 2. 在下方 songFiles 数组中添加一行：'lyrics/歌名.js'
 * 3. 提交即可，无需修改 index.html
 * 
 * ===== songFiles =====
 * 每个元素是相对于网站根目录的 JS 文件路径
 */
const songFiles = [
    'lyrics/重复犯错.js',
    'lyrics/喜欢你.js',
    'lyrics/海阔天空.js',
    'lyrics/富士山下.js',
    'lyrics/明年今日.js',
    'lyrics/千千阙歌.js',
];

/**
 * 动态加载所有歌曲 JS 文件
 * 每个 JS 文件会将歌曲注册到 window.__songs
 * @returns {Promise<Array>} 加载完成后的歌曲数组
 */
async function loadAllSongs() {
    window.__songs = [];

    const loadPromises = songFiles.map(file => {
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = file;
            script.onload = resolve;
            script.onerror = () => {
                console.warn(`加载歌曲文件失败: ${file}`);
                resolve(); // 不阻塞其他歌曲加载
            };
            document.head.appendChild(script);
        });
    });

    await Promise.all(loadPromises);
    return window.__songs;
}
