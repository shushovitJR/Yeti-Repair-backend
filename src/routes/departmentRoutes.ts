import { Router } from "express";
import { addDepartment, updateDepartment, deleteDepartment, getDepartments } from "../controllers/departmentController.js";
import { authenticate, authorize } from "../middlewares/authMiddleware.js";

const router = Router();

router.post('/', authenticate, addDepartment);
router.get('/', authenticate, getDepartments);
router.delete('/:id', authenticate, authorize(['admin']),deleteDepartment);
router.put('/:id', authenticate, authorize(['admin']),updateDepartment);

export default router;