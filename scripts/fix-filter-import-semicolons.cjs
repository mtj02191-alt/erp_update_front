const fs = require('fs');
const path = require('path');

function walk(dir, files = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, files);
    else if (/\.(jsx|js)$/.test(entry.name)) files.push(full);
  }
  return files;
}

const root = path.join(__dirname, '../src');
let count = 0;
for (const file of walk(root)) {
  const content = fs.readFileSync(file, 'utf8');
  if (!content.includes("filters';;")) continue;
  fs.writeFileSync(file, content.replaceAll("filters';;", "filters';"), 'utf8');
  count += 1;
}
console.log(`Fixed ${count} files`);
