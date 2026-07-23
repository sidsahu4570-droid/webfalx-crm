import { Router } from 'express';
import {
  getCategories,
  createCategory,
  updateCategory,
  toggleCategoryStatus,
  deleteCategory
} from '../controllers/categoryController';
import { protect } from '../middleware/authMiddleware';
import { authorize } from '../middleware/roleMiddleware';

const router = Router();

router.use(protect);

router.get('/', getCategories);
router.post('/', authorize('admin'), createCategory);
router.put('/:id', authorize('admin'), updateCategory);
router.patch('/:id/toggle', authorize('admin'), toggleCategoryStatus);
router.delete('/:id', authorize('admin'), deleteCategory);

export default router;
