import { Router } from 'express';
import pool from '../config/database.js';
import { authMiddleware } from '../middleware/auth.js';
import { getDisruptionSnapshot } from '../services/disruptionService.js';

const router = Router();
router.use(authMiddleware);

function avg(values) {
  if (!values.length) return 0;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

function clamp(min, value, max) {
  return Math.max(min, Math.min(max, value));
}

function riskMix(rows) {
  const total = rows.length || 1;
  return {
    low: rows.filter((r) => r.risk_score === 'low').length / total,
    medium: rows.filter((r) => r.risk_score === 'medium').length / total,
    high: rows.filter((r) => r.risk_score === 'high').length / total,
  };
}

function generateRecommendations({ disruption, variance, claimRiskMix, claimRate }) {
  const tips = [];

  if (disruption.combined_disruption_score > 0.75) {
    tips.push('Prioritize shorter delivery zones and avoid peak congestion windows today.');
  }
  if (variance > 0.3) {
    tips.push('Income volatility is high - spread shifts across lunch and dinner for stability.');
  }
  if (claimRiskMix.high > 0.25) {
    tips.push('High-risk claims are elevated - keep GPS and activity logs consistent before filing.');
  }
  if (claimRate > 0.35) {
    tips.push('Frequent claim behavior detected - add more earnings days to strengthen baseline.');
  }

  if (!tips.length) {
    tips.push('Risk posture looks healthy - continue regular earnings updates to improve AI accuracy.');
  }
  return tips;
}

router.get('/insights/overview', async (req, res) => {
  try {
    const [users] = await pool.query(
      'SELECT location, platform, avg_daily_earnings FROM users WHERE id = ?',
      [req.user.id]
    );
    const user = users[0] || {};

    const [earnings] = await pool.query(
      `SELECT date, actual_income, predicted_income
       FROM earnings
       WHERE user_id = ?
       ORDER BY date DESC
       LIMIT 30`,
      [req.user.id]
    );

    const [claims] = await pool.query(
      `SELECT status, risk_score, loss_amount
       FROM claims
       WHERE user_id = ?
       ORDER BY created_at DESC
       LIMIT 20`,
      [req.user.id]
    );

    const disruption = getDisruptionSnapshot(user.location || '');
    const actuals = earnings.map((e) => Number(e.actual_income || 0)).filter((n) => n >= 0);
    const baseline = Number(user.avg_daily_earnings || 0) || avg(actuals) || 1;
    const actualAvg = avg(actuals);
    const variance = clamp(0, Math.abs(actualAvg - baseline) / baseline, 1);
    const claimRate = earnings.length > 0 ? claims.length / earnings.length : 0;
    const mix = riskMix(claims);
    const approvalRate =
      claims.length > 0 ? claims.filter((c) => c.status === 'approved').length / claims.length : 0;

    // Weighted to reward consistency while accounting for disruption and fraud posture.
    const resilienceScore = Math.round(
      clamp(
        0,
        100 *
          (1 -
            0.4 * disruption.combined_disruption_score -
            0.25 * variance -
            0.2 * mix.high -
            0.15 * claimRate +
            0.1 * approvalRate),
        100
      )
    );

    res.json({
      profile: {
        location: user.location || '',
        platform: user.platform || '',
        baseline_daily_income: baseline,
      },
      kpis: {
        resilience_score: resilienceScore,
        disruption_score: disruption.combined_disruption_score,
        avg_actual_income_30d: actualAvg,
        recent_claim_rate: claimRate,
        claim_approval_rate: approvalRate,
        risk_mix: mix,
      },
      disruption,
      recommendations: generateRecommendations({
        disruption,
        variance,
        claimRiskMix: mix,
        claimRate,
      }),
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to build insights overview' });
  }
});

router.post('/insights/simulate', async (req, res) => {
  try {
    const { what_if_actual_income, event = 'heavy_rain' } = req.body;
    if (what_if_actual_income == null) {
      return res.status(400).json({ error: 'what_if_actual_income is required' });
    }

    const [users] = await pool.query('SELECT avg_daily_earnings FROM users WHERE id = ?', [req.user.id]);
    const baseline = Number(users[0]?.avg_daily_earnings || 0) || Number(what_if_actual_income);
    const actual = Number(what_if_actual_income);

    const eventImpacts = {
      clear: 0.02,
      light_rain: 0.12,
      heavy_rain: 0.25,
      storm: 0.4,
      traffic_spike: 0.2,
      high_aqi: 0.18,
      demand_drop: 0.3,
    };
    const impact = eventImpacts[event] ?? 0.25;
    const expected = baseline * (1 - impact);
    const estimatedLoss = Math.max(0, expected - actual);

    res.json({
      event,
      baseline_income: baseline,
      assumed_disruption_impact: impact,
      simulated_expected_income: expected,
      simulated_actual_income: actual,
      estimated_loss: estimatedLoss,
      likely_claim_trigger: estimatedLoss >= (Number(process.env.LOSS_THRESHOLD_AMOUNT) || 50),
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Simulation failed' });
  }
});

export default router;
