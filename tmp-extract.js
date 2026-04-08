const fs = require('fs');
const path = require('path');

const mapRaw = fs.readFileSync(path.join(__dirname, 'app/recovery/sourcemap.json'), 'utf8');
const map = JSON.parse(mapRaw);

if (!map.sources || !map.sourcesContent) {
  console.error('No sources or sourcesContent found in sourcemap!');
  process.exit(1);
}

const outDir = path.join(__dirname, 'app/recovery/src');
fs.mkdirSync(outDir, { recursive: true });

map.sources.forEach((sourcePath, index) => {
  const content = map.sourcesContent[index];
  if (!content) return;
  
  // Clean up source path which might have prefixes like '../src/' or 'webpack:///'
  const cleanPath = sourcePath.replace(/^.*\/src\//, '');
  if (sourcePath.includes('/node_modules/') || !sourcePath.includes('src/')) return;
  
  const destPath = path.join(outDir, cleanPath);
  fs.mkdirSync(path.dirname(destPath), { recursive: true });
  fs.writeFileSync(destPath, content);
  console.log('Extracted:', cleanPath);
});

console.log('Extraction complete!');
