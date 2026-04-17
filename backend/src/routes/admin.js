import { Router } from 'express';
import { adminMiddleware, authMiddleware } from '../middleware/auth.js';
import {
  adminAnalytics,
  adminApproveClaim,
  adminRejectClaim,
  listAdminClaims,
  listAdminUsers,
} from '../controllers/adminController.js';

const router = Router();
router.use(authMiddleware, adminMiddleware);

router.get(['/api/admin/users', '/admin/users'], listAdminUsers);
router.get(['/api/admin/claims', '/admin/claims'], listAdminClaims);
router.get(['/api/admin/analytics', '/admin/analytics'], adminAnalytics);
router.post(['/api/admin/claims/:id/approve', '/admin/claims/:id/approve'], adminApproveClaim);
router.post(['/api/admin/claims/:id/reject', '/admin/claims/:id/reject'], adminRejectClaim);

export default router;
