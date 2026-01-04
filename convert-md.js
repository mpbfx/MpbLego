const fs = require('fs');
const path = require('path');

// 目标目录
const targetDir = path.join(__dirname, 'lego/面试/八股盛宴');

// 转换函数
function convertMarkdown(content) {
  // 移除 font 标签，保留内容
  content = content.replace(/<font[^>]*>/gi, '');
  content = content.replace(/<\/font>/gi, '');

  // 处理 code 标签 - 更通用的匹配（支持内部包含HTML标签）
  content = content.replace(/<code>([^]*?)<\/code>/gi, '`$1`');

  // 移除 br 标签，替换为空格
  content = content.replace(/<br\s*\/?>/gi, ' ');

  // 移除 u 标签
  content = content.replace(/<\/?u>/gi, '');

  // 清理多余的 ** 符号
  content = content.replace(/\*\*\*\*+/g, '');

  // 修复表格格式
  content = content.replace(/\|\s*\n+\s*\|/g, '|\n|');

  // 清理多余的空行
  content = content.replace(/\n{3,}/g, '\n\n');

  return content;
}

// 获取所有 md 文件
const files = fs.readdirSync(targetDir).filter(f => 
  f.endsWith('.md') && !f.endsWith('-clean.md')
);

console.log(`找到 ${files.length} 个 md 文件：`);

files.forEach(file => {
  const inputPath = path.join(targetDir, file);
  const content = fs.readFileSync(inputPath, 'utf-8');
  const converted = convertMarkdown(content);
  
  // 直接覆盖原文件
  fs.writeFileSync(inputPath, converted, 'utf-8');
  console.log(`✓ ${file}`);
});

console.log('\n全部转换完成！');
