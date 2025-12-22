import { Router } from "express";
import { addVendor, getVendors, deleteVendor } from "../controllers/vendorController";
import { authenticate, authorize } from "../middlewares/authMiddleware";


const router = Router();

router.post('/', authenticate, authorize(['admin']), addVendor);
router.get('/', getVendors);
router.delete('/:id', authenticate, authorize(['admin']), deleteVendor);

export default router;