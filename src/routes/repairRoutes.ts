import { Router } from 'express';
import { createRepairRequest, getRepairRequest, getRepairRequestById, updateRepairRequest } from '../controllers/repairController';
import { authenticate, authorize } from '../middlewares/authMiddleware';

const router = Router();

router.get('/', getRepairRequest);
router.post('/', authenticate, authorize(['admin']), createRepairRequest);
router.get('/:id', getRepairRequestById);
router.put('/:id', authenticate, authorize(['admin']), updateRepairRequest);

export default router;