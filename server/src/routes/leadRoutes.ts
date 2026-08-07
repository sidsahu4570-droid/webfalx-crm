import { Router } from 'express';
import {
  getLeads,
  getLeadById,
  createLead,
  updateLead,
  deleteLead,
  bulkDeleteLeads,
  addNote,
  completeFollowUp,
  importExcelLeads,
  getImportHistory,
  logCallAttempt,
  bulkAssignLeads
} from '../controllers/leadController';
import { protect } from '../middleware/authMiddleware';
import { authorize } from '../middleware/roleMiddleware';

const router = Router();

router.use(protect);

router.get('/', getLeads);
router.get('/import-history', authorize('admin'), getImportHistory);
router.post('/import-excel', authorize('admin'), importExcelLeads);
router.post('/bulk-delete', bulkDeleteLeads);
router.post('/bulk-assign', authorize('admin'), bulkAssignLeads);
router.get('/:id', getLeadById);
router.post('/', createLead);
router.put('/:id', updateLead);
router.delete('/:id', deleteLead);
router.post('/:id/notes', addNote);
router.patch('/:id/complete-followup', completeFollowUp);
router.post('/:id/call-log', logCallAttempt);

export default router;
