// Regenerates responsive, compressed image derivatives for the carousel.
//
// WHY THIS EXISTS
// The carousel images were 1600px JPEGs at ~203KB each (4.95MB total) but the
// carousel stage on index.html is capped at max-width:56rem (896px). Serving a
// 1600px source into a 900px slot wasted roughly a third of the pixels on all
// 25 images, and every visit re-downloaded them because the server sent
// `Cache-Control: max-age=0, must-revalidate`.
//
// WHAT IT PRODUCES, per image
//   movement-NN.jpg        1200px, q78  (replaces the 1600px original)
//   movement-NN.webp       1200px, q68  (~44% smaller again)
//   movement-NN-800.jpg    800px,  q78
//   movement-NN-800.webp   800px,  q68
// index.html references all four via srcset/sizes, with the .jpg as fallback.
//
// NOTE ON DESTRUCTIVENESS
// The 1200px .jpg is written to the ORIGINAL filename, so running this replaces
// the source file in place. It is safe and re-runnable, but it means:
//   - the 1600px originals are gone from the working tree
//   - recover them from git history if ever needed:  git show HEAD~1:assets/...
// Renaming outputs to a -1200.jpg suffix would avoid this, but it would need
// the srcset in index.html updated to match.
//
// Run: node tools/optimize-images.js   (requires: npm i sharp)

const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const ROOT = path.join(__dirname, '..');
const SRC = path.join(ROOT, 'assets', 'images', 'movement');
const files = fs.readdirSync(SRC).filter(f => /^movement-\d+\.jpg$/.test(f)).sort();

const WIDTHS = [
  { suffix: '-800', width: 800 },
  { suffix: '', width: 1200 }
];

(async () => {
  if (files.length === 0) {
    console.error('No source images found in ' + SRC);
    process.exit(1);
  }

  let before = 0;
  let alreadyOptimised = 0;
  const rows = [];

  for (const f of files) {
    const base = path.join(SRC, f);
    const stat = fs.statSync(base);
    before += stat.size;

    // Detect a re-run against already-processed sources, so the summary can say
    // so instead of reporting a misleading near-zero saving.
    const meta = await sharp(base).metadata();
    if (meta.width <= 1200) alreadyOptimised++;

    const stem = path.basename(f, '.jpg');
    const sizes = {};

    // Build each variant from the current source in a single pass.
    for (const { suffix, width } of WIDTHS) {
      // JPEG at this width.
      const jpgOut = path.join(SRC, stem + suffix + '.jpg');
      await sharp(base, { failOn: 'none' })
        .rotate()
        .resize({ width, withoutEnlargement: true })
        .jpeg({ quality: 78, progressive: true, mozjpeg: true })
        .toFile(jpgOut + '.tmp');
      fs.renameSync(jpgOut + '.tmp', jpgOut);

      // WebP at this width.
      const webpOut = path.join(SRC, stem + suffix + '.webp');
      await sharp(base, { failOn: 'none' })
        .rotate()
        .resize({ width, withoutEnlargement: true })
        .webp({ quality: 68, effort: 6 })
        .toFile(webpOut);

      sizes[suffix] = {
        jpg: fs.statSync(jpgOut).size,
        webp: fs.statSync(webpOut).size
      };
    }

    rows.push({
      file: stem,
      beforeKB: Math.round(stat.size / 1024),
      jpg1200: Math.round(sizes[''].jpg / 1024),
      webp1200: Math.round(sizes[''].webp / 1024),
      webp800: Math.round(sizes['-800'].webp / 1024)
    });
  }

  const tot = (k) => rows.reduce((a, r) => a + r[k], 0);

  console.log('image           was     1200jpg  1200webp   800webp');
  console.log('------------------------------------------------------------');
  for (const r of rows) {
    console.log(
      r.file.padEnd(15) +
      String(r.beforeKB + 'KB').padStart(8) +
      String(r.jpg1200 + 'KB').padStart(11) +
      String(r.webp1200 + 'KB').padStart(12) +
      String(r.webp800 + 'KB').padStart(11)
    );
  }
  console.log('------------------------------------------------------------');
  const pct = (now, was) => Math.round((1 - now / was) * 100);
  const mb = (kb) => (kb / 1024).toFixed(2) + 'MB';
  console.log(
    'TOTAL jpg path:  ' + mb(tot('beforeKB')) + ' -> ' + mb(tot('jpg1200')) +
    '  (-' + pct(tot('jpg1200'), tot('beforeKB')) + '%)'
  );
  console.log(
    'TOTAL webp path: ' + mb(tot('beforeKB')) + ' -> ' + mb(tot('webp1200')) +
    '  (-' + pct(tot('webp1200'), tot('beforeKB')) + '%)'
  );
  console.log(
    'TOTAL 800webp:   ' + mb(tot('beforeKB')) + ' -> ' + mb(tot('webp800')) +
    '  (-' + pct(tot('webp800'), tot('beforeKB')) + '%)'
  );
  console.log('\nBrowsers on a phone will pull the 800px variants.');

  if (alreadyOptimised === files.length) {
    console.log(
      '\nNOTE: all ' + files.length + ' sources were already <=1200px, so the "was"\n' +
      'column reflects a previous run rather than the original 1600px files.\n' +
      'The real first-run saving vs the 1600px originals is shown in docs/DEPLOY.md.\n' +
      'To measure against the originals again:  git stash / git show HEAD~1:assets/...'
    );
  } else if (alreadyOptimised > 0) {
    console.log(
      '\nNOTE: ' + alreadyOptimised + ' of ' + files.length +
      ' sources were already optimised; the "was" column is not a like-for-like baseline.'
    );
  }
})();
