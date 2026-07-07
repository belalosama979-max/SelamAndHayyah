const fs = require('fs');
const path = require('path');

function replaceInFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let original = content;

  content = content.replace(/rgba\(255,\s*255,\s*255,\s*0\.02\)/g, 'var(--bg-glass)');
  content = content.replace(/rgba\(255,\s*255,\s*255,\s*0\.03\)/g, 'var(--border-light)');
  content = content.replace(/rgba\(255,\s*255,\s*255,\s*0\.04\)/g, 'var(--border-light)');
  content = content.replace(/rgba\(255,\s*255,\s*255,\s*0\.05\)/g, 'var(--border-light)');
  content = content.replace(/rgba\(255,\s*255,\s*255,\s*0\.06\)/g, 'var(--bg-glass-hover)');
  content = content.replace(/rgba\(255,\s*255,\s*255,\s*0\.08\)/g, 'var(--border-light)');
  content = content.replace(/rgba\(255,\s*255,\s*255,\s*0\.1\)/g, 'var(--border-medium)');
  content = content.replace(/rgba\(255,\s*255,\s*255,\s*0\.15\)/g, 'var(--border-medium)');
  content = content.replace(/rgba\(255,\s*255,\s*255,\s*0\.2\)/g, 'var(--border-medium)');
  
  content = content.replace(/stroke=\{isFinishedCell \? '#fff' :/g, "stroke={isFinishedCell ? 'var(--text-primary)' :");
  content = content.replace(/stroke=\{showYouAreHere && activePlayer && activePlayer\.id === player\.id \? "var\(--gold\)" : "rgba\(255, 255, 255, 0\.2\)"\}/g, 'stroke={showYouAreHere && activePlayer && activePlayer.id === player.id ? "var(--gold)" : "var(--border-medium)"}');

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
