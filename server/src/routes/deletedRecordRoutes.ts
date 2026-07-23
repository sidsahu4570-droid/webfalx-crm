import { Router } from 'express';
import {
  getDeletedRecords,
  restoreDeletedRecord,
  permanentDeleteRecord
} from '../controllers/deletedRecordController';
import { protect } from '../middleware/authMiddleware';
import { authorize } from '../middleware/roleMiddleware';

const router = Router();

router.use(protect);
router.use(authorize('admin'));

router.get('/', getDeletedRecords);
router.post('/:id/restore', restoreDeletedRecord);
router.delete('/:id', permanentDeleteRecord);

export default router;
