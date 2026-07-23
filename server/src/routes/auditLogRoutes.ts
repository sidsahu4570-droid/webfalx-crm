import { Router } from 'express';
import { getAuditLogs } from '../controllers/auditLogController';
import { protect } from '../middleware/authMiddleware';
import { authorize } from '../middleware/roleMiddleware';

const router = Router();

router.use(protect);
router.use(authorize('admin'));

router.get('/', getAuditLogs);

export default router;
