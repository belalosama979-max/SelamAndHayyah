const fs = require('fs');
const path = require('path');

function replaceInFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let original = content;

  // text colors inside SVGs
  content = content.replace(/fill="\#fff"/g, 'fill="var(--text-primary)"');
  content = content.replace(/fill=\{isFinishedCell \? '\#fff' : '\#f9fafb'\}/g, "fill={isFinishedCell ? 'var(--text-primary)' : 'var(--text-primary)'}");
  content = content.replace(/fill=\{isFinishedCell \? "'#fff'" : "'#f9fafb'"\}/g, "fill={isFinishedCell ? 'var(--text-primary)' : 'var(--text-primary)'}");

  // Board dots and elements that used #fff
  content = content.replace(/stroke="\#fff"/g, 'stroke="var(--text-primary)"');
  
  if (content !== original) {
    fs.writeFileSync(filePath, content);
    console.log('Updated', filePath);
  }
}

replaceInFile(path.join(process.cwd(), 'src/components/Board.jsx'));
console.log('DONE');
