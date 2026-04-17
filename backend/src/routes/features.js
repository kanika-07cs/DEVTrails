import { Router } from 'express';
import { authMiddleware, adminMiddleware } from '../middleware/auth.js';
import {
  fraudAlertsController,
  getDemandZonesController,
  riskForecastController,
  simulationRunController,
} from '../controllers/featureController.js';

const router = Router();

router.get(['/api/demand/zones', '/demand/zones'], authMiddleware, getDemandZonesController);
router.post(['/api/risk/forecast', '/risk/forecast'], authMiddleware, riskForecastController);
router.post(['/api/simulation/run', '/simulation/run'], authMiddleware, simulationRunController);
router.get(['/api/fraud/alerts', '/fraud/alerts'], authMiddleware, adminMiddleware, fraudAlertsController);

export default router;
