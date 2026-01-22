import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import authRoutes from './routes/authRoutes';
import repairRoutes from './routes/repairRoutes';
import requestRoutes from './routes/requestRoutes';
import vendorRoutes from './routes/vendorRoutes';
import deviceRoutes from './routes/deviceRoutes';
import repairStatusRoutes from './routes/repairStatusRoutes';
import requestStatusRoutes from './routes/requestStatusRoutes';
import reportRoutes from './routes/reportRoutes';
import departmentRoutes from './routes/departmentRoutes';

dotenv.config();
const app = express();

app.use(cors({
  origin: [
    "http://localhost:3000",
    `${process.env.REACT_APP_API_URL}:3000`
  ]
}));
app.use(express.json());

app.get("/",(req,res)=>{
  res.send("API is running");
});

app.use("/auth", authRoutes)
app.use("/api/repair", repairRoutes)
app.use("/api/request", requestRoutes)
app.use("/api/vendor", vendorRoutes)
app.use("/api/device", deviceRoutes)
app.use("/api/department", departmentRoutes)
app.use('/api/repairStatus', repairStatusRoutes)
app.use('/api/requestStatus', requestStatusRoutes)
app.use('/api/report', reportRoutes)

export default app;