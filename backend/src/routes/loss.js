import { Router } from 'express';
import pool from '../config/database.js';
import { authMiddleware } from '../middleware/auth.js';
import { predictIncome } from '../services/aiService.js';
import { computeLoss, shouldTriggerClaim } from '../services/lossDetectionService.js';
import { assessClaimFraud } from '../services/fraudService.js';
import { getDisruptionSnapshot } from '../services/disruptionService.js';

const router = Router();
router.use(authMiddleware);

/**
 * POST /detect-loss — predict expected income, compare to actual, optionally auto-claim.
 */
router.post('/detect-loss', async (req, res) => {
  try {
    const { date, mock_gps, auto_claim = true } = req.body;
    if (!date) {
      return res.status(400).json({ error: 'date is required (YYYY-MM-DD)' });
    }

    const target = new Date(date);
    if (Number.isNaN(target.getTime())) {
      return res.status(400).json({ error: 'Invalid date' });
    }

    const [users] = await pool.query(
      'SELECT location, platform, avg_daily_earnings FROM users WHERE id = ?',
      [req.user.id]
    );
    const user = users[0] || {};

    const [earnRows] = await pool.query(
      `SELECT actual_income, predicted_income FROM earnings WHERE user_id = ? AND date = ?`,
      [req.user.id, date]
    );
    if (!earnRows.length) {
      return res.status(400).json({
        error: 'No earnings record for this date. Add earnings first via POST /earnings/add',
      });
    }

    const actual_income = Number(earnRows[0].actual_income);

    const [history] = await pool.query(
      `SELECT date, actual_income FROM earnings
       WHERE user_id = ? AND date < ? ORDER BY date DESC LIMIT 60`,
      [req.user.id, date]
    );
    const past_earnings = history.map((r) => Number(r.actual_income)).reverse();

    const predicted_income = await predictIncome({
      past_earnings,
      day_of_week: target.getDay(),
      hour: 12,
      location: user.location || '',
      platform: user.platform || '',
      baseline: Number(user.avg_daily_earnings) || 0,
    });

    await pool.query(
      `UPDATE earnings SET predicted_income = ? WHERE user_id = ? AND date = ?`,
      [predicted_income, req.user.id, date]
    );

    const { loss } = computeLoss(predicted_income, actual_income);
    const disruption = getDisruptionSnapshot(user.location || '');
    const trigger = shouldTriggerClaim(loss);

    let claim = null;
    let notification = null;

    if (trigger && auto_claim) {
      const [hist] = await pool.query(
        `SELECT actual_income FROM earnings WHERE user_id = ? ORDER BY date DESC LIMIT 30`,
        [req.user.id]
      );
      const amounts = hist.map((r) => Number(r.actual_income)).filter((n) => n > 0);
      const sorted = [...amounts].sort((a, b) => a - b);
      const historicalMedian =
        sorted.length === 0
          ? 0
          : sorted.length % 2
            ? sorted[(sorted.length - 1) / 2]
            : (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2;

      const fraud = await assessClaimFraud(req.user.id, {
        mock_gps,
        reported_earnings_today: actual_income,
        predicted_income,
        actual_income,
        historicalMedian,
      });

      const [result] = await pool.query(
        `INSERT INTO claims (user_id, loss_amount, status, risk_score, predicted_income, actual_income, claim_date)
         VALUES (?, ?, 'pending', ?, ?, ?, ?)`,
        [req.user.id, loss, fraud.risk_score, predicted_income, actual_income, date]
      );

      claim = {
        id: result.insertId,
        loss_amount: loss,
        status: 'pending',
        risk_score: fraud.risk_score,
      };
      notification = {
        type: 'claim_triggered',
        message: `Income loss detected (${loss.toFixed(2)}). Claim #${result.insertId} opened.`,
      };
    }

    res.json({
      date,
      predicted_income,
      actual_income,
      loss,
      loss_threshold: Number(process.env.LOSS_THRESHOLD_AMOUNT) || 50,
      claim_triggered: trigger,
      disruption_context: disruption,
      claim,
      notification,
    });
  } catch (e) {
    console.error(e);
    const msg =
      e.code === 'ECONNREFUSED' || e.code === 'ETIMEDOUT'
        ? 'AI service unavailable'
        : e.message || 'Loss detection failed';
    res.status(502).json({ error: msg });
  }
});

export default router;
