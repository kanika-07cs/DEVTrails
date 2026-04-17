function levelFromScore(score) {
  if (score >= 70) return 'high';
  if (score >= 35) return 'medium';
  return 'low';
}

export function runRiskForecast(input) {
  const rainfall = Number(input?.weather?.rainfall_mm || 0);
  const traffic = Number(input?.traffic?.congestion_index || 0); // 0-1
  const demandDrop = Number(input?.demand?.drop_pct || 0); // 0-100

  const rainFactor = Math.min(1, rainfall / 80);
  const trafficFactor = Math.min(1, traffic);
  const demandFactor = Math.min(1, demandDrop / 100);

  const score = Math.round((rainFactor * 0.35 + trafficFactor * 0.3 + demandFactor * 0.35) * 100);
  const risk_level = levelFromScore(score);
  const expected_loss_percentage = Number((score * 0.55).toFixed(1));

  const reasons = [];
  if (rainFactor > 0.4) reasons.push('Heavy rainfall is reducing delivery throughput');
  if (trafficFactor > 0.45) reasons.push('High congestion is increasing trip cycle time');
  if (demandFactor > 0.35) reasons.push('Platform demand drop is reducing order volume');
  if (!reasons.length) reasons.push('Current disruption signals are within stable range');

  return { risk_level, expected_loss_percentage, reason: reasons.join('; ') };
}
