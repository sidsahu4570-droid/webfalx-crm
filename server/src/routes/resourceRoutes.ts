import { Router } from 'express';
import {
  getNotes,
  createNote,
  updateNote,
  deleteNote,
  getResources,
  createResource,
  updateResource,
  deleteResource,
  getAssignments,
  saveAssignment,
  getCallerResources
} from '../controllers/resourceController';
import { protect } from '../middleware/authMiddleware';
import { authorize } from '../middleware/roleMiddleware';

const router = Router();

router.use(protect);

// ==========================================
// CALLER ROUTE
// ==========================================
router.get('/caller-view', getCallerResources);

// ==========================================
// ADMIN ROUTES (PROTECTED)
// ==========================================
router.use(authorize('admin'));

// Notes Management
router.get('/notes', getNotes);
router.post('/notes', createNote);
router.put('/notes/:id', updateNote);
router.delete('/notes/:id', deleteNote);

// Image Resources Management
router.get('/images', getResources);
router.post('/images', createResource);
router.put('/images/:id', updateResource);
router.delete('/images/:id', deleteResource);

// Assignments Management
router.get('/assignments', getAssignments);
router.post('/assignments', saveAssignment);

export default router;
