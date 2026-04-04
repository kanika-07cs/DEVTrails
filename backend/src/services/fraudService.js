import pool from '../config/database.js';

/**
 * Rule-based fraud scoring (0–100+).
 * - sudden location jump → +50
 * - repeated claims → +30
 * - no activity but claiming → +40
 * Bands: 0–30 low, 30–70 medium, 70+ high
 */
export function scoreToLevel(score) {
  if (score >= 70) return 'high';
  if (score > 30) return 'medium';
  return 'low';
}

/**
 * @param {object} opts
 * @param {boolean} opts.suddenLocationJump — GPS inconsistency (mock / client flag)
 * @param {boolean} opts.noActivityButClaiming — earnings absent but claim filed
 * @param {number} opts.recentClaimCount — claims in lookback window
 * @param {boolean} opts.unrealisticDrop — actual << historical median
 */
export function computeFraudScore(opts) {
  let score = 0;
  if (opts.suddenLocationJump) score += 50;
  if (opts.repeatedClaims) score += 30;
  if (opts.noActivityButClaiming) score += 40;
  if (opts.unrealisticDrop) score += 25;
  return { numericScore: score, risk_score: scoreToLevel(score) };
}

export async function countRecentClaims(userId, days = 14) {
  const [rows] = await pool.query(
    `SELECT COUNT(*) AS c FROM claims
     WHERE user_id = ? AND created_at >= DATE_SUB(CURDATE(), INTERVAL ? DAY)`,
    [userId, days]
  );
  return Number(rows[0]?.c || 0);
}

/**
 * Heuristic: "movement pattern" — if mock speeds imply teleporting.
 */
export function detectSuddenLocationJump(mockGps) {
  if (!mockGps?.prev_lat || !mockGps?.prev_lng || !mockGps?.curr_lat || !mockGps?.curr_lng) {
    return false;
  }
  const dLat = Math.abs(mockGps.curr_lat - mockGps.prev_lat);
  const dLng = Math.abs(mockGps.curr_lng - mockGps.prev_lng);
  return dLat > 0.5 || dLng > 0.5;
}

export async function assessClaimFraud(userId, context) {
  const {
    mock_gps,
    reported_earnings_today,
    predicted_income,
    actual_income,
    historicalMedian,
  } = context;

  const recent = await countRecentClaims(userId, 14);
  const repeatedClaims = recent >= 2;

  const suddenLocationJump = detectSuddenLocationJump(mock_gps);
  const noActivityButClaiming =
    (actual_income === 0 || actual_income == null) &&
    (!reported_earnings_today || reported_earnings_today === 0);

  const unrealisticDrop =
    historicalMedian > 0 &&
    actual_income != null &&
    actual_income < historicalMedian * 0.15 &&
    predicted_income > historicalMedian * 0.5;

  return computeFraudScore({
    suddenLocationJump,
    repeatedClaims,
    noActivityButClaiming,
    unrealisticDrop,
  });
}
