import { Router } from 'express';
import {
  getLeads,
  getLeadById,
  createLead,
  updateLead,
  deleteLead,
  addNote,
  completeFollowUp,
  importExcelLeads,
  getImportHistory,
  logCallAttempt
} from '../controllers/leadController';
import { protect } from '../middleware/authMiddleware';
import { authorize } from '../middleware/roleMiddleware';

const router = Router();

router.use(protect);

router.get('/', getLeads);
router.get('/import-history', authorize('admin'), getImportHistory);
router.post('/import-excel', authorize('admin'), importExcelLeads);
router.get('/:id', getLeadById);
router.post('/', createLead);
router.put('/:id', updateLead);
router.delete('/:id', deleteLead);
router.post('/:id/notes', addNote);
router.patch('/:id/complete-followup', completeFollowUp);
router.post('/:id/call-log', logCallAttempt);

export default router;
