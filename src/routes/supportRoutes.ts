import { Router } from "express";
import { createSupport, getSupport, updateSupport, deleteSupport } from "../controllers/supportController";
import { authenticate, authorize } from '../middlewares/authMiddleware';

const router = Router();

router.post('/',authenticate, authorize(['admin']), createSupport);
router.get('/', authenticate, authorize(['admin']), getSupport);
router.put('/:id',authenticate, authorize(['admin']),updateSupport);
router.delete('/:id',authenticate, authorize(['admin']),deleteSupport);

export default router;