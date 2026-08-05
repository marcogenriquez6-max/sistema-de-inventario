// Bootstrap idempotente de la base de datos (usado en Render/arranque).
// Aplica schema + ERP + seed SOLO la primera vez (tabla `users` inexistente)
// y ejecuta las migraciones siempre (son idempotentes).
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const CANDIDATE_DIRS = [
  path.resolve(__dirname, '..', '..', 'database'),
  path.resolve(__dirname, '..', 'database'),
  path.join(process.cwd(), 'database'),
  '/database',
];
const DB_DIR = CANDIDATE_DIRS.find((c) => fs.existsSync(c)) ?? CANDIDATE_DIRS[0];

async function waitForDatabase(pool, attempts = 30, delayMs = 2000) {
  let attempt = 0;
  while (attempt < attempts) {
    attempt += 1;
    try {
      await pool.query('SELECT 1');
      return;
    } catch (error) {
      console.warn(`[bootstrap] Postgres no disponible, reintentando ${attempt}/${attempts}...`);
      if (attempt >= attempts) throw error;
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }
}

async function tableExists(pool, table) {
  const { rows } = await pool.query(
    `SELECT to_regclass('public.${table}') AS t`,
  );
  return rows[0].t !== null;
}

async function applyFile(pool, file, label) {
  const sql = fs.readFileSync(file, 'utf8');
  console.log(`[bootstrap] Aplicando ${label}...`);
  await pool.query(sql);
}

async function main() {
  const pool = new Pool({
    host: process.env.DATABASE_HOST || 'localhost',
    port: Number(process.env.DATABASE_PORT || 5432),
    user: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASSWORD,
    database: process.env.DATABASE_NAME,
    connectionTimeoutMillis: 30000,
  });

  await waitForDatabase(pool);

  if (!(await tableExists(pool, 'users'))) {
    console.log('[bootstrap] Base vacía: aplicando esquema + seed');
    for (const f of ['schema.sql', 'schema-erp.sql', 'seed.sql']) {
      await applyFile(pool, path.join(DB_DIR, f), f);
    }
  } else {
    console.log('[bootstrap] Esquema ya presente, se omite schema/seed');
  }

  const migrationsDir = path.join(DB_DIR, 'migrations');
  if (fs.existsSync(migrationsDir)) {
    const files = fs
      .readdirSync(migrationsDir)
      .filter((f) => f.endsWith('.sql'))
      .sort();
    for (const f of files) {
      await applyFile(pool, path.join(migrationsDir, f), `migrations/${f}`);
    }
  }

  console.log('[bootstrap] Base de datos lista');
  await pool.end();
}

main().catch((e) => {
  console.error('[bootstrap] ERROR:', e.message);
  process.exit(1);
});
