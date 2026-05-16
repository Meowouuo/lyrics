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

module.exports = { toSimplified };
