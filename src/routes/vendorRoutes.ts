import { Router } from "express";
import { addVendor, getVendors, deleteVendor } from "../controllers/vendorController";


const router = Router();

router.post('/', addVendor);
router.get('/', getVendors);
router.delete('/:id', deleteVendor);

export default router;