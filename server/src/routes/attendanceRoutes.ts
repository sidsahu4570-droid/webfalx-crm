import { Router } from 'express';
import {
  clockIn,
  clockOut,
  recordBreak,
  getTodayAttendance,
  getAttendanceReport
} from '../controllers/attendanceController';
import { protect } from '../middleware/authMiddleware';

const router = Router();

router.use(protect);

router.post('/clock-in', clockIn);
router.post('/clock-out', clockOut);
router.post('/break', recordBreak);
router.get('/today', getTodayAttendance);
router.get('/report', getAttendanceReport);

export default router;
