import { Router } from "express";
import { addVendor, getVendors, deleteVendor, updateVendor } from "../controllers/vendorController";
import { authenticate, authorize } from "../middlewares/authMiddleware";


const router = Router();

router.post('/', authenticate, addVendor);
router.get('/', getVendors);
router.delete('/:id', authenticate, deleteVendor);
router.put('/:id', authenticate,  updateVendor);

export default router;