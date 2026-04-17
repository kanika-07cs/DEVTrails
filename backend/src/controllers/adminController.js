import pool from '../config/database.js';
import { getFraudAlerts } from '../services/fraudAlertService.js';

export async function listAdminUsers(_req, res) {
  try {
    const [rows] = await pool.query(
      `SELECT id, name, email, role, location, platform, avg_daily_earnings, created_at
       FROM users ORDER BY created_at DESC`
    );
    res.json(rows);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
}

export async function listAdminClaims(_req, res) {
  try {
    const [rows] = await pool.query(
      `SELECT c.id, c.user_id, u.name, u.email, c.loss_amount, c.status, c.risk_score,
              c.claim_date, c.payout_reference, c.claim_lat, c.claim_lng, c.created_at
       FROM claims c
       JOIN users u ON u.id = c.user_id
       ORDER BY c.created_at DESC`
    );
    res.json(rows);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to fetch claims' });
  }
}

export async function adminApproveClaim(req, res) {
  try {
    const id = Number(req.params.id);
    const payoutReference = `ADMIN-UPI-${id}-${Date.now()}`;
    const [r] = await pool.query(
      "UPDATE claims SET status = 'approved', payout_reference = ? WHERE id = ? AND status = 'pending'",
      [payoutReference, id]
    );
    if (!r.affectedRows) return res.status(404).json({ error: 'Pending claim not found' });
    res.json({ id, status: 'approved', payout_reference: payoutReference });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to approve claim' });
  }
}

export async function adminRejectClaim(req, res) {
  try {
    const id = Number(req.params.id);
    const [r] = await pool.query(
      "UPDATE claims SET status = 'rejected' WHERE id = ? AND status = 'pending'",
      [id]
    );
    if (!r.affectedRows) return res.status(404).json({ error: 'Pending claim not found' });
    res.json({ id, status: 'rejected' });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to reject claim' });
  }
}

export async function adminAnalytics(_req, res) {
  try {
    const [[users]] = await pool.query('SELECT COUNT(*) AS total_users FROM users');
    const [[claims]] = await pool.query('SELECT COUNT(*) AS total_claims FROM claims');
    const [[payouts]] = await pool.query(
      "SELECT COALESCE(SUM(loss_amount), 0) AS total_payouts FROM claims WHERE status = 'approved'"
    );
    const alerts = await getFraudAlerts();
    res.json({
      total_users: Number(users.total_users),
      total_claims: Number(claims.total_claims),
      total_payouts: Number(payouts.total_payouts),
      fraud_alert_count: alerts.length,
      fraud_alerts: alerts,
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to load analytics' });
  }
}
