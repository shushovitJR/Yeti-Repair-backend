import { Router } from 'express';
import { createRepairRequest, getRepairRequest, updateRepairRequest, deleteRepairRequest } from '../controllers/repairController';
import { authenticate, authorize } from '../middlewares/authMiddleware';

const router = Router();

router.get('/', getRepairRequest);
router.post('/', createRepairRequest);
router.put('/:id', authenticate, updateRepairRequest);
router.delete('/:id', authenticate, deleteRepairRequest);

export default router;