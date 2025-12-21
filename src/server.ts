import app from './index'
import { connectDB } from './config/db'

const PORT = 5000;

connectDB();

app.listen(PORT, ()=>{
  console.log(`Server is running on http://localhost:${PORT}`);
})
