import { Router } from 'express';
import { createTimelineEvent, getTimelineForEntity } from '../controllers/activityTimelineController';
import { protect } from '../middleware/authMiddleware';

const router = Router();

router.use(protect);

router.post('/', createTimelineEvent);
router.get('/:entityId', getTimelineForEntity);

export default router;
