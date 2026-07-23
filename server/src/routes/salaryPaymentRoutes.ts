import { Router } from 'express';
import {
  recordSalaryPayment,
  getCallerSalaryPayments,
  getAllSalaryPayments,
  getCallerSalarySummary
} from '../controllers/salaryPaymentController';
import { protect } from '../middleware/authMiddleware';
import { authorize } from '../middleware/roleMiddleware';

const router = Router();

router.use(protect);

router.post('/', authorize('admin'), recordSalaryPayment);
router.get('/caller', getCallerSalaryPayments);
router.get('/summary', getCallerSalarySummary);
router.get('/all', authorize('admin'), getAllSalaryPayments);

export default router;
