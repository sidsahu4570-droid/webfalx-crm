import { Router } from 'express';
import {
  getCallerReports,
  getAllReports,
  createOrUpdateReport,
  unlockReportFor10Mins,
  lockReport,
  deleteReport,
  getReportEditHistory,
  getReportAuditTrail,
  getNewLeadReports,
  getExistingLeadReports,
  getNewLeadReportAudits,
  getExistingLeadReportAudits
} from '../controllers/reportController';
import { protect } from '../middleware/authMiddleware';
import { authorize } from '../middleware/roleMiddleware';

const router = Router();

router.use(protect);

// Combined Legacy Reports
router.get('/my-reports', getCallerReports);
router.get('/all', authorize('admin'), getAllReports);
router.get('/audit', getReportAuditTrail);

// 📌 Separated Report Endpoints
router.get('/new-leads', getNewLeadReports);
router.get('/existing-leads', getExistingLeadReports);
router.get('/new-leads/audit', getNewLeadReportAudits);
router.get('/existing-leads/audit', getExistingLeadReportAudits);

router.post('/submit', createOrUpdateReport);
router.post('/:id/unlock', authorize('admin'), unlockReportFor10Mins);
router.post('/:id/lock', authorize('admin'), lockReport);
router.delete('/:id', authorize('admin'), deleteReport);
router.get('/:id/history', getReportEditHistory);

export default router;
