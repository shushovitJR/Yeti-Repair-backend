import { Router } from "express";
import { addDepartment, updateDepartment, deleteDepartment, getDepartments } from "../controllers/departmentController";
import { authenticate, authorize } from "../middlewares/authMiddleware";

const router = Router();

router.post('/', authenticate, addDepartment);
router.get('/', authenticate, getDepartments);
router.delete('/:id', authenticate, authorize(['admin']),deleteDepartment);
router.put('/:id', authenticate, updateDepartment);

export default router;