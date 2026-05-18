# TTS 音频清单说明

## manifest.v1.json 文件用途

`manifest.v1.json` 是一个 **TTS（文本转语音）音频清单文件**，用于粤语歌词项目的语音合成功能。该文件记录了所有已生成的粤语语音音频条目，前端通过此清单查找并播放对应的粤语音频文件。

文件托管于 CDN（jsDelivr），音频资源来源于 GitHub 仓库 `Meowouuo/lyrics-audio`。

## 文件格式说明

文件为标准 JSON 格式，结构如下：

```json
{
  "version": 1,                          // 清单版本号
  "voiceId": "yue-HK-Standard-A",        // 使用的 TTS 语音 ID（粤语-香港-标准-A 女声）
  "voiceVersion": "v1",                  // 语音模型版本
  "baseUrl": "https://cdn.jsdelivr.net/gh/Meowouuo/lyrics-audio@main",  // 音频文件 CDN 基础路径
  "items": {                             // 音频条目映射表
    "粤拼拼音": "相对路径/文件名.mp3"     // 键为粤拼（Jyutping），值为音频文件相对路径
  }
}
```

### 字段说明

| 字段 | 类型 | 说明 |
|------|------|------|
| `version` | `number` | 清单格式版本号，当前为 `1` |
| `voiceId` | `string` | TTS 语音标识，`yue-HK-Standard-A` 表示粤语香港标准女声 |
| `voiceVersion` | `string` | 语音模型版本号，当前为 `v1` |
| `baseUrl` | `string` | 音频文件的 CDN 基础 URL，所有音频路径均相对于此 URL |
| `items` | `object` | 核心数据，键值对映射。键为粤拼（Jyutping）拼音，值为对应的 MP3 音频文件相对路径 |

### items 键值格式

- **键（粤拼拼音）**：使用粤拼罗马拼音表示粤语发音，多个音节以空格分隔。声调以数字标注在音节末尾，例如 `*2` 表示第二声。示例：
  - `dei6` — "地"（第六声）
  - `ngo5 dei6` — "我地"（我们）
  - `aa3 seoi4*2` — 带声调标记的多音节词
- **值（音频路径）**：相对于 `baseUrl` 的 MP3 文件路径，格式为 `v1/{哈希前两位}/{完整哈希}.mp3`，其中哈希值用于内容寻址和缓存控制

## 如何生成和更新音频文件

### 生成流程

1. **提取粤拼**：从歌词数据中提取所有需要语音合成的粤拼拼音
2. **TTS 合成**：使用 TTS 服务（语音 ID：`yue-HK-Standard-A`）将粤拼转换为语音音频
3. **文件命名**：音频文件以内容哈希值命名，存储在 `v1/` 目录下，按哈希前两位分目录存放
4. **更新清单**：将粤拼与音频文件路径的映射关系写入 `manifest.v1.json` 的 `items` 字段

### 更新清单

当新增歌词或需要补充新的粤拼发音时：

1. 生成新的音频文件并上传至 `lyrics-audio` 仓库
2. 在 `items` 中添加对应的粤拼-路径映射条目
3. 如有语音模型升级，需同步更新 `voiceId` 和 `voiceVersion` 字段，并考虑递增 `version` 版本号

### 前端使用

前端通过 `tts.js` 模块加载此清单，根据歌词中的粤拼拼音查找对应的音频 URL（`baseUrl + items[粤拼]`），实现逐字或逐词的语音播放功能。
