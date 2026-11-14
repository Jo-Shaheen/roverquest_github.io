// Validates clean submission structure and optionally copies runtime + docs + tests into dist-release/
// excluding development clutter (.git, node_modules, original, test-results, playwright-report).
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const EXCLUDE_DIRS = new Set([
  '.git',
  'node_modules',
  'original',
  'test-results',
  'playwright-report',
  'dist-release',
  'submission',
  'RoverQuest'
]);
// Files that are team paperwork, not part of the playable release.
const EXCLUDE_FILES = new Set(['NASA Space Apps Challenge.pdf']);

const REQUIRED_PATHS = [
  'index.html',
  'moon.html',
  'rq-world.js',
  'rq-sites-mars.js',
  'rq-sites-moon.js',
  'mars.html',
  'mars-polish.js',
  'v4-upgrade.js',
  'mars-ui.css',
  'mars-games.js',
  'mars-cinema.js',
  'mars-experience.js',
  'mars-datapoints.js',
  'run.bat',
  'package.json',
  'README.md',
  'vendor/three.min.js',
  'vendor/THREE_LICENSE.txt',
  'data/hardware-images.json',
  'tools/check.mjs',
  'tools/serve.mjs',
  'tools/sync-docs.mjs',
  'docs/SUBMISSION.md',
  'docs/SCIENCE_FACT_CHECK.md',
  'docs/LEARNING_OUTCOMES.md',
  'docs/PILOT_EVALUATION_PROTOCOL.md',
  'docs/LEARNER_PILOT_PROTOCOL.md',
  'docs/LEARNER_FEEDBACK_FORM.md',
  'docs/QA_REPORT.md',
  'docs/BROWSER_QA_REPORT.md',
  'docs/IMAGE_CREDITS.md',
  'docs/PRESENTATION_SLIDES.md'
];

if (fs.existsSync(path.join(root, 'RoverQuest'))) {
  console.error('FAIL: Nested RoverQuest/ directory still exists in workspace root.');
  process.exit(1);
}

for (const rel of REQUIRED_PATHS) {
  if (!fs.existsSync(path.join(root, rel))) {
    console.error(`FAIL: Missing required release file: ${rel}`);
    process.exit(1);
  }
}

function collectReleaseFiles(dir, prefix = '') {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name.startsWith('.') && entry.name !== '.nojekyll') continue;
    if (EXCLUDE_DIRS.has(entry.name) || (!prefix && EXCLUDE_FILES.has(entry.name))) continue;
    const rel = prefix ? `${prefix}/${entry.name}` : entry.name;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      out.push(...collectReleaseFiles(full, rel));
    } else {
      const stat = fs.statSync(full);
      out.push({ rel, bytes: stat.size });
    }
  }
  return out;
}

const files = collectReleaseFiles(root);
if (process.argv.includes('--list')) { console.log(JSON.stringify(files.map((f) => f.rel))); process.exit(0); }
const totalBytes = files.reduce((acc, f) => acc + f.bytes, 0);
console.log(`Release manifest verified: ${files.length} files (${(totalBytes / (1024 * 1024)).toFixed(2)} MB) ready for clean ZIP packaging.`);
console.log('Excluded dev-only directories:', [...EXCLUDE_DIRS].join(', '));
