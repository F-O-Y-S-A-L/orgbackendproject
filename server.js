import mongoose from "mongoose";
import {server} from "./utils/socket-oi.js";

mongoose.connect(process.env.DATABASE_URI,{
}).then(() => {
   console.log('DB connection succesfully ✅');
})

const port = process.env.LOCAL_PORT || 8000
server.listen(port, '0.0.0.0', () => {
   console.log(`Server running on port ${port}`);  
}) 
