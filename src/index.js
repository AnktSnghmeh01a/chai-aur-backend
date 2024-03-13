// it can decrese the consistency of the code
// require('dotenv').config({path: '/env'})

import dotenv from 'dotenv';

import connectDB from "./db/index.js";
import  app  from './app.js';

dotenv.config({
   
    path: './env'
});

connectDB()
.then(()=>{
  app.listen(process.env.PORT || 8000 ,()=>{
    console.log(`Server is running at PORT ${process.env.PORT}`)
  })
})
.catch((err)=>{
  console.log(" Mongodb failed ",err);
})

















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