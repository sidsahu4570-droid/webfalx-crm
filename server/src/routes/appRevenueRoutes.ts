import { Router } from 'express';
import {
  getAppRevenues,
  createAppRevenue,
  addAppPayment,
  createAppExpense,
  getAppExpenses,
  getAppRevenueStats,
  getOverallRevenueStats
} from '../controllers/appRevenueController';
import { protect } from '../middleware/authMiddleware';
import { authorize } from '../middleware/roleMiddleware';

const router = Router();

router.use(protect);

router.get('/revenues', authorize('admin'), getAppRevenues);
router.post('/revenues', authorize('admin'), createAppRevenue);
router.post('/revenues/:id/payments', authorize('admin'), addAppPayment);

router.get('/expenses', authorize('admin'), getAppExpenses);
router.post('/expenses', authorize('admin'), createAppExpense);

router.get('/stats', authorize('admin'), getAppRevenueStats);
router.get('/overall-stats', authorize('admin'), getOverallRevenueStats);

export default router;
