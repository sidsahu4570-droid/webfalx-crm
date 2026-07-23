import { Router } from 'express';
import {
  getUsers,
  createUser,
  updateUser,
  deleteUser,
  submitJoiningDate,
  approveJoiningDate
} from '../controllers/userController';
import { protect } from '../middleware/authMiddleware';
import { authorize } from '../middleware/roleMiddleware';

const router = Router();

router.use(protect);

// Caller or Admin Route for Joining Date Submission
router.post('/joining-date', submitJoiningDate);

// Admin-Only User Management Routes
router.get('/', authorize('admin'), getUsers);
router.post('/', authorize('admin'), createUser);
router.put('/:id', authorize('admin'), updateUser);
router.delete('/:id', authorize('admin'), deleteUser);
router.post('/:userId/approve-joining-date', authorize('admin'), approveJoiningDate);

export default router;
