import { Router } from "express";
import { createRequest, getRequest, getRequestById, updateRequest, deleteRequest } from '../controllers/requestController';
import { authenticate, authorize } from "../middlewares/authMiddleware";

const router = Router();

router.post('/', authenticate,createRequest);
router.get('/', getRequest);
router.get('/:id', getRequestById);
router.put('/:id', authenticate, authorize(['admin']), updateRequest);
router.delete('/:id', authenticate, authorize(['admin']), deleteRequest);

export default router;