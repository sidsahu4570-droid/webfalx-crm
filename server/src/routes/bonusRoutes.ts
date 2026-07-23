import { Router } from 'express';
import {
  getBonusSlabs,
  createBonusSlab,
  toggleBonusSlab,
  deleteBonusSlab,
  getCallerBonusProgress
} from '../controllers/bonusController';
import { protect } from '../middleware/authMiddleware';
import { authorize } from '../middleware/roleMiddleware';

const router = Router();

router.use(protect);

router.get('/slabs', getBonusSlabs);
router.get('/progress', getCallerBonusProgress);

router.post('/slabs', authorize('admin'), createBonusSlab);
router.put('/slabs/:id/toggle', authorize('admin'), toggleBonusSlab);
router.delete('/slabs/:id', authorize('admin'), deleteBonusSlab);

export default router;
