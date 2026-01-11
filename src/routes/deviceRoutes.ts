import { Router } from "express";
import { createDevice, getDevices, updateDevice, deleteDevice } from '../controllers/deviceController';
import {authenticate,authorize} from '../middlewares/authMiddleware';

const router = Router();

router.post('/', authenticate, createDevice);
router.get('/', getDevices,authenticate);
router.put('/:id',authenticate, updateDevice);
router.delete('/:id',authenticate, authorize(['admin']),deleteDevice);

export default router;