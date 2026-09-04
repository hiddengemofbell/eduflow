const { Pool } = require('pg');

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.warn('DATABASE_URL is not configured. Database requests will fail until it is set.');
}

const pool = new Pool({
  connectionString: databaseUrl,
  ssl: databaseUrl ? { rejectUnauthorized: false } : undefined,
  max: 5,
  idleTimeoutMillis: 10_000,
  connectionTimeoutMillis: 10_000
});

const assertDatabaseConfigured = () => {
  if (!databaseUrl) {
    throw new Error('DATABASE_URL must be configured for persistent storage.');
  }
};

// The route layer uses SQLite-style placeholders. Convert them at the
// database boundary so route queries stay parameterized for Postgres.
const toPostgresPlaceholders = (sql) => {
  let index = 0;
  return sql.replace(/\?/g, () => `$${++index}`);
};

const initDb = async () => {
  assertDatabaseConfigured();
  await pool.query('SELECT 1');
  console.log('Postgres database connection initialized successfully.');
};

const query = async (sql, params = []) => {
  assertDatabaseConfigured();
  const result = await pool.query(toPostgresPlaceholders(sql), params);
  return result.rows;
};

const getOne = async (sql, params = []) => {
  const rows = await query(sql, params);
  return rows[0] || null;
};

const run = async (sql, params = []) => {
  assertDatabaseConfigured();
  let statement = toPostgresPlaceholders(sql);
  const isInsert = /^\s*insert\s+/i.test(statement);

  if (isInsert && !/\breturning\b/i.test(statement)) {
    statement = `${statement.trim()} RETURNING id`;
  }

  const result = await pool.query(statement, params);
  return {
    id: result.rows[0]?.id || null,
    changes: result.rowCount
  };
};

module.exports = {
  initDb,
  query,
  getOne,
  run
};
