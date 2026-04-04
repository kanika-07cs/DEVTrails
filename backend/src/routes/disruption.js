import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { getDisruptionSnapshot } from '../services/disruptionService.js';

const router = Router();
router.use(authMiddleware);

router.get('/disruption/signals', (req, res) => {
  const location = req.query.location || '';
  res.json(getDisruptionSnapshot(String(location)));
});

router.get('/disruption/weather', (req, res) => {
  res.json(getDisruptionSnapshot(String(req.query.location || '')).weather);
});

router.get('/disruption/traffic', (req, res) => {
  res.json(getDisruptionSnapshot(String(req.query.location || '')).traffic);
});

router.get('/disruption/pollution', (req, res) => {
  res.json(getDisruptionSnapshot(String(req.query.location || '')).pollution);
});

router.get('/disruption/demand', (req, res) => {
  res.json(getDisruptionSnapshot(String(req.query.location || '')).demand_drop);
});

export default router;
