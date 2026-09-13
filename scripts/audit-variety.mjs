/**
 * Variety audit — checks that lessons do not all open the same way, and that a lesson
 * declaring a page shape actually has that shape.
 *
 * A "shape" is the lesson's opening block: everything after `<app-chapter>` up to and
 * including its one quiz check (plus the napkin that usually closes it). What varies
 * between shapes is which device leads and what is deliberately left out — the full
 * sequences and the forbidden lists live in docs/CONTRIBUTING.md §2C and are mirrored in
 * SHAPES below. A lesson declares its shape with `shape: '…'` on its entry in
 * src/app/core/curriculum.ts; an undeclared lesson is the legacy recipe (Chapter → Napkin
 * → Remember, mostly), which is what the rotation in BACKLOG §2.10 step 5 works through.
 *
 * Like audit-retention.mjs, this reads the curriculum in ARRAY ORDER rather than walking
 * the filesystem, because "adjacent" only means something in curriculum order and a
 * lesson's directory slug is not always its id (`ts-types` lives at typescript/types).
 *
 *   node scripts/audit-variety.mjs                 findings worst-first, then the baseline
 *   node scripts/audit-variety.mjs --json          machine-readable
 *   node scripts/audit-variety.mjs --detail <id>   one lesson's device sequence and block
 *
 * Exit code 1 when a declared shape is missing its lead device, its block contains a
 * device the shape forbids, or two adjacent lessons in a track share a shape. Repeated
 * undeclared openings are reported but do not fail — that is the baseline being worked down.
 */

import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const CURRICULUM_FILE = 'src/app/core/curriculum.ts';
const LESSON_ROOT = 'src/app/lessons';

/**
 * One entry per built shape. `lead` is what the block must contain; `forbid` is what it
 * must not. Everything after the block is the lesson's own business, so a `remember`
 * later in an `argument` lesson is fine — only the block is checked.
 */
const SHAPES = {
  'no-dumb-questions': {
    label: 'There Are No Dumb Questions',
    lead: (block) => block.includes('app-no-dumb-questions'),
    leadText: 'app-no-dumb-questions',
    forbid: ['app-bubbles', 'app-tape-card', 'app-receipt', 'app-remember'],
  },
  receipt: {
    label: 'The Receipt',
    lead: (block) => block.includes('app-receipt'),
    leadText: 'app-receipt',
    forbid: ['app-bubbles', 'app-no-dumb-questions'],
    // The receipt is the opener; a napkin in first position is the legacy recipe.
    notFirst: 'app-napkin',
  },
  whiteboard: {
    label: 'The Whiteboard',
    lead: (block) => block.includes('app-whiteboard'),
    leadText: 'app-whiteboard',
    forbid: ['app-bubbles', 'app-tape-card', 'app-receipt'],
  },
  argument: {
    label: 'The Argument',
    // Two conversations, split by the open question.
    lead: (block) => {
      const first = block.indexOf('app-bubbles');
      const second = block.indexOf('app-bubbles', first + 1);
      const brain = block.indexOf('app-brain-power');
      return first !== -1 && second !== -1 && brain > first && brain < second;
    },
    leadText: 'two app-bubbles with an app-brain-power between them',
    forbid: [
      'app-tape-card',
      'app-no-dumb-questions',
      'app-receipt',
      'app-code-lab',
      'app-remember',
    ],
  },
};

/** How many devices to treat as "the block" when a lesson has no quiz to end it on. */
const FALLBACK_BLOCK_LENGTH = 12;

/**
 * Pull each lesson out of curriculum.ts in array order. The file is TypeScript, so an
 * .mjs cannot import it; the entries are prettier-formatted and regular enough that a
 * regex per entry is reliable — `  {` … `  },` at two-space indent, with the import path
 * giving both the lesson's directory and its component file.
 */
function readCurriculum() {
  const source = readFileSync(CURRICULUM_FILE, 'utf8');
  const entries = [];
  for (const match of source.matchAll(/^ {2}\{\r?\n([\s\S]*?)^ {2}\},?$/gm)) {
    const body = match[1];
    const id = /^\s*id:\s*'([^']+)'/m.exec(body)?.[1];
    const level = /^\s*level:\s*'([^']+)'/m.exec(body)?.[1];
    const shape = /^\s*shape:\s*'([^']+)'/m.exec(body)?.[1];
    const path = /import\(\s*'\.\.\/lessons\/([a-z0-9-]+)\/([a-z0-9-]+)\/([a-z0-9-]+)'\s*\)/.exec(
      body,
    );
    if (!id || !level) continue;
    entries.push({
      id,
      level,
      shape,
      tier: path?.[1],
      slug: path?.[2],
      file: path?.[3],
      written: Boolean(path),
    });
  }
  return entries;
}

/** The lesson's primary template — the one next to its component file. */
function readTemplate(entry) {
  const dir = join(LESSON_ROOT, entry.tier, entry.slug);
  const primary = join(dir, `${entry.file}.html`);
  if (existsSync(primary)) return readFileSync(primary, 'utf8');
  const first = readdirSync(dir).find((f) => f.endsWith('.html'));
  return first ? readFileSync(join(dir, first), 'utf8') : '';
}

/**
 * Every teaching/presentation/shape device in document order, opening tags only.
 * Attribute values are blanked first: a scribble quoting `<app-chart />` or a predict
 * carrying markup in its `code` attribute must not read as a device in the block.
 */
function deviceSequence(html) {
  const markupOnly = html.replace(/="[^"]*"/g, '=""');
  return [...markupOnly.matchAll(/<(app-[a-z-]+)[\s/>]/g)].map((m) => m[1]);
}

