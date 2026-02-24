import { Router } from "express";
import { createSupport, getSupport } from "../controllers/supportController";
import { authenticate, authorize } from '../middlewares/authMiddleware';

const router = Router();

router.post('/', createSupport);
router.get('/', getSupport);

export default router;