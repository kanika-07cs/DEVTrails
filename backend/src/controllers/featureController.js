import pool from '../config/database.js';
import { getDemandZones } from '../services/demandService.js';
import { runRiskForecast } from '../services/riskForecastService.js';
import { getFraudAlerts } from '../services/fraudAlertService.js';
import { runSimulation } from '../services/simulationService.js';

export async function getDemandZonesController(_req, res) {
  res.json(getDemandZones());
}

export async function riskForecastController(req, res) {
  try {
    const forecast = runRiskForecast(req.body || {});
    res.json(forecast);
  } catch (e) {
    console.error(e);
    res.status(400).json({ error: 'Invalid forecast input' });
  }
}

export async function fraudAlertsController(_req, res) {
  try {
    const alerts = await getFraudAlerts();
    res.json({ alerts });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to fetch fraud alerts' });
  }
}

export async function simulationRunController(req, res) {
  try {
    const [rows] = await pool.query('SELECT avg_daily_earnings FROM users WHERE id = ?', [req.user.id]);
    const baseline = Number(rows[0]?.avg_daily_earnings || 0);
    const result = runSimulation({ baseline_income: baseline, ...req.body });
    res.json(result);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Simulation failed' });
  }
}
