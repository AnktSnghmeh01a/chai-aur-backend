import mongoose from "mongoose";
import { DB_NAME } from "../constant.js";


const connectDB = async () => { 

try{
  const connectionInstance = await mongoose.connect(`${process.env.MONGO_DB_URI}/${DB_NAME}`);
  console.log(`\n MongoDB connected !! DB Host: ${connectionInstance.connection.host}`)
}
catch (error){
  console.log("MONGODB connection error ",error);
  process.exit(1); 
}

}
export default connectDB