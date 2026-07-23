import { Router } from 'express';
import {
  getCities,
  createCity,
  updateCity,
  toggleCityStatus,
  deleteCity
} from '../controllers/cityController';
import { protect } from '../middleware/authMiddleware';
import { authorize } from '../middleware/roleMiddleware';

const router = Router();

router.use(protect);

router.get('/', getCities);
router.post('/', authorize('admin'), createCity);
router.put('/:id', authorize('admin'), updateCity);
router.patch('/:id/toggle', authorize('admin'), toggleCityStatus);
router.delete('/:id', authorize('admin'), deleteCity);

export default router;
