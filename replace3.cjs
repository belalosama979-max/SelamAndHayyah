const fs = require('fs');
const path = require('path');

function replaceInFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let original = content;

  // Replace dark backgrounds
  content = content.replace(/rgba\(11,\s*15,\s*25,\s*0\.95\)/g, 'var(--bg-primary-transparent)');
  content = content.replace(/rgba\(11,\s*15,\s*25,\s*0\.9\)/g, 'var(--bg-primary-transparent)');
  content = content.replace(/rgba\(17,\s*24,\s*39,\s*0\.6\)/g, 'var(--bg-primary-transparent)');
  
  // Replace dark modals
  content = content.replace(/rgba\(3,\s*7,\s*18,\s*0\.95\)/g, 'var(--bg-primary-transparent)');
  content = content.replace(/rgba\(17,\s*24,\s*39,\s*0\.9\)/g, 'var(--bg-primary-transparent)');
  content = content.replace(/rgba\(31,\s*41,\s*55,\s*0\.45\)/g, 'var(--text-muted)');
  
  if (content !== original) {
    fs.writeFileSync(filePath, content);
    console.log('Updated', filePath);
  }
}

function walkDir(dir) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    if (fs.statSync(dirPath).isDirectory()) {
      walkDir(dirPath);
    } else if (dirPath.endsWith('.jsx')) {
      replaceInFile(dirPath);
    }
  });
}

walkDir(path.join(process.cwd(), 'src'));
console.log('DONE');
