import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiErrors.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudnary } from "../utils/cloudnary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import  jwt  from "jsonwebtoken";

export const registerUser = asyncHandler(async (req, res) => {

  // get user details from  user
  // validation not empty
  // check whether ,if user already exists or not -- username and email
  //  check for images and check for avatar
  // create user object and create entry in db
  // remove refresh token and user password from response
  // check for user creation
  // return res

  const { fullname, email, username, password } = req.body;
  console.log("E-mail :", email);

  if (
    [fullname, email, username, password].some((field) => field?.trim() === "")
  ) {
    throw new ApiError(400, "All filds are required");
  }

  const existedUser = await User.findOne({
    $or: [{ username }, { email }],
  });

  if (existedUser) {
    throw new ApiError(409, "User with email and username already exists");
  }

  const avatarLocalPath = req.files?.avatar[0]?.path;
  
  // const coverImageLocalPath = req.files?.coverImage[0]?.path;
 
  let coverImageLocalPath;
  if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length >0){
    coverImageLocalPath = req.files.coverImage[0].path
  }


  if (!avatarLocalPath) {
    throw new ApiError(400,"Avatar file is required");
  }

  const avatar = await uploadOnCloudnary(avatarLocalPath);

  const coverImage = await uploadOnCloudnary(coverImageLocalPath);
  



  if(!avatar){
    throw new ApiError(400,"Avatar file is required");
  }

  const user = await User.create({
    fullname,
    avatar: avatar.url,
    coverImage: coverImage?.url || "",
    email,
    password,
    username: username.toLowerCase(),

  })

  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
  )

  if(!createdUser){
    throw new ApiError(500,"Something went wrong while registering the user")
  } 
 
  
  return res.status(201).json(
 
      new ApiResponse(200,createdUser,"user registered successfully") 
  )
});


const generateAccessAndRefreshTokens = async(userId) =>{
 
   try{
    const user = await User.findById(userId);
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

     
    user.refreshToken = refreshToken;
    
    await user.save({ validateBeforeSave:false })

    return {accessToken,refreshToken}


   }
 
   catch(error){
    console.error("Error generating tokens:", error);
      throw new ApiError(500,"Something went wrong while generating access token and refresh token");

   }

} 

export const loginUser = asyncHandler(async (req, res) =>{
  // req body -> data
  // username or email
  //find the user
  //password check
  //access and referesh token
  //send cookie

  const {email, username, password} = req.body
  console.log(email);

  if (!username && !email) {
      throw new ApiError(400, "username or email is required")
  }
  
  // Here is an alternative of above code based on logic discussed in video:
  // if (!(username || email)) {
  //     throw new ApiError(400, "username or email is required")
      
  // }

  const user = await User.findOne({
      $or: [{username}, {email}]
  })

  if (!user) {
      throw new ApiError(404, "User does not exist")
  }

 const isPasswordValid = await user.isPasswordCorrect(password)

 if (!isPasswordValid) {
  throw new ApiError(401, "Invalid user credentials")
  }

const {accessToken, refreshToken} = await generateAccessAndRefreshTokens(user._id)

  const loggedInUser = await User.findById(user._id).select("-password -refreshToken")

  const options = {
      httpOnly: true,
      secure: true
  }

  return res
  .status(200)
  .cookie("accessToken", accessToken, options)
  .cookie("refreshToken", refreshToken, options)
  .json(
      new ApiResponse(
          200, 
          {
              user: loggedInUser, accessToken, refreshToken
          },
          "User logged In Successfully"
      )
  )

})

export const logOutUser = asyncHandler(async (req,res)=>{

    User.findByIdAndUpdate(
      req.user._id,
      {


         $set: {
             
              refreshToken: undefined
         }

      },
      {
        new: true
      }
          )  

          const options = {
            httpOnly :true,

            secure: true
          }
           

         return res
         .status(200)
         .clearCookie("accessToken",options)
         .clearCookie("refreshToken",options)
         .json(new ApiResponse(200,{},"User logged out"))


})

