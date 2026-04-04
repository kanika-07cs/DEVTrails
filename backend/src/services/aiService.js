import axios from 'axios';

const AI_URL = process.env.AI_SERVICE_URL || 'http://127.0.0.1:8000';

/**
 * Calls FastAI /predict with past earnings and context.
 */
export async function predictIncome(payload) {
  const { past_earnings, day_of_week, hour, location, platform, baseline } = payload;
  const { data } = await axios.post(
    `${AI_URL}/predict`,
    {
      past_earnings: past_earnings ?? [],
      day_of_week: day_of_week ?? new Date().getDay(),
      hour: hour ?? new Date().getHours(),
      location: location ?? '',
      platform: platform ?? '',
      avg_daily_earnings_baseline: baseline ?? 0,
    },
    { timeout: 15000 }
  );
  const value = Number(data?.predicted_income);
  if (!Number.isFinite(value)) {
    throw new Error('AI service returned invalid prediction');
  }
  return value;
}
