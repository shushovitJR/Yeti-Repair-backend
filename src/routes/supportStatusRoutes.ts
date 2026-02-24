import { Router } from "express";
import { createStatus, getStatuses, updateStatus, deleteStatus } from "../controllers/supportStatusController";
import { authenticate,authorize } from "../middlewares/authMiddleware";

const router = Router();

router.post('/', createStatus);
router.get('/', getStatuses);
router.put('/:id', updateStatus);
router.delete('/:id', deleteStatus);

export default router;