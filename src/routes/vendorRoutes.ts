import { Router } from "express";
import { addVendor, getVendors, deleteVendor, updateVendor } from "../controllers/vendorController.js";
import { authenticate, authorize } from "../middlewares/authMiddleware.js";


const router = Router();

router.post('/', authenticate, authorize(['admin']),addVendor);
router.get('/', authenticate, getVendors);
router.delete('/:id', authenticate, authorize(['admin']),deleteVendor);
router.put('/:id', authenticate, authorize(['admin']),updateVendor);

export default router;