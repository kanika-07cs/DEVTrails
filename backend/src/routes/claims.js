import { Router } from 'express';
import pool from '../config/database.js';
import { authMiddleware } from '../middleware/auth.js';
import { assessClaimFraud } from '../services/fraudService.js';
import { simulateUpiPayout } from '../services/payoutService.js';

const router = Router();
router.use(authMiddleware);

function buildClaimExplanation(row) {
  const parts = [];
  if (row.risk_score === 'high') {
    parts.push('High anomaly pattern detected.');
  } else if (row.risk_score === 'medium') {
    parts.push('Some inconsistency detected.');
  } else {
    parts.push('Behavior pattern appears consistent.');
  }

  if (row.predicted_income != null && row.actual_income != null) {
    const gap = Math.max(0, Number(row.predicted_income) - Number(row.actual_income));
    parts.push(`Estimated opportunity gap: ${gap.toFixed(2)}.`);
  }

  if (row.status === 'approved') {
    parts.push('Payout path completed.');
  } else if (row.status === 'pending') {
    parts.push('Awaiting simulated review decision.');
  } else {
    parts.push('Marked rejected in simulation.');
  }
  return parts.join(' ');
}

router.get('/claims', async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT id, loss_amount, status, risk_score, predicted_income, actual_income, claim_date,
              payout_reference, created_at
       FROM claims WHERE user_id = ?
       ORDER BY created_at DESC`,
      [req.user.id]
    );
    res.json(
      rows.map((row) => ({
        ...row,
        explanation: buildClaimExplanation(row),
      }))
    );
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to load claims' });
  }
});

router.post('/claim/create', async (req, res) => {
  try {
    const {
      claim_date,
      loss_amount,
      predicted_income,
      actual_income,
      mock_gps,
    } = req.body;

    if (!claim_date || loss_amount == null) {
      return res.status(400).json({ error: 'claim_date and loss_amount are required' });
    }

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

    const [todayRow] = await pool.query(
      `SELECT actual_income FROM earnings WHERE user_id = ? AND date = ?`,
      [req.user.id, claim_date]
    );
    const reportedToday =
      todayRow[0] != null ? Number(todayRow[0].actual_income) : Number(actual_income);

    const fraud = await assessClaimFraud(req.user.id, {
      mock_gps,
      reported_earnings_today: reportedToday,
      predicted_income: predicted_income != null ? Number(predicted_income) : null,
      actual_income: actual_income != null ? Number(actual_income) : reportedToday,
      historicalMedian,
    });

    const [result] = await pool.query(
      `INSERT INTO claims
       (user_id, loss_amount, status, risk_score, predicted_income, actual_income, claim_lat, claim_lng, claim_date)
       VALUES (?, ?, 'pending', ?, ?, ?, ?, ?, ?)`,
      [
        req.user.id,
        Number(loss_amount),
        fraud.risk_score,
        predicted_income != null ? Number(predicted_income) : null,
        actual_income != null ? Number(actual_income) : reportedToday,
        mock_gps?.curr_lat ?? null,
        mock_gps?.curr_lng ?? null,
        claim_date,
      ]
    );

    res.status(201).json({
      id: result.insertId,
      loss_amount: Number(loss_amount),
      status: 'pending',
      risk_score: fraud.risk_score,
      fraud_numeric_hint: fraud.numericScore,
      claim_date,
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to create claim' });
  }
});

/**
 * Simulated ops approval + UPI payout (demo).
 */
router.post('/claims/:id/payout-simulate', async (req, res) => {
  try {
    const id = Number(req.params.id);
    const [rows] = await pool.query(
      `SELECT id, user_id, loss_amount, status FROM claims WHERE id = ? AND user_id = ?`,
      [id, req.user.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Claim not found' });
    const claim = rows[0];
    if (claim.status !== 'pending') {
      return res.status(400).json({ error: 'Claim is not pending' });
    }

    const payout = simulateUpiPayout({
      claimId: claim.id,
      userId: req.user.id,
      amount: claim.loss_amount,
    });

    await pool.query(
      `UPDATE claims SET status = 'approved', payout_reference = ? WHERE id = ?`,
      [payout.upi_reference, id]
    );

    res.json({ claim_id: id, status: 'approved', payout });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Payout simulation failed' });
  }
});

router.post('/claims/:id/reject-simulate', async (req, res) => {
  try {
    const id = Number(req.params.id);
    const [r] = await pool.query(
      `UPDATE claims SET status = 'rejected' WHERE id = ? AND user_id = ? AND status = 'pending'`,
      [id, req.user.id]
    );
    if (r.affectedRows === 0) {
      return res.status(400).json({ error: 'Cannot reject claim' });
    }
    res.json({ claim_id: id, status: 'rejected' });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to reject claim' });
  }
});

export default router;
