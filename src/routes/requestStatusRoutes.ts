import { Router } from 'express';
import { createStatus, getStatuses, updateStatus, deleteStatus } from '../controllers/requestStatusController';
import { authenticate, authorize } from '../middlewares/authMiddleware';

const router = Router();

router.post('/', authenticate, createStatus);
router.get('/', getStatuses);
router.put('/:id', authenticate, updateStatus);
router.delete('/:id', authenticate, deleteStatus);

export default router;