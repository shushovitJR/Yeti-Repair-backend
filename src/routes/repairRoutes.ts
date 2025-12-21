import { Router } from 'express';
import { createRepairRequest, getRepairRequest, getRepairRequestById, updateRepairRequest } from '../controllers/repairController';

const router = Router();

router.get('/', getRepairRequest);
router.post('/', createRepairRequest);
router.get('/:id', getRepairRequestById);
router.put('/:id', updateRepairRequest);

export default router;