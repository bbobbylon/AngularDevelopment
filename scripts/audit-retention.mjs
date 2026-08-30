/**
 * Retention audit — scores every lesson against the nine-point "Zero to Hero" bar
 * recorded in .claude/CLAUDE.md.
 *
 * These are *proxies*, not judgements: a lesson can score 9/9 and still be dull, and a
 * lesson can teach brilliantly with an unusual shape the regexes miss. The point is to
 * rank lessons so the weakest get looked at first, not to grade them.
 *
 *   node scripts/audit-retention.mjs            ranked table, worst first
 *   node scripts/audit-retention.mjs --json     machine-readable
 *   node scripts/audit-retention.mjs --detail <slug>   which signals a lesson is missing
 */

import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const LESSON_ROOT = 'src/app/lessons';

/**
 * Each check gets the concatenated HTML of a lesson (and its sub-components) plus the
 * concatenated TypeScript, and returns whether the signal is present.
 *
 * Most checks accept two forms: the shared teaching component from `shared/teaching/`
 * (the preferred way, since it is consistent and accessible by construction) or a
 * hand-rolled equivalent, because a few lessons had good bespoke versions of these before
 * the components existed and there is no reason to force a rewrite.
 */
const CHECKS = [
  {
    key: 'visual',
    label: 'Visual',
    test: (html) =>
      /<app-flow[\s/>]/i.test(html) ||
      /<svg[\s>]/i.test(html) ||
      /class="[^"]*\b(diagram|flow|timeline|pipeline|tree|graph|axis|lane)\b/i.test(html),
  },
  {
    key: 'table',
    label: 'Table',
    test: (html) => /<table[\s>]/i.test(html) || /<app-compare[\s/>]/i.test(html),
  },
  {
    key: 'analogy',
    label: 'Analogy',
    test: (html) =>
      /\b(mental model|think of it like|think of .{0,30} as|imagine |analogy|it'?s like a|same way that|picture )\b/i.test(
        html,
      ),
  },
  {
    key: 'hook',
    label: 'Memory hook',
    test: (html) =>
      /<app-remember[\s/>]/i.test(html) ||
      /\b(remember this|rule of thumb|mnemonic|if you remember one thing|the rule:|golden rule)\b/i.test(
        html,
      ),
  },
  {
    key: 'askFirst',
    label: 'Ask before telling',
    test: (html) =>
      /<app-predict[\s/>]/i.test(html) ||
      /\b(what do you think|before you read on|what happens if)\b/i.test(html),
  },
  {
    key: 'qanda',
    label: 'Q&A',
    test: (html) =>
      /<app-faq[\s/>]/i.test(html) || /no dumb questions|<details[\s>]|class="[^"]*\bfaq\b/i.test(html),
  },
  {
    key: 'selftest',
    label: 'Self-test',
    test: (html) =>
      /<app-quiz[\s/>]/i.test(html) ||
      /\b(your turn|spot the bug|predict the output|check yourself|quick check|try it yourself)\b/i.test(
        html,
      ),
  },
  {
    key: 'recap',
    label: 'Recap',
    test: (html) => /\b(recap|takeaways?|key points|in a nutshell|cheat ?sheet)\b/i.test(html),
  },
  {
    key: 'interactive',
    label: 'Interactive demo',
    // Two ways a lesson can be genuinely interactive, and both count:
    // an event binding driving signal state, or a live reactive form.
    test: (html, ts) =>
      (/\(click\)|\(input\)|\[\(ngModel\)\]|\(change\)/.test(html) &&
        // `signal<Foo>(…)` is as reactive as `signal(…)`; match the generic form too.
        /\b(signal|computed|linkedSignal|model)\s*[<(]/.test(ts)) ||
      (/\[formGroup\]|formControlName|\[formControl\]/.test(html) &&
        /new FormGroup|new FormControl|fb\.group|formBuilder\.group/.test(ts)),
  },
];

/** Walk a directory, collecting every file that matches an extension. */
function collect(dir, ext, out = []) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) collect(full, ext, out);
    else if (entry.endsWith(ext)) out.push(full);
  }
  return out;
}

/** Every lesson is a directory two levels under lessons/ (tier/slug). */
function findLessons() {
  const lessons = [];
  for (const tier of readdirSync(LESSON_ROOT)) {
    const tierDir = join(LESSON_ROOT, tier);
    if (!statSync(tierDir).isDirectory()) continue;
    for (const slug of readdirSync(tierDir)) {
      const dir = join(tierDir, slug);
      if (statSync(dir).isDirectory()) lessons.push({ tier, slug, dir });
    }
  }
  return lessons;
}

const results = findLessons().map((lesson) => {
  const htmlFiles = collect(lesson.dir, '.html');
  const tsFiles = collect(lesson.dir, '.ts').filter((f) => !f.endsWith('.spec.ts'));
  const html = htmlFiles.map((f) => readFileSync(f, 'utf8')).join('\n');
  const ts = tsFiles.map((f) => readFileSync(f, 'utf8')).join('\n');

  const signals = {};
  for (const check of CHECKS) signals[check.key] = check.test(html, ts);
  const score = Object.values(signals).filter(Boolean).length;

  return {
    ...lesson,
    path: relative('.', lesson.dir).replace(/\\/g, '/'),
    bytes: html.length + ts.length,
    files: htmlFiles.length,
    signals,
    score,
    missing: CHECKS.filter((c) => !signals[c.key]).map((c) => c.label),
  };
});

results.sort((a, b) => a.score - b.score || a.bytes - b.bytes);

const args = process.argv.slice(2);

if (args[0] === '--json') {
  console.log(JSON.stringify(results, null, 2));
} else if (args[0] === '--detail') {
  const found = results.filter((r) => r.slug.includes(args[1] ?? ''));
  for (const r of found) {
    console.log(`\n${r.tier}/${r.slug}  ${r.score}/${CHECKS.length}  (${r.bytes} bytes)`);
    for (const c of CHECKS) {
      console.log(`   ${r.signals[c.key] ? '✓' : '·'}  ${c.label}`);
    }
  }
} else {
  const width = Math.max(...results.map((r) => `${r.tier}/${r.slug}`.length));
  console.log(`\n  ${'lesson'.padEnd(width)}  score  size    missing`);
  console.log(`  ${'-'.repeat(width)}  -----  ------  -------`);
  for (const r of results) {
    console.log(
      `  ${`${r.tier}/${r.slug}`.padEnd(width)}  ${String(r.score).padStart(2)}/${CHECKS.length}  ` +
        `${String(Math.round(r.bytes / 1024) + 'k').padStart(5)}  ${r.missing.join(', ')}`,
    );
  }

  const buckets = new Map();
  for (const r of results) buckets.set(r.score, (buckets.get(r.score) ?? 0) + 1);
  console.log(`\n  ${results.length} lessons. Distribution:`);
  for (const score of [...buckets.keys()].sort((a, b) => a - b)) {
    console.log(`    ${score}/${CHECKS.length}  ${'█'.repeat(buckets.get(score))} ${buckets.get(score)}`);
  }
  console.log();
}
