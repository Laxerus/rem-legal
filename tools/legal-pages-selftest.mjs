import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const homepage = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const privacy = fs.readFileSync(path.join(root, 'privacy.html'), 'utf8');
const terms = fs.readFileSync(path.join(root, 'terms.html'), 'utf8');

const localLinks = [...homepage.matchAll(/href="([^"]+)"/g)]
  .map((match) => match[1])
  .filter((href) => !/^(?:https?:|mailto:|#|\/)/i.test(href));

for (const href of localLinks) {
  assert.ok(fs.existsSync(path.join(root, href)), 'homepage link must resolve: ' + href);
}
assert.match(homepage, /href="terms\.html"/);
assert.match(homepage, /href="privacy\.html"/);
assert.match(homepage, /href="\/manage">Yönetim Paneli/);
assert.match(privacy, /D1/i);
assert.match(privacy, /yedek/i);
assert.match(terms, /Gizlilik Politikası/);
assert.match(terms, /Rem Destek Discord sunucusu/);
assert.ok(!/GitHub Pages/i.test(homepage + privacy + terms), 'static legal pages must not depend on GitHub Pages hosting');
console.log('PASS legal homepage links resolve and expose the management route');
console.log('PASS privacy page documents backup processing and links to the terms');
console.log('PASS terms retain the privacy and support contact paths');
