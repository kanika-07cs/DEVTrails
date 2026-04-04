import { Router } from 'express';
import pool from '../config/database.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();
router.use(authMiddleware);

router.post('/add', async (req, res) => {
  try {
    const { date, actual_income, predicted_income } = req.body;
    if (!date || actual_income == null) {
      return res.status(400).json({ error: 'date and actual_income are required' });
    }

    await pool.query(
      `INSERT INTO earnings (user_id, date, actual_income, predicted_income)
       VALUES (?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         actual_income = VALUES(actual_income),
         predicted_income = COALESCE(VALUES(predicted_income), predicted_income)`,
      [
        req.user.id,
        date,
        Number(actual_income),
        predicted_income != null ? Number(predicted_income) : null,
      ]
    );

    const [rows] = await pool.query(
      `SELECT id, user_id, date, actual_income, predicted_income FROM earnings
       WHERE user_id = ? AND date = ?`,
      [req.user.id, date]
    );
    res.status(201).json(rows[0]);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to save earnings' });
  }
});

router.get('/history', async (req, res) => {
  try {
    const limit = Math.min(Number(req.query.limit) || 90, 365);
    const [rows] = await pool.query(
      `SELECT id, date, actual_income, predicted_income, created_at
       FROM earnings WHERE user_id = ?
       ORDER BY date DESC
       LIMIT ?`,
      [req.user.id, limit]
    );
    res.json(rows);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to load history' });
  }
});

export default router;
