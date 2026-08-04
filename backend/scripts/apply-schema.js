require('dotenv').config();
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

async function waitForDatabase(pool, attempts = 30, delayMs = 2000) {
  let attempt = 0;
  while (attempt < attempts) {
    attempt += 1;
    try {
      await pool.query('SELECT 1');
      return;
    } catch (error) {
      console.warn(
        `Postgres no disponible, reintentando ${attempt}/${attempts}...`,
      );
      if (attempt >= attempts) {
        throw error;
      }
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }
}

async function main() {
  const pool = new Pool({
    host: process.env.DATABASE_HOST || 'localhost',
    port: Number(process.env.DATABASE_PORT || 5432),
    user: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASSWORD,
    database: process.env.DATABASE_NAME,
  });

  await waitForDatabase(
    pool,
    Number(process.env.DATABASE_RETRY_ATTEMPTS || 30),
    Number(process.env.DATABASE_RETRY_DELAY || 2000),
  );

  const base = path.resolve(__dirname, '..', '..', 'database');
  const files = ['schema.sql', 'schema-erp.sql', 'seed.sql'];
  for (const f of files) {
    const full = path.join(base, f);
    if (!fs.existsSync(full)) {
      console.error('No existe el archivo SQL:', full);
      process.exit(1);
    }
    const sql = fs.readFileSync(full, 'utf8');
    console.log('Aplicando', f);
    await pool.query(sql);
  }
  console.log('Esquema + seed aplicados correctamente');
  await pool.end();
}

main().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
