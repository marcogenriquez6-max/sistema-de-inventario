require('dotenv').config();
const { Pool } = require('pg');
const fs = require('fs');

async function main() {
  const pool = new Pool({
    host: process.env.DATABASE_HOST || 'localhost',
    port: Number(process.env.DATABASE_PORT || 5432),
    user: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASSWORD,
    database: process.env.DATABASE_NAME,
  });
  const file = process.argv[2];
  const sql = fs.readFileSync(file, 'utf8');
  await pool.query(sql);
  console.log('Migración aplicada:', file);
  const { rows } = await pool.query(
    `SELECT table_name FROM information_schema.tables WHERE table_schema='public' AND table_name='notifications'`,
  );
  console.log('Tabla notifications:', rows.length ? 'EXISTE' : 'FALTA');
  await pool.end();
}

main().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
