import { Router } from 'express';
import pool from '../config/database.js';
import { authMiddleware } from '../middleware/auth.js';
import { predictIncome } from '../services/aiService.js';

const router = Router();
router.use(authMiddleware);

/**
 * POST /predict-income — proxies to Python with past series + context.
 */
router.post('/predict-income', async (req, res) => {
  try {
    const { date, location_override } = req.body;
    const target = date ? new Date(date) : new Date();
    if (Number.isNaN(target.getTime())) {
      return res.status(400).json({ error: 'Invalid date' });
    }

    const [users] = await pool.query(
      'SELECT location, platform, avg_daily_earnings FROM users WHERE id = ?',
      [req.user.id]
    );
    const user = users[0] || {};

    const [history] = await pool.query(
      `SELECT date, actual_income FROM earnings
       WHERE user_id = ? ORDER BY date DESC LIMIT 60`,
      [req.user.id]
    );

    const past_earnings = history
      .map((r) => Number(r.actual_income))
      .reverse();

    const predicted_income = await predictIncome({
      past_earnings,
      day_of_week: target.getDay(),
      hour: target.getHours(),
      location: location_override || user.location || '',
      platform: user.platform || '',
      baseline: Number(user.avg_daily_earnings) || 0,
    });

    res.json({
      predicted_income,
      day_of_week: target.getDay(),
      hour: target.getHours(),
      past_samples_used: past_earnings.length,
    });
  } catch (e) {
    console.error(e);
    const msg =
      e.code === 'ECONNREFUSED' || e.code === 'ETIMEDOUT'
        ? 'AI service unavailable'
        : e.message || 'Prediction failed';
    res.status(502).json({ error: msg });
  }
});

export default router;
