import { Router } from 'express';
import {
  getConvertedClients,
  getConvertedClientById,
  createConvertedClient,
  updateConvertedClient,
  approveConvertedClient,
  toggleFieldLock,
  addWebsiteUpdate,
  addPaymentRecord,
  getMeetings,
  getRevenueStats,
  createDomainCharge,
  getDomainCharges,
  createOtherExpense,
  getOtherExpenses,
  addClientExpense,
  getClientExpenseHistory,
  deleteConvertedClient
} from '../controllers/convertedClientController';
import { protect } from '../middleware/authMiddleware';
import { authorize } from '../middleware/roleMiddleware';

const router = Router();

router.use(protect);

router.get('/', getConvertedClients);
router.get('/meetings', getMeetings);
router.get('/revenue', getRevenueStats);
router.get('/:id', getConvertedClientById);

router.post('/', createConvertedClient);
router.put('/:id', updateConvertedClient);
router.delete('/:id', authorize('admin'), deleteConvertedClient);

router.post('/:id/approve', authorize('admin'), approveConvertedClient);
router.post('/:id/toggle-lock', authorize('admin'), toggleFieldLock);

router.post('/:id/website-update', addWebsiteUpdate);
router.post('/:id/payment', addPaymentRecord);

// Expense History Routes
router.post('/:id/expenses', authorize('admin'), addClientExpense);
router.get('/:id/expenses', getClientExpenseHistory);

// Admin-Only Global Expense Routes
router.post('/domain-charges', authorize('admin'), createDomainCharge);
router.get('/domain-charges', authorize('admin'), getDomainCharges);
router.post('/other-expenses', authorize('admin'), createOtherExpense);
router.get('/other-expenses', authorize('admin'), getOtherExpenses);

export default router;
