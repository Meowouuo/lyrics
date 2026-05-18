/**
 * @file songFiles.js
 * @description 粤拼歌词项目的歌曲清单文件
 *
 * 本文件存储了项目中所有可用的歌曲文件路径列表，作为歌词列表页面的数据源。
 * 该文件由构建脚本自动生成，请勿手动修改。如需添加或删除歌曲，
 * 请通过投稿页面（submit.html）提交请求，由管理员审核后通过脚本重新生成。
 *
 * 数组格式说明：
 * - 数组名称：songFiles
 * - 数组元素类型：字符串（String）
 * - 每个元素是一个相对路径，指向 lyrics/ 目录下的歌曲数据文件（.js 格式）
 * - 路径格式：'lyrics/歌曲名称.js'
 * - 歌曲名称中可能包含特殊字符（如中文冒号、括号等），需保持原样
 * - 包含 live 版本的歌曲以 '(live)' 标识
 * - 包含 Medley（串烧）的歌曲以 'Medley：' 开头，多首歌用 '+' 连接
 *
 * 使用方法：
 * 1. 在 HTML 页面中通过 <script src="songFiles.js"> 引入本文件
 * 2. 引入后即可通过全局变量 songFiles 访问歌曲列表数组
 * 3. 遍历 songFiles 数组可获取所有歌曲文件路径
 * 4. 配合动态加载脚本（如 import() 或动态 <script>）加载具体歌曲数据
 *
 * @example
 * // 遍历所有歌曲文件路径
 * songFiles.forEach(file => {
 *     console.log('歌曲文件:', file);
 * });
 *
 * @example
 * // 动态加载某首歌曲的数据
 * const songPath = songFiles[0]; // 获取第一首歌曲的路径
 * const script = document.createElement('script');
 * script.src = songPath;
 * document.body.appendChild(script);
 *
 * @global songFiles - 全局数组，包含所有歌曲文件路径
 */

// 歌曲清单（自动生成，请勿手动修改）
const songFiles = [
    'lyrics/Medley：再见我的初恋+痛爱+逃避你+谁来爱我+损友+抱抱+想得太远+习惯失恋+一拍两散+心淡（live）.js',
    'lyrics/Medley：密友+损友+心甘命抵+早有预谋+罪魁+借过+我也不想这样（live）.js',
    'lyrics/Medley：赤子+愿(Live).js',
    'lyrics/Medley：还+借（live）.js',
    'lyrics/一生何求(live).js',
    'lyrics/一生何求.js',
    'lyrics/世上只有.js',
    'lyrics/习惯失恋.js',
    'lyrics/借.js',
    'lyrics/十面埋伏.js',
    'lyrics/千千阙歌.js',
    'lyrics/友共情.js',
    'lyrics/告别我的恋人们.js',
    'lyrics/呼吸有害.js',
    'lyrics/喜帖街.js',
    'lyrics/喜欢你.js',
    'lyrics/圆.js',
    'lyrics/天之骄女.js',
    'lyrics/嫁妆.js',
    'lyrics/寂寞夜晚(live).js',
    'lyrics/富士山下.js',
    'lyrics/心跳回忆.js',
    'lyrics/必杀技.js',
    'lyrics/忍.js',
    'lyrics/恋无可恋.js',
    'lyrics/时代.js',
    'lyrics/明年今日.js',
    'lyrics/樱花树下.js',
    'lyrics/欢乐今宵.js',
    'lyrics/海阔天空.js',
    'lyrics/游乐场.js',
    'lyrics/爱与诚.js',
    'lyrics/爱得太迟.js',
    'lyrics/爱神.js',
    'lyrics/用背脊唱情歌.js',
    'lyrics/笑忘书.js',
    'lyrics/第二最爱.js',
    'lyrics/粤语残片.js',
    'lyrics/紧急联络人.js',
    'lyrics/罗马假期.js',
    'lyrics/美中不足.js',
    'lyrics/致少年时代.js',
    'lyrics/还.js',
    'lyrics/追风筝的孩子.js',
    'lyrics/重复犯错.js',
    'lyrics/黑暗中漫舞.js',
];
