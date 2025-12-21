import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import authRoutes from './routes/authRoutes';
import repairRoutes from './routes/repairRoutes';
import requestRoutes from './routes/requestRoutes';

dotenv.config();
const app = express();

app.use(cors());
app.use(express.json());

app.get("/",(req,res)=>{
  res.send("API is running");
});

app.use("/auth", authRoutes)
app.use("/api/repair", repairRoutes)
app.use("/api/request", requestRoutes)

export default app;