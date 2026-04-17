import '../loadEnv.js';
import mysql from 'mysql2/promise';

const isProduction = process.env.NODE_ENV === 'production';
const mysqlUrl = process.env.MYSQL_URL || process.env.DATABASE_URL;
const useSsl = process.env.MYSQL_SSL === 'true';

let pool;

if (mysqlUrl) {
  pool = mysql.createPool({
    uri: mysqlUrl,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    ssl: useSsl ? { rejectUnauthorized: false } : undefined,
  });
} else {
  if (isProduction && !process.env.MYSQL_HOST) {
    throw new Error(
      'Missing DB config in production. Set MYSQL_URL (recommended) or MYSQL_HOST/MYSQL_PORT/MYSQL_USER/MYSQL_PASSWORD/MYSQL_DATABASE.'
    );
  }

  pool = mysql.createPool({
    host: process.env.MYSQL_HOST || '127.0.0.1',
    port: Number(process.env.MYSQL_PORT) || 3306,
    user: process.env.MYSQL_USER || 'root',
    password: process.env.MYSQL_PASSWORD || '',
    database: process.env.MYSQL_DATABASE || 'pulse_shield',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    ssl: useSsl ? { rejectUnauthorized: false } : undefined,
  });
}

export default pool;
