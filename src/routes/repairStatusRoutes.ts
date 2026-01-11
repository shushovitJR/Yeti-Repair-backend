import { Router } from "express";
import { createStatus, getStatuses, updateStatus, deleteStatus } from "../controllers/repairStatusController";
import { authenticate, authorize } from "../middlewares/authMiddleware";

const router = Router();

router.post('/', authenticate, authorize(['admin']),createStatus);
router.get('/', authenticate, authorize(['admin']),getStatuses);
router.put('/:id', authenticate, authorize(['admin']),updateStatus);
router.delete('/:id', authenticate, authorize(['admin']),deleteStatus);

export default router;