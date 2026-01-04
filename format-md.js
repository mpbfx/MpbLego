const fs = require('fs');
const path = require('path');

// 目标目录
const targetDir = path.join(__dirname, 'lego/面试/八股盛宴');

// 格式化函数
function formatMarkdown(content) {
  // 1. 先清理转义的星号 \* -> *
  content = content.replace(/\\\*/g, '*');
  
  // 2. 修复加粗格式：* *text** -> **text**
  content = content.replace(/\* \*([^*]+)\*\*/g, '**$1**');
  
  // 3. 修复加粗格式：**text* * -> **text**
  content = content.replace(/\*\*([^*]+)\* \*/g, '**$1**');
  
  // 4. 修复列表项中的加粗：***text**：xxx -> * **text**：xxx (带冒号)
  content = content.replace(/^\*\*\*(.+?)\*\*([：:])/gm, function(_, p1, p2) {
    return '* **' + p1 + '**' + p2;
  });
  
  // 4.1 修复行首的 ***text**（不带冒号）-> * **text**
  content = content.replace(/^\*\*\*([^*\n]+)\*\*/gm, function(_, p1) {
    return '* **' + p1 + '**';
  });
  
  // 4.2 修复行内的 ***text**： 模式（非行首）
  content = content.replace(/([^\n*])\*\*\*([^*\n]+)\*\*([：:])/g, function(_, before, text, colon) {
    return before + '* **' + text + '**' + colon;
  });
  
  // 5. 清理连续的 ****
  content = content.replace(/\*\*\*\*+/g, '');
  
  // 6. 修复错误的分隔线 * ** -> ---
  content = content.replace(/^\* \*\*$/gm, '---');
  
  // 7. 修复表格格式 - 移除表格行之间的空行
  for (let i = 0; i < 10; i++) {
    content = content.replace(/(\|[^\n]+\|)\n\n(\|[^\n]+\|)/g, '$1\n$2');
  }
  
  // 8. 清理多余的空行（3个以上换行变成2个）
  content = content.replace(/\n{3,}/g, '\n\n');
  
  // 9. 修复行首的 * * 变成 **
  content = content.replace(/^\* \*/gm, '**');
  
  // 10. 清理残留的HTML实体
  content = content.replace(/&nbsp;/g, ' ');
  
  // 11. 修复代码块前后的空行
  content = content.replace(/([^\n])\n```/g, '$1\n\n```');
  content = content.replace(/```\n([^\n])/g, '```\n\n$1');
  
  // 12. 修复代码块结尾多余空行
  content = content.replace(/```\n\n\n/g, '```\n\n');
  
  return content;
}

// 获取所有 md 文件
const files = fs.readdirSync(targetDir).filter(f => f.endsWith('.md'));

console.log(`找到 ${files.length} 个 md 文件：\n`);

files.forEach(file => {
  const inputPath = path.join(targetDir, file);
  const content = fs.readFileSync(inputPath, 'utf-8');
  const formatted = formatMarkdown(content);
  
  fs.writeFileSync(inputPath, formatted, 'utf-8');
  console.log(`✓ ${file}`);
});

console.log('\n格式化完成！');
