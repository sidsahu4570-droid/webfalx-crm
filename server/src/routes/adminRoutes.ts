import { Router } from 'express';
import { getAdminStats, getActivityLogs, assignLead, clearAllDemoData, importLeadsMigrationController } from '../controllers/adminController';
import { protect } from '../middleware/authMiddleware';
import { authorize } from '../middleware/roleMiddleware';

const router = Router();

router.use(protect);

router.get('/stats', getAdminStats);
router.get('/activity', authorize('admin'), getActivityLogs);
router.post('/assign-lead', authorize('admin'), assignLead);
router.post('/clear-demo-data', authorize('admin'), clearAllDemoData);
router.post('/import-leads-migration', authorize('admin'), importLeadsMigrationController);

export default router;
