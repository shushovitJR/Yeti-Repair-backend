import { Router } from 'express';
import { login } from '../controllers/authController.js';

const router = Router();

router.get("/login",(req,res)=>{
    res.send("login");
})
router.post("/login", login);

export default router;