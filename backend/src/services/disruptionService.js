/**
 * Mock disruption signals — simulates weather, traffic, pollution, demand.
 */
export function getDisruptionSnapshot(location = '') {
  const seed = location.length + Date.now() % 997;
  return {
    location: location || 'unknown',
    weather: {
      severity: ['clear', 'light_rain', 'heavy_rain', 'storm'][seed % 4],
      temperature_c: 22 + (seed % 15),
      disruption_index: (seed % 100) / 100,
    },
    traffic: {
      congestion_level: ['low', 'medium', 'high'][seed % 3],
      avg_delay_minutes: seed % 45,
      disruption_index: ((seed * 7) % 100) / 100,
    },
    pollution: {
      aqi: 50 + (seed % 200),
      category: seed % 150 > 100 ? 'unhealthy_sensitive' : 'moderate',
      disruption_index: ((seed * 3) % 100) / 100,
    },
    demand_drop: {
      platform_demand_index: Math.max(0.2, 1 - ((seed % 60) / 100)),
      estimated_order_drop_pct: seed % 50,
    },
    combined_disruption_score: Math.min(1, ((seed % 80) + 20) / 100),
    generated_at: new Date().toISOString(),
  };
}
