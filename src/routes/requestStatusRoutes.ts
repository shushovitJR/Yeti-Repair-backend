import { Router } from 'express';
import { createStatus, getStatuses, updateStatus, deleteStatus } from '../controllers/requestStatusController.js';
import { authenticate, authorize } from '../middlewares/authMiddleware.js';

const router = Router();

router.post('/', authenticate, createStatus);
router.get('/', authenticate, getStatuses);
router.put('/:id', authenticate, authorize(['admin']),updateStatus);
router.delete('/:id', authenticate, authorize(['admin']),deleteStatus);

export default router;