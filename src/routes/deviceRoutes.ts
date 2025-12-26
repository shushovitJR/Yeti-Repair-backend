import { Router } from "express";
import { createDevice, getDevices, updateDevice } from '../controllers/deviceController';
import {authenticate,authorize} from '../middlewares/authMiddleware';

const router = Router();

router.post('/', authenticate, authorize(['admin']), createDevice);
router.get('/', getDevices);
router.put('/:id',authenticate, authorize(['admin']), updateDevice);

export default router;