/**
 * Map mysql2 errors to HTTP responses so the API does not look like a generic 500 bug.
 */
export function sendDbError(res, err, fallbackMessage = 'Server error') {
  if (!err) {
    return res.status(500).json({ error: fallbackMessage });
  }

  if (err.code === 'ER_ACCESS_DENIED_ERROR') {
    return res.status(503).json({
      error:
        'Database login failed. Copy backend/.env.example to backend/.env and set MYSQL_USER and MYSQL_PASSWORD for your MySQL server.',
    });
  }

  if (err.code === 'ECONNREFUSED') {
    return res.status(503).json({
      error:
        'Cannot connect to MySQL. Start MySQL and check MYSQL_HOST / MYSQL_PORT in backend/.env.',
    });
  }

  if (err.code === 'ER_BAD_DB_ERROR') {
    return res.status(503).json({
      error:
        'Database does not exist. Create it with: mysql -u root -p < sql/schema.sql (from the pulse-shield folder).',
    });
  }

  if (typeof err.code === 'string' && err.code.startsWith('ER_')) {
    console.error(err);
    return res.status(503).json({
      error:
        'Database error. Check backend/.env (MYSQL_*), that MySQL is running, and that sql/schema.sql has been applied.',
    });
  }

  console.error(err);
  return res.status(500).json({ error: fallbackMessage });
}

/** True for errors thrown by mysql2 on failed queries / connections. */
export function isMysqlError(err) {
  if (!err) return false;
  if (err.code === 'ECONNREFUSED') return true;
  return typeof err.code === 'string' && err.code.startsWith('ER_');
}
