import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import authRoutes from './routes/authRoutes.js';
import repairRoutes from './routes/repairRoutes.js';
import requestRoutes from './routes/requestRoutes.js';
import vendorRoutes from './routes/vendorRoutes.js';
import deviceRoutes from './routes/deviceRoutes.js';
import repairStatusRoutes from './routes/repairStatusRoutes.js';
import requestStatusRoutes from './routes/requestStatusRoutes.js';
import reportRoutes from './routes/reportRoutes.js';
import departmentRoutes from './routes/departmentRoutes.js';
import supportStatusRoutes from './routes/supportStatusRoutes.js';
import supportRoutes from './routes/supportRoutes.js'

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
app.use('/api/supportstatus', supportStatusRoutes)
app.use('/api/support', supportRoutes)

export default app;