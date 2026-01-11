import { Router } from "express";
import { createRequest, getRequest, updateRequest, deleteRequest } from '../controllers/requestController';
import { authenticate, authorize } from "../middlewares/authMiddleware";

const router = Router();

router.post('/', authenticate,createRequest);
router.get('/', getRequest);
router.put('/:id', authenticate, updateRequest);
router.delete('/:id', authenticate, deleteRequest);

export default router;