import mongoose, { Schema } from "mongoose";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
const userSchema = new Schema(
  
  {
    username: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    fullname: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    avatar: {
      type: String, // using the cloudnary url
      required: true,
    },
    coverImage: {
      type: String,
    },
    watchHistory: {
      type: Schema.Types.ObjectId,
      ref: "vedeo",
    },
    password: {
      type: String,
      required: [true, "Password id required"],
    },
    refreshToken: {
      type: String,
    },
  },
  {
    timeStamps: true,
  }
);

userSchema.pre("save", async function (next){

    if(!this.isModified("password")) return next();
    this.password = await bcrypt.hash(this.password,10)
    next()
})


userSchema.methods.isPasswordCorrect = async function (password){
  return await bcrypt.compare(password, this.password);
}

// Generate access token
userSchema.methods.generateAccessToken = function (){

  jwt.sign(
    {
       _id:this._id,
       email: this.email,
       username:this.username,
       fullName: this.fullName
    } ,
    process.env.ACCESS_TOKEN_SECRET,{
      expiresIn:process.env.ACCESS_TOKEN_EXPIRY 
    }
  )

}

// Generate refresh token
userSchema.methods.generateRefreshToken = function (){

  jwt.sign(
    {
       _id:this._id,
     
    } ,
    process.env.REFRESH_TOKEN_SECRET,{
      expiresIn:process.env.REFRESH_TOKEN_EXPIRY 
    }
  )

}

userSchema.methods.generateRefreshToken = function (){}

export const User = mongoose.model("User", userSchema);
