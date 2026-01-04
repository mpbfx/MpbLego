const fs = require('fs');
const path = require('path');

// 目标目录
const targetDir = path.join(__dirname, 'lego/面试/八股盛宴');

// 定义每个文件的标签
const fileTags = {
  'CSS.md': ['前端', '八股', 'CSS', '样式', '布局'],
  'HTML.md': ['前端', '八股', 'HTML', '标签', '语义化'],
  'H5.md': ['前端', '八股', 'H5', '移动端', '适配'],
  'JS.md': ['前端', '八股', 'JavaScript', 'ES6', '异步'],
  'VUE.md': ['前端', '八股', 'Vue', '框架', '响应式'],
  'React.md': ['前端', '八股', 'React', '框架', 'Hooks'],
  '浏览器原理.md': ['前端', '八股', '浏览器', '渲染', '事件循环'],
  '计算机网络.md': ['前端', '八股', '网络', 'HTTP', 'TCP'],
  '性能优化.md': ['前端', '八股', '性能', '优化', '加载'],
  '工程化.md': ['前端', '八股', '工程化', 'Webpack', '构建'],
  '微信小程序.md': ['前端', '八股', '小程序', '微信', '跨端'],
  'index.md': ['前端', '八股', '目录'],
  'Readme.md': ['前端', '八股', '说明']
};

// 生成 YAML front matter
function generateFrontMatter(tags) {
  const tagStr = tags.map(t => `  - ${t}`).join('\n');
  return `---\ntags:\n${tagStr}\n---\n\n`;
}

// 检查文件是否已有 front matter
function hasFrontMatter(content) {
  return content.trimStart().startsWith('---');
}

// 添加或更新 front matter
function addTags(content, tags) {
  const frontMatter = generateFrontMatter(tags);
  
  if (hasFrontMatter(content)) {
    // 已有 front matter，替换它
    const endIndex = content.indexOf('---', 3);
    if (endIndex !== -1) {
      const afterFrontMatter = content.slice(endIndex + 3).trimStart();
      return frontMatter + afterFrontMatter;
    }
  }
  
  // 没有 front matter，直接添加
  return frontMatter + content;
}

// 获取所有 md 文件
const files = fs.readdirSync(targetDir).filter(f => f.endsWith('.md'));

console.log(`找到 ${files.length} 个 md 文件：\n`);

files.forEach(file => {
  const filePath = path.join(targetDir, file);
  const content = fs.readFileSync(filePath, 'utf-8');
  
  const tags = fileTags[file] || ['前端', '八股'];
  const newContent = addTags(content, tags);
  
  fs.writeFileSync(filePath, newContent, 'utf-8');
  console.log(`✓ ${file} - 标签: ${tags.join(', ')}`);
});

console.log('\n标签添加完成！');
