// Temporary doc-coverage audit. Uses the TS compiler API so declarations inside
// template-literal code samples (practice-data.ts etc.) are never counted.
import ts from 'typescript';
import { readFileSync, writeFileSync } from 'node:fs';
import { globSync } from 'node:fs';

const files = globSync('src/**/*.ts').filter((f) => !f.endsWith('.spec.ts'));
const rows = [];

for (const file of files) {
  const text = readFileSync(file, 'utf8');
  const sf = ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true);
  const gaps = [];

  function hasDoc(node) {
    return (ts.getJSDocCommentsAndTags(node) ?? []).length > 0;
  }

  function name(node) {
    return node.name?.getText?.(sf) ?? '<anon>';
  }

  function visit(node) {
    let kind = null;
    if (ts.isFunctionDeclaration(node) && node.name) kind = 'function';
    else if (ts.isClassDeclaration(node) && node.name) kind = 'class';
    else if (ts.isInterfaceDeclaration(node)) kind = 'interface';
    else if (ts.isTypeAliasDeclaration(node)) kind = 'type';
    else if (ts.isEnumDeclaration(node)) kind = 'enum';
    else if (ts.isMethodDeclaration(node)) kind = 'method';
    else if (ts.isGetAccessorDeclaration(node)) kind = 'getter';
    else if (ts.isSetAccessorDeclaration(node)) kind = 'setter';
    else if (ts.isConstructorDeclaration(node) && node.body) kind = 'constructor';
    else if (ts.isPropertyDeclaration(node)) kind = 'property';
    else if (
      ts.isVariableStatement(node) &&
      node.modifiers?.some((m) => m.kind === ts.SyntaxKind.ExportKeyword)
    )
      kind = 'exported-const';

    if (kind) {
      const target = kind === 'exported-const' ? node : node;
      if (!hasDoc(target)) {
        const line = sf.getLineAndCharacterOfPosition(node.getStart(sf)).line + 1;
        const label =
          kind === 'exported-const'
            ? node.declarationList.declarations.map((d) => d.name.getText(sf)).join(', ')
            : name(node);
        gaps.push({ kind, label, line });
      }
    }
    ts.forEachChild(node, visit);
  }
  ts.forEachChild(sf, visit);
  if (gaps.length) rows.push({ file, gaps });
}

const total = rows.reduce((n, r) => n + r.gaps.length, 0);
rows.sort((a, b) => b.gaps.length - a.gaps.length);
writeFileSync('doc-audit.json', JSON.stringify({ total, rows }, null, 2));
console.log(`undocumented declarations: ${total} across ${rows.length} files`);
for (const r of rows.slice(0, 40)) console.log(`${String(r.gaps.length).padStart(4)}  ${r.file}`);
