// it can decrese the consistency of the code
// require('dotenv').config({path: '/env'})

import dotenv from 'dotenv';

import connectDB from "./db/index.js";

dotenv.config({
   
    path: './env'
});

connectDB();

















/*
import { express } from "express";
const app = express();

(
  async () =>{
 
      try{

        await mongoose.connect(`${process.env.MONGO_DB_URI}`/`${DB_NAME}`)
        app.on("error", (error) =>{
          console.log("Error");
          throw error
        })

        app.listen(process.env.PORT,() =>{
          console.log(`App is listening on PORT ${process.env.PORT}`);
        })
      }

      catch(error){
         console.error("ERROR: ",error);
         throw error 
        }   
  }
)()
*/