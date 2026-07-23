import { Router } from 'express';
import {
  configureSalary,
  getSalaryConfigurations,
  getSalaryProgress
} from '../controllers/salaryController';
import { protect } from '../middleware/authMiddleware';
import { authorize } from '../middleware/roleMiddleware';

const router = Router();

router.use(protect);

router.post('/configure', authorize('admin'), configureSalary);
router.get('/progress', getSalaryProgress);
router.get('/configurations', authorize('admin'), getSalaryConfigurations);

export default router;
