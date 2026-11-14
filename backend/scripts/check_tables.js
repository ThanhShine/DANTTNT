// Scan source files for SQL table references and flag ones not in the real DB.
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');

const ROOTS = [
  path.join(__dirname, '..', 'src'),
  path.join(__dirname, '..', '..', 'ai-service'),
  path.join(__dirname, '..', '..', 'vision-service'),
];
const EXT = /\.(ts|js|py)$/;
const SKIP = /node_modules|\.venv|venv|__pycache__|dist/;

function walk(dir, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const f of fs.readdirSync(dir)) {
    const p = path.join(dir, f);
    if (SKIP.test(p)) continue;
    const st = fs.statSync(p);
    if (st.isDirectory()) walk(p, out);
    else if (EXT.test(f)) out.push(p);
  }
  return out;
}

(async () => {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST, port: process.env.DB_PORT,
    user: process.env.DB_USER, password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  });
  const [rows] = await conn.query(
    'SELECT TABLE_NAME t FROM information_schema.TABLES WHERE TABLE_SCHEMA = ?', [process.env.DB_NAME]);
  await conn.end();
  const tables = new Set(rows.map(r => r.t));

  const re = /\b(?:FROM|JOIN|INTO|UPDATE)\s+`?([a-zA-Z_][a-zA-Z0-9_]*)`?/g;
  const ignore = new Set(['information_schema', 'dual', 'SET', 'the', 'a', 'an']);
  let bad = 0;
  for (const file of ROOTS.flatMap(r => walk(r))) {
    const lines = fs.readFileSync(file, 'utf8').split(/\r?\n/);
    lines.forEach((line, i) => {
      for (const m of line.matchAll(re)) {
        const t = m[1];
        if (tables.has(t) || ignore.has(t)) continue;
        if (!/_/.test(t) && t === t.toLowerCase() === false) continue;
        bad++;
        console.log(`${path.relative(path.join(__dirname, '..', '..'), file)}:${i + 1}  -> ${t}`);
      }
    });
  }
  console.log(`\nUnknown table refs: ${bad}`);
})().catch(e => { console.error('ERR', e.message); process.exit(1); });
