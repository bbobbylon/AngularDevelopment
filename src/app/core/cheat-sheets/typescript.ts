import type { CheatSheet } from './cheat-sheet.model';

/** TypeScript — install, configure, compile, and the flags that matter most. */
export const TYPESCRIPT_SHEET: CheatSheet = {
  id: 'typescript',
  title: 'TypeScript',
  icon: '🔷',
  tagline: 'Zero to a compiled, type-checked project.',
  category: 'language',
  intro:
    'TypeScript compiles to plain JavaScript, so the only new tool is the compiler itself, `tsc`, ' +
    'and the config file it reads. This sheet covers getting a project checking correctly — the ' +
    "language itself is covered by this app's TypeScript curriculum.",
  sections: [
    {
      title: 'Install & init',
      blocks: [
        {
          kind: 'commands',
          lang: 'bash',
          rows: [
            {
              code: 'npm install -D typescript',
              note: 'Installs the compiler as a dev dependency (preferred over a global install, so every project pins its own version).',
            },
            {
              code: 'npx tsc --init',
              note: 'Writes a starter tsconfig.json with the common options commented in.',
            },
            { code: 'npx tsc', note: 'Compiles the project per tsconfig.json.' },
            {
              code: 'npx tsc --watch',
              note: 'Recompiles on every save — the equivalent of a dev-server loop for a plain TS project.',
            },
          ],
        },
      ],
    },
    {
      title: 'A sane starting tsconfig.json',
      intro:
        'The options that matter most for a new project — everything else has a reasonable default.',
      blocks: [
        {
          kind: 'code',
          title: 'tsconfig.json',
          lang: 'json',
          code: `{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "outDir": "dist",
    "rootDir": "src"
  },
  "include": ["src"]
}`,
          note:
            '"strict" alone turns on strictNullChecks, noImplicitAny and six other checks together — ' +
            'that single flag is most of what "being strict" means in practice.',
        },
        {
          kind: 'tip',
          tone: 'tip',
          text:
            'Turn "strict" on from day one. It is a small, steady tax to write against; retrofitting it ' +
            'onto a large codebase later means fixing every implicit-any and unchecked-null the compiler ' +
            'was previously letting through, all at once.',
        },
      ],
    },
    {
      title: 'Daily commands',
      blocks: [
        {
          kind: 'commands',
          lang: 'bash',
          rows: [
            {
              code: 'tsc --noEmit',
              note: 'Type-check only, write no .js files — the command a CI pipeline or a "typecheck" npm script should run.',
            },
            {
              code: 'tsc -p tsconfig.build.json',
              note: 'Compile using a specific config file, when a project keeps more than one (e.g. one for the app, one for tests).',
            },
            {
              code: 'npx ts-node src/script.ts',
              note: 'Runs a .ts file directly, compiling in-memory — handy for one-off scripts.',
            },
          ],
        },
        {
          kind: 'tip',
          tone: 'gotcha',
          text:
            'Plain `tsc` (no flags) still emits .js files even when there are type errors, unless ' +
            '"noEmitOnError": true is set. A build script that just runs `tsc` can silently ship broken ' +
            'types — use `tsc --noEmit` as a separate check step, or set noEmitOnError.',
        },
      ],
    },
    {
      title: 'Compiler flags worth knowing',
      blocks: [
        {
          kind: 'table',
          headers: ['Flag', 'What it does'],
          rows: [
            [
              'strict',
              'Enables the full strict-mode family (null checks, implicit any, etc.) in one switch.',
            ],
            ['target', 'The JS language level to compile down to (e.g. ES2022, ES5).'],
            [
              'module',
              'The module output format (ESNext, CommonJS, …) — must match how your runtime loads code.',
            ],
            [
              'moduleResolution',
              'How import paths are resolved. "bundler" matches how Vite/webpack/esbuild resolve today.',
            ],
            [
              'skipLibCheck',
              'Skips type-checking .d.ts files from node_modules — much faster, and you rarely own those bugs.',
            ],
            [
              'declaration',
              'Emits matching .d.ts files — needed when you are publishing a library for others to import.',
            ],
            [
              'sourceMap',
              'Emits .map files so a debugger can step through the original .ts, not the compiled .js.',
            ],
          ],
        },
      ],
    },
  ],
};
