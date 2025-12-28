import { Router } from "express";
import { createDevice, getDevices, updateDevice, deleteDevice } from '../controllers/deviceController';
import {authenticate,authorize} from '../middlewares/authMiddleware';

const router = Router();

router.post('/', authenticate, authorize(['admin']), createDevice);
router.get('/', getDevices);
router.put('/:id',authenticate, authorize(['admin']), updateDevice);
router.delete('/:id',authenticate,authorize(['admin']), deleteDevice);

export default router;