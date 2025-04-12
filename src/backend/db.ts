import mysql from 'mysql2/promise';

const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost', // ensure you set DB_HOST if needed
    port: Number(process.env.DB_PORT) || 3306,  // default MySQL port
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    connectionLimit: 50, // adjust as necessary
});

export async function query<T = unknown>(sql: string, params?: unknown[]): Promise<T> {
    try {
        const [results] = await pool.execute(sql, params);
        return results as T;
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
