// 繁体→简体转换模块
// 使用 opencc 库进行准确的繁简转换

const OpenCC = require('opencc');
const converter = new OpenCC('t2s.json');

/**
 * 将繁体中文转换为简体中文
 * @param {string} text - 输入文本（繁体或混合）
 * @returns {string} 简体中文文本
 */
function toSimplified(text) {
    if (!text || typeof text !== 'string') return text;
    return converter.convertSync(text);
}

module.exports = { toSimplified, countSegments };

/**
 * 计算一行歌词被分割成多少个 segment
 * 空格作为分割点，但书名号《》和括号（）()内的空格不分割
 * @param {string[]} charsArray - 字符数组（从歌词文件中解析的 chars）
 * @returns {number} segment 数量
 */
function countSegments(charsArray) {
    let segments = 1;
    let inBrackets = 0;
    for (const c of charsArray) {
        if (c === '《' || c === '(' || c === '（') inBrackets++;
        if (c === '》' || c === ')' || c === '）') inBrackets = Math.max(0, inBrackets - 1);
        if (c === ' ' && inBrackets === 0) segments++;
    }
    return segments;
}
