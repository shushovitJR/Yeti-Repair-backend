import app from './index'
import { connectDB } from './config/db'

const API_URL = process.env.REACT_APP_API_URL

connectDB();

app.listen(5000, "0.0.0.0" , ()=>{
  console.log(`Server is running on ${API_URL}:5000`);
})
