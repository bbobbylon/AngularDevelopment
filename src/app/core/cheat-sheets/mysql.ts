import type { CheatSheet } from './cheat-sheet.model';

/** MySQL — install, connect, and the queries you run every day. */
export const MYSQL_SHEET: CheatSheet = {
  id: 'mysql',
  title: 'MySQL',
  icon: '🐬',
  tagline: 'Zero to a running database, from install to your first query.',
  category: 'database',
  intro:
    "MySQL is the default relational database for this app's Spring Boot backend recipe. This " +
    'sheet covers getting a local server running, connecting to it, and the SQL you write most ' +
    'often once a table exists.',
  sections: [
    {
      title: 'Install & connect',
      blocks: [
        {
          kind: 'commands',
          lang: 'bash',
          rows: [
            {
              code: 'brew install mysql',
              note: 'macOS, via Homebrew. Linux: use your package manager (e.g. "apt install mysql-server").',
            },
            {
              code: 'brew services start mysql',
              note: 'Starts the server as a background service.',
            },
            {
              code: 'mysql -u root -p',
              note: 'Opens an interactive shell as root, prompting for the password.',
            },
            {
              code: 'mysqladmin -u root -p status',
              note: 'Confirms the server is up without opening a full shell.',
            },
          ],
        },
      ],
    },
    {
      title: 'Daily commands',
      intro: 'Run inside the `mysql` shell once connected. Every statement ends in a semicolon.',
      blocks: [
        {
          kind: 'commands',
          lang: 'sql',
          rows: [
            { code: 'SHOW DATABASES;', note: 'Lists every database the current user can see.' },
            {
              code: 'USE app_db;',
              note: 'Switches the active database for the rest of the session.',
            },
            { code: 'SHOW TABLES;', note: 'Lists tables in the active database.' },
            { code: 'DESCRIBE users;', note: "Shows a table's columns, types, and keys." },
            {
              code: 'SELECT * FROM users LIMIT 10;',
              note: 'Always LIMIT an exploratory SELECT — a table can be a lot bigger than you expect.',
            },
          ],
        },
      ],
    },
    {
      title: 'Creating a table',
      intro: "The shape this app's own backend recipe uses: idempotent, no destructive DDL.",
      blocks: [
        {
          kind: 'code',
          title: 'schema.sql',
          lang: 'sql',
          code: `CREATE TABLE IF NOT EXISTS users (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);`,
          note:
            '"IF NOT EXISTS" makes the script safe to run more than once — no error on a table that is ' +
            'already there, and never a DROP in sight.',
        },
        {
          kind: 'tip',
          tone: 'warn',
          text:
            'There is no undo for DROP TABLE or DROP DATABASE. Take a "mysqldump" backup before any ' +
            'destructive change to data you cannot afford to lose.',
        },
      ],
    },
    {
      title: 'Backups',
      blocks: [
        {
          kind: 'commands',
          lang: 'bash',
          rows: [
            {
              code: 'mysqldump -u root -p app_db > backup.sql',
              note: 'Dumps one database to a plain-SQL file.',
            },
            {
              code: 'mysql -u root -p app_db < backup.sql',
              note: 'Restores it — runs the dump file as a script against an existing (empty) database.',
            },
          ],
        },
      ],
    },
    {
      title: 'Common column types',
      blocks: [
        {
          kind: 'table',
          headers: ['Type', 'Use it for'],
          rows: [
            ['VARCHAR(n)', 'Short text with a known max length — emails, names, slugs.'],
            ['TEXT', 'Long, unbounded text — a blog body, a free-form note.'],
            [
              'INT / BIGINT',
              'Whole numbers. Use BIGINT for an auto-increment primary key that will grow large.',
            ],
            [
              'DECIMAL(p, s)',
              'Exact money/quantity values — never FLOAT/DOUBLE for currency, they round.',
            ],
            ['BOOLEAN', 'True/false flags (stored as a TINYINT(1) under the hood).'],
            [
              'TIMESTAMP',
              'A point in time that should auto-update or default to "now" — created_at/updated_at.',
            ],
            ['DATE', 'A calendar date with no time component — a birthday, a due date.'],
          ],
        },
      ],
    },
  ],
};
