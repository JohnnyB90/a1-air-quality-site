const fs = require('node:fs');
const path = require('node:path');
const ROOT = path.join(__dirname, '..');

function walk(directory) {
  return fs.readdirSync(path.join(ROOT, directory), {withFileTypes: true}).flatMap(entry => {
    const file = `${directory}/${entry.name}`;
    return entry.isDirectory() ? walk(file) : entry.isFile() && entry.name.endsWith('.html') ? [file] : [];
  });
}

module.exports = () => [
  ...fs.readdirSync(ROOT).filter(file => file.endsWith('.html')),
  ...['services', 'locations', 'blog'].flatMap(walk)
].sort();
