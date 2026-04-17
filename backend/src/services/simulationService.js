export function runSimulation({ baseline_income, rainfall_mm, traffic_index, demand_drop_pct, actual_income }) {
  const base = Number(baseline_income || 0);
  const rain = Math.min(1, Number(rainfall_mm || 0) / 100);
  const traffic = Math.min(1, Number(traffic_index || 0));
  const demand = Math.min(1, Number(demand_drop_pct || 0) / 100);

  const impact = rain * 0.35 + traffic * 0.3 + demand * 0.35;
  const predicted_income = Math.max(0, base * (1 - impact));
  const actual = actual_income != null ? Number(actual_income) : Math.max(0, predicted_income * (0.85 + demand * 0.1));
  const loss = Math.max(0, predicted_income - actual);
  const threshold = Number(process.env.LOSS_THRESHOLD_AMOUNT) || 50;

  return {
    predicted_income: Number(predicted_income.toFixed(2)),
    actual_income: Number(actual.toFixed(2)),
    loss: Number(loss.toFixed(2)),
    claim_triggered: loss >= threshold,
    used_inputs: { baseline_income: base, rainfall_mm: Number(rainfall_mm || 0), traffic_index: Number(traffic_index || 0), demand_drop_pct: Number(demand_drop_pct || 0) },
  };
}
