import { Pool, QueryResult, QueryResultRow } from 'pg';

const pool = new Pool({
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    host: 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_NAME,
});

export async function query<T extends QueryResultRow>(text: string, params?: unknown[]): Promise<QueryResult<T>> {
    try {
      const result = await pool.query(text, params);
      return result;
    } catch (error) {
      console.error('Error executing query:', error);
      throw error;
    }
}

process.on('SIGINT', () => {
    pool.end().then(() => {
      console.log('Database pool has ended');
      process.exit(0);
    });
});

export { pool };