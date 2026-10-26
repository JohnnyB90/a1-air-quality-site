// Publish website assets only. Repository notes, screenshots and build inputs stay out of Netlify.
const fs = require('node:fs');
const path = require('node:path');
const ROOT = path.resolve(__dirname, '..');
const DEST = path.resolve(ROOT, 'dist');
const publicFiles = require('./public-files');

if (path.dirname(DEST) !== ROOT || path.basename(DEST) !== 'dist') {
  throw new Error('Refusing to clean an unexpected publish directory.');
}
if (fs.existsSync(DEST) && fs.lstatSync(DEST).isSymbolicLink()) {
  throw new Error('Publish directory must not be a symlink.');
}
fs.rmSync(DEST, {recursive: true, force: true});
fs.mkdirSync(DEST, {recursive: true});
function copy(file) {
  const destination = path.join(DEST, file);
  fs.mkdirSync(path.dirname(destination), {recursive: true});
  fs.copyFileSync(path.join(ROOT, file), destination);
}
for (const file of [...publicFiles(), '_redirects', 'robots.txt', 'sitemap.xml', 'llms.txt', 'favicon.svg']) copy(file);
for (const directory of ['css', 'js', 'fonts', 'images', 'downloads', 'admin']) {
  fs.cpSync(path.join(ROOT, directory), path.join(DEST, directory), {recursive: true});
}
console.log(`Prepared dist with ${publicFiles().length} public pages, website assets, downloads and CMS access.`);
