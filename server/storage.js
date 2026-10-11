import { DatabaseSync } from 'node:sqlite';
import { AsyncLocalStorage } from 'node:async_hooks';
import pg from 'pg';

// Both drivers expose the same asynchronous prepared-statement interface.
export function sqliteStorage(path) {
  const connection = new DatabaseSync(path);
  let tail = Promise.resolve();
  return {
    kind: 'sqlite',
    prepare: (sql) => connection.prepare(sql),
    exec: (sql) => connection.exec(sql),
    close: () => connection.close(),
    async exclusive(task) {
      const next = tail.then(task, task);
      tail = next.catch(() => {});
      return next;
    },
    async transaction(task) {
      connection.exec('BEGIN IMMEDIATE');
      try {
        const result = await task();
        connection.exec('COMMIT');
        return result;
      } catch (error) {
        connection.exec('ROLLBACK');
        throw error;
      }
    },
  };
}

export function postgresStorage(connectionString) {
  const url = new URL(connectionString);
  if (['prefer', 'require', 'verify-ca'].includes(url.searchParams.get('sslmode')))
    url.searchParams.set('sslmode', 'verify-full');
  const pool = new pg.Pool({
    connectionString: url.toString(),
    max: 3,
    connectionTimeoutMillis: 15000,
    idleTimeoutMillis: 10000,
  });
  const scope = new AsyncLocalStorage();
  const query = (sql, values = []) => (scope.getStore() ?? pool).query(sql, values);
  const parameters = (sql) => {
    let i = 0;
    return sql.replace(/\?/g, () => `$${++i}`);
  };
  return {
    kind: 'postgres',
    prepare(sql) {
      const statement = parameters(sql);
      return {
        async get(...values) {
          return (await query(statement, values)).rows[0];
        },
        async all(...values) {
          return (await query(statement, values)).rows;
        },
        async run(...values) {
          return { changes: (await query(statement, values)).rowCount };
        },
      };
    },
    exec: (sql) => query(sql),
    close: () => pool.end(),
    exclusive: (task) => task(),
    async transaction(task) {
      const client = await pool.connect();
      try {
        return await scope.run(client, async () => {
          await client.query('BEGIN');
          try {
            const result = await task();
            await client.query('COMMIT');
            return result;
          } catch (error) {
            await client.query('ROLLBACK');
            throw error;
          }
        });
      } finally {
        client.release();
      }
    },
  };
}
