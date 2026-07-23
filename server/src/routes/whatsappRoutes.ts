import { Router } from 'express';
import {
  logWhatsAppMessage,
  getWhatsAppLogs,
  updateWhatsAppStatus
} from '../controllers/whatsappController';
import { protect } from '../middleware/authMiddleware';

const router = Router();

router.use(protect);

router.post('/log', logWhatsAppMessage);
router.get('/logs', getWhatsAppLogs);
router.put('/logs/:id/status', updateWhatsAppStatus);

export default router;
