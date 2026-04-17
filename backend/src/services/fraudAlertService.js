import pool from '../config/database.js';

function clusterKey(row) {
  const lat = row.claim_lat == null ? 'na' : Number(row.claim_lat).toFixed(2);
  const lng = row.claim_lng == null ? 'na' : Number(row.claim_lng).toFixed(2);
  const hour = new Date(row.created_at).toISOString().slice(0, 13);
  return `${lat}:${lng}:${hour}`;
}

export async function getFraudAlerts() {
  const [rows] = await pool.query(
    `SELECT c.id, c.user_id, c.claim_lat, c.claim_lng, c.created_at, c.risk_score, u.name, u.email
     FROM claims c
     JOIN users u ON u.id = c.user_id
     WHERE c.created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
     ORDER BY c.created_at DESC`
  );

  const grouped = rows.reduce((acc, row) => {
    const key = clusterKey(row);
    if (!acc[key]) acc[key] = [];
    acc[key].push(row);
    return acc;
  }, {});

  return Object.entries(grouped)
    .filter(([, members]) => members.length >= 3)
    .map(([key, members]) => {
      const [lat, lng, hour] = key.split(':');
      const baseScore = members.reduce((sum, m) => sum + (m.risk_score === 'high' ? 30 : 15), 0);
      return {
        cluster_key: key,
        area: { lat: lat === 'na' ? null : Number(lat), lng: lng === 'na' ? null : Number(lng) },
        time_window_hour: `${hour}:00`,
        claim_count: members.length,
        severity: baseScore >= 90 ? 'high' : baseScore >= 60 ? 'medium' : 'low',
        suggested_fraud_score: Math.min(100, baseScore),
        users: members.map((m) => ({ user_id: m.user_id, name: m.name, email: m.email, claim_id: m.id })),
      };
    });
}
