import { Router } from "express";
import { createRequest, getRequest, getRequestById, updateRequest } from '../controllers/requestController';
import { authenticate, authorize } from "../middlewares/authMiddleware";

const router = Router();

router.post('/', createRequest);
router.get('/', getRequest);
router.get('/:id', getRequestById);
router.put('/:id', authenticate, authorize(['admin']), updateRequest);

export default router;