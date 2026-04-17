import pool from './database.js';

async function columnExists(tableName, columnName) {
  const [rows] = await pool.query(
    `SELECT COUNT(*) AS c
     FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME = ?
       AND COLUMN_NAME = ?`,
    [tableName, columnName]
  );
  return Number(rows[0]?.c || 0) > 0;
}

export async function bootstrapSchema() {
  if (!(await columnExists('users', 'role'))) {
    await pool.query("ALTER TABLE users ADD COLUMN role ENUM('user','admin') NOT NULL DEFAULT 'user'");
  }
  if (!(await columnExists('claims', 'claim_lat'))) {
    await pool.query('ALTER TABLE claims ADD COLUMN claim_lat DECIMAL(10, 7) NULL');
  }
  if (!(await columnExists('claims', 'claim_lng'))) {
    await pool.query('ALTER TABLE claims ADD COLUMN claim_lng DECIMAL(10, 7) NULL');
  }
}