/**
 * The block is everything after the chapter header up to and including the first quiz,
 * plus the napkin that usually closes it. With no quiz, the first dozen devices stand in.
 */
function openingBlock(sequence) {
  const start = sequence.indexOf('app-chapter') + 1;
  const rest = sequence.slice(start);
  const quiz = rest.indexOf('app-quiz');
  if (quiz === -1) return rest.slice(0, FALLBACK_BLOCK_LENGTH);
  const end = rest[quiz + 1] === 'app-napkin' ? quiz + 2 : quiz + 1;
  return rest.slice(0, end);
}

/** The first two distinct devices after the chapter header, e.g. `napkin → remember`. */
function openingPair(sequence) {
  const start = sequence.indexOf('app-chapter') + 1;
  const distinct = [];
  for (const tag of sequence.slice(start)) {
    if (!distinct.includes(tag)) distinct.push(tag);
    if (distinct.length === 2) break;
  }
  return distinct.map((t) => t.replace(/^app-/, '')).join(' → ') || '(none)';
}

const lessons = readCurriculum()
  .filter((entry) => entry.written)
  .map((entry) => {
    const sequence = deviceSequence(readTemplate(entry));
    return {
      ...entry,
      sequence,
      block: openingBlock(sequence),
      pair: openingPair(sequence),
      devices: [...new Set(sequence)],
    };
  });

/** Findings, worst first: 1 missing lead, 2 forbidden device, 3 shared shape, 4 same opening. */
const findings = [];

for (const lesson of lessons) {
  if (!lesson.shape) continue;
  const rule = SHAPES[lesson.shape];
  if (!rule) {
    findings.push({
      severity: 1,
      id: lesson.id,
      text: `declares shape '${lesson.shape}', which has no built device set`,
    });
    continue;
  }
  if (!rule.lead(lesson.block)) {
    findings.push({
      severity: 1,
      id: lesson.id,
      text: `declares '${lesson.shape}' but its block has no ${rule.leadText}`,
    });
  }
  const forbidden = rule.forbid.filter((tag) => lesson.block.includes(tag));
  if (rule.notFirst && lesson.block[0] === rule.notFirst) forbidden.push(`${rule.notFirst} first`);
  if (forbidden.length) {
    findings.push({
      severity: 2,
      id: lesson.id,
      text: `'${lesson.shape}' block contains ${forbidden.join(', ')}`,
    });
  }
}

for (let i = 1; i < lessons.length; i++) {
  const prev = lessons[i - 1];
  const cur = lessons[i];
  if (prev.level !== cur.level) continue;
  if (cur.shape && cur.shape === prev.shape) {
    findings.push({
      severity: 3,
      id: cur.id,
      text: `shares shape '${cur.shape}' with the lesson before it, ${prev.id}`,
    });
  } else if (!cur.shape && !prev.shape && cur.pair === prev.pair) {
    findings.push({
      severity: 4,
      id: cur.id,
      text: `opens ${cur.pair}, same as ${prev.id}`,
    });
  }
}

findings.sort((a, b) => a.severity - b.severity);

const pairCounts = new Map();
for (const lesson of lessons) pairCounts.set(lesson.pair, (pairCounts.get(lesson.pair) ?? 0) + 1);
const topPairs = [...pairCounts.entries()].sort((a, b) => b[1] - a[1]);

const shapeCounts = new Map();
for (const lesson of lessons) {
  if (lesson.shape) shapeCounts.set(lesson.shape, (shapeCounts.get(lesson.shape) ?? 0) + 1);
}
const declared = lessons.filter((l) => l.shape).length;

const args = process.argv.slice(2);

if (args[0] === '--json') {
  console.log(
    JSON.stringify(
      {
        lessons: lessons.map(({ id, level, shape, pair, block, devices }) => ({
          id,
          level,
          shape: shape ?? null,
          pair,
          block,
          devices,
        })),
        findings,
        pairs: Object.fromEntries(topPairs),
      },
      null,
      2,
    ),
  );
} else if (args[0] === '--detail') {
  const found = lessons.filter((l) => l.id.includes(args[1] ?? ''));
  for (const l of found) {
    console.log(`\n${l.level}/${l.id}  shape: ${l.shape ?? '(undeclared)'}  opens: ${l.pair}`);
    console.log(`   block:    ${l.block.join(' → ') || '(empty)'}`);
    console.log(`   sequence: ${l.sequence.join(' → ')}`);
  }
  console.log();
} else {
  const failing = findings.filter((f) => f.severity <= 3);
  const warnings = findings.filter((f) => f.severity === 4);

  console.log(`\n  ${lessons.length} written lessons, ${declared} with a declared shape.`);
  for (const [shape, count] of shapeCounts) {
    console.log(`    ${shape.padEnd(20)} ${'█'.repeat(count)} ${count}`);
  }

  console.log(`\n  Most common openings (first two devices after the chapter header):`);
  for (const [pair, count] of topPairs.slice(0, 6)) {
    console.log(`    ${pair.padEnd(28)} ${String(count).padStart(3)}`);
  }

  if (failing.length) {
    console.log(
      `\n  ${failing.length} problem${failing.length === 1 ? '' : 's'} with declared shapes:`,
    );
    for (const f of failing) console.log(`    ✗  ${f.id}: ${f.text}`);
  } else if (declared) {
    console.log(
      `\n  ✓  every declared shape has its lead device, nothing it forbids, and a different neighbour.`,
    );
  }

  if (warnings.length) {
    console.log(
      `\n  ${warnings.length} undeclared lesson${warnings.length === 1 ? '' : 's'} open the same way as the lesson before:`,
    );
    for (const w of warnings) console.log(`    ·  ${w.id}: ${w.text}`);
  }
  console.log();

  process.exitCode = failing.length ? 1 : 0;
}
