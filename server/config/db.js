const { Pool } = require('pg');

const databaseUrl = process.env.DATABASE_URL;

const getDatabaseConfigurationError = () => {
  if (!databaseUrl) {
    return 'DATABASE_URL must be configured for persistent storage.';
  }

  try {
    const parsed = new URL(databaseUrl);
    if (!['postgres:', 'postgresql:'].includes(parsed.protocol)) {
      return 'DATABASE_URL must use the postgres or postgresql protocol.';
    }
    if (!parsed.hostname || !parsed.username || !parsed.password) {
      return 'DATABASE_URL must include a database host, username, and password.';
    }
  } catch (error) {
    return 'DATABASE_URL is not a valid PostgreSQL connection URL.';
  }

  return null;
};

const databaseConfigurationError = getDatabaseConfigurationError();

if (databaseConfigurationError) {
  console.warn(`${databaseConfigurationError} Database requests will fail until it is corrected.`);
}

let isLocalDatabase = false;
if (!databaseConfigurationError) {
  const { hostname } = new URL(databaseUrl);
  isLocalDatabase = hostname === 'localhost' || hostname === '127.0.0.1';
}

const pool = new Pool({
  connectionString: databaseUrl,
  ssl: databaseUrl && !isLocalDatabase ? { rejectUnauthorized: false } : undefined,
  max: 5,
  idleTimeoutMillis: 10_000,
  connectionTimeoutMillis: 10_000
});

const assertDatabaseConfigured = () => {
  if (databaseConfigurationError) {
    throw new Error(databaseConfigurationError);
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

const createExecutor = (database) => {
  const query = async (sql, params = []) => {
    assertDatabaseConfigured();
    const result = await database.query(toPostgresPlaceholders(sql), params);
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

    const result = await database.query(statement, params);
    return {
      id: result.rows[0]?.id || null,
      changes: result.rowCount
    };
  };

  return { query, getOne, run };
};

const { query, getOne, run } = createExecutor(pool);

const transaction = async (work) => {
  assertDatabaseConfigured();
  const client = await pool.connect();

  try {
    await client.query('BEGIN');
    const result = await work(createExecutor(client));
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

module.exports = {
  initDb,
  query,
  getOne,
  run,
  transaction
};