export const refreshAccessToken =  asyncHandler(async (req,res)=>{

 const incomingRefreshToken =  req.cookie.refreshToken || req.body.refreshToken

 if(!incomingRefreshToken){
   throw new ApiError(401, "Unauthorized request")
 }


 try {
  const decodedToken = jwt.verify( 
   incomingRefreshToken,
   process.env.REFRESH_TOKEN_SECRET
  )
 
  const user = await User.findById(decodedToken?._id);
 
  if(!user){
    throw new ApiError(401,"Invalid refresh token")
   }
 
   if(incomingRefreshToken!== user?.refreshToken){
      throw new ApiError(401,  "Refresh token is expired or used")
   }
 
   const options = {
      httpOnly:true ,
      secure:true
   }
  
    const {accessToken,newRefreshToken} = await generateAccessAndRefreshTokens(user._id)
 
    return res
    .status(200)
    .cookie("accessToken",accessToken,options)
    .cookie("refreshToken",newRefreshToken,options)
    .json(
     new ApiResponse(
       200,
       { accessToken, refreshToken: newRefreshToken } ,
       "Access Token refreshed"
     )
    )
 
 } catch (error) {
   throw new ApiError(401,error?.message || "Invalid refresh Token")
 }
  })

export const changeCurrentPassword = asyncHandler(async(req,res)=>{

  const {oldPassword,newPassword} = req.body;

  const user = await User.findById(req.user?._id);

  const isPasswordCorrect  = await user.isPasswordCorrect(oldPassword);


  if(!isPasswordCorrect){
     throw new ApiError(400,"Invalid old password")
  }

  user.password = newPassword;
  await user.save({validateBeforeSave: false})
  
  return res
  .status(200)
  .json(new ApiResponse(200,{},"Password changed successfully"))
})
 
export const  getCurrentUser = asyncHandler(async(req,res)=>{


  return res
  .status(200)
  .json(200, req.user, "current user fetched successfully")

})


export const updateAccountDetails = asyncHandler(async(req,res)=>{


  const {fullname,email} = req.body

  if(!fullname || !email){
    throw new ApiError(400,"All fields are required")
  }

  const user = User.findByIdAndDelete(

     req.user?._id ,{
      $set: {
        fullname: fullname,
        email: email
      }

     },
     {
      new: true
     }


  ).select("-password")


 return res
 .status(200)
 .json(new ApiResponse(200,user,"Account details updated successfully"))
})


export const updateUserAvatar = asyncHandler(async(req,res)=>{

  const avatarLocalPath = req.file?.path

  if(!avatarLocalPath){
    throw new ApiError(400,"Avatar file is missing")
  }

  const avatar = await uploadOnCloudnary(avatarLocalPath)


   if(!avatar.url){
      
      throw new ApiError(400, "Error while uploading avatar on cloudinary")
   
    }
  const user = await User.findByIdAndUpdate(

     req.user?._id,
     {
       $set:{
         avatar:avatar.url
       }
     },
     {new:true}
    
  ).select("-password")


 return res
 .status(200)
 .json(new ApiResponse(200,user,"Avatar uploaded successfully"))

})

export const updateUserCover = asyncHandler(async(req,res)=>{

  const coverLocalPath = req.file?.path

  if(!coverLocalPath ){
    throw new ApiError(400,"Avatar file is missing")
  }

  const cover = await uploadOnCloudnary(avatarLocalPath)


   if(!cover.url){
      
      throw new ApiError(400, "Error while uploading cover on cloudinary")
   
    }

    const user = await User.findByIdAndUpdate(

     req.user?._id,
     {
       $set:{
         cover:cover.url
       }
     },
     {new:true}
    
  ).select("-password")


 return res
 .status(200)
 .json(new ApiResponse(200,user,"Cover uploaded successfully"))


})