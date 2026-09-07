/**
 * Documentation audit — measures how much of `src/` carries the comments the
 * documentation pass in docs/BACKLOG.md §2.8 asks for.
 *
 * Two things are counted, because they are two different gaps:
 *
 *   1. Member-level JSDoc. Every class, method, property, accessor, function,
 *      interface (and each of its members), type alias, enum and top-level const
 *      in a non-spec `.ts` file either has a leading JSDoc block or it doesn't.
 *   2. File-level headers. A `/** … *\/` block *above the first import* that says
 *      what the file is for and how it relates to the rest of the app. Class
 *      JSDoc does not count here — it documents the class, not the file's place
 *      in the project — so a file can be 100% on (1) and still missing on (2).
 *
 * Like audit-retention.mjs, these are proxies: a present comment can still be
 * useless. Use the numbers to find what to read, not as the verdict.
 *
 *   node scripts/audit-docs.mjs             summary table + worst files
 *   node scripts/audit-docs.mjs --json      machine-readable
 *   node scripts/audit-docs.mjs --missing   every undocumented member, by file
 *   node scripts/audit-docs.mjs --headers   every file without a header
 */

import ts from 'typescript';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';

const ROOT = 'src';
const args = new Set(process.argv.slice(2));

/** Recursively collects every non-declaration `.ts` file under `dir`. */
function collect(dir, out = []) {
  for (const entry of readdirSync(dir)) {
    const p = join(dir, entry);
    if (statSync(p).isDirectory()) collect(p, out);
    else if (p.endsWith('.ts') && !p.endsWith('.d.ts')) out.push(p);
  }
  return out;
}

/** Path relative to the repo root with forward slashes, for stable output on Windows. */
const rel = (p) => relative('.', p).replaceAll(sep, '/');

/** True when a node carries at least one JSDoc block. */
const hasJsDoc = (node) => (ts.getJSDocCommentsAndTags(node) ?? []).length > 0;

/** Name of a class/interface member, or a placeholder for computed names. */
const memberName = (m) => (m.name && ts.isIdentifier(m.name) ? m.name.text : '(computed)');

const counts = {}; // kind -> { total, documented }
const missingByFile = {}; // file -> ["kind name", …]
const filesWithoutHeader = [];
let filesWithHeader = 0;

function record(kind, documented, file, name) {
  counts[kind] ??= { total: 0, documented: 0 };
  counts[kind].total++;
  if (documented) counts[kind].documented++;
  else (missingByFile[file] ??= []).push(`${kind} ${name}`);
}

const files = collect(ROOT);
for (const file of files) {
  const text = readFileSync(file, 'utf8');
  const sf = ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true);
  const path = rel(file);

  // (2) file header: a JSDoc block in the leading trivia of the first statement.
  const first = sf.statements[0];
  const ranges = first ? ts.getLeadingCommentRanges(text, first.getFullStart()) : null;
  const header = !!ranges?.some((r) => text.slice(r.pos, r.end).startsWith('/**'));
  if (header) filesWithHeader++;
  else filesWithoutHeader.push(path);

  // (1) members: skip specs, whose describe/it blocks are self-describing.
  if (/\.spec\.ts$/.test(file)) continue;

  const visit = (node) => {
    if (ts.isClassDeclaration(node)) {
      record('class', hasJsDoc(node), path, node.name?.text ?? '(anonymous)');
      for (const m of node.members) {
        if (ts.isMethodDeclaration(m)) record('method', hasJsDoc(m), path, memberName(m));
        else if (ts.isPropertyDeclaration(m)) record('property', hasJsDoc(m), path, memberName(m));
        else if (ts.isGetAccessor(m) || ts.isSetAccessor(m))
          record('accessor', hasJsDoc(m), path, memberName(m));
        else if (ts.isConstructorDeclaration(m))
          record('constructor', hasJsDoc(m), path, 'constructor');
      }
    } else if (ts.isFunctionDeclaration(node)) {
      record('function', hasJsDoc(node), path, node.name?.text ?? '(anonymous)');
    } else if (ts.isInterfaceDeclaration(node)) {
      record('interface', hasJsDoc(node), path, node.name.text);
      for (const m of node.members)
        record('interface-member', hasJsDoc(m), path, `${node.name.text}.${memberName(m)}`);
    } else if (ts.isTypeAliasDeclaration(node)) {
      record('type', hasJsDoc(node), path, node.name.text);
    } else if (ts.isEnumDeclaration(node)) {
      record('enum', hasJsDoc(node), path, node.name.text);
    } else if (ts.isVariableStatement(node) && node.parent === sf) {
      for (const d of node.declarationList.declarations)
        record(
          'top-level const',
          hasJsDoc(node),
          path,
          ts.isIdentifier(d.name) ? d.name.text : '(pattern)',
        );
    }
    ts.forEachChild(node, visit);
  };
  visit(sf);
}

const totalMissing = Object.values(counts).reduce((n, c) => n + c.total - c.documented, 0);

if (args.has('--json')) {
  console.log(
    JSON.stringify(
      {
        files: files.length,
        filesWithHeader,
        filesWithoutHeader,
        counts,
        totalMissing,
        missingByFile,
      },
      null,
      2,
    ),
  );
} else if (args.has('--missing')) {
  for (const [f, list] of Object.entries(missingByFile).sort((a, b) => b[1].length - a[1].length)) {
    console.log(`\n${f} (${list.length})`);
    for (const l of list) console.log('  ' + l);
  }
} else if (args.has('--headers')) {
  for (const f of filesWithoutHeader) console.log(f);
} else {
  console.log(
    `files: ${files.length}   with a file header: ${filesWithHeader}   without: ${filesWithoutHeader.length}\n`,
  );
  console.log('kind                 total  documented  missing');
  for (const [k, v] of Object.entries(counts).sort((a, b) => b[1].total - a[1].total)) {
    const miss = v.total - v.documented;
    console.log(
      `${k.padEnd(20)} ${String(v.total).padStart(5)}  ${String(v.documented).padStart(10)}  ${String(miss).padStart(7)}`,
    );
  }
  console.log(`\nundocumented members (non-spec files): ${totalMissing}\n`);
  console.log('worst files:');
  for (const [f, list] of Object.entries(missingByFile)
    .sort((a, b) => b[1].length - a[1].length)
    .slice(0, 12))
    console.log(`${String(list.length).padStart(4)}  ${f}`);
}
