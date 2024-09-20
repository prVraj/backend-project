import { asyncHandler } from "../utils/requestHandler.js";
import ApiError from "../utils/ApiError.js"
import { User } from "../models/user.model.js";
import uploadOnCloudinary from "../utils/cloudinary.js";
import ApiResponse from "../utils/ApiResponce.js";

const registerUser = asyncHandler( async (req, res) => {
  
  const {username, fullname, email, password} = req.body
  console.log(`email: ${email}\nusername: ${username}`);


  // handle empty name error

  if (
    [username, fullname, email, password].some((fields) => 
      fields?.trim() === "" )
  ) {
    throw new ApiError(400, "All given feilds required!!")
  }



  // handle existed user 

  const existedUser =  User.findOne({
    $or: [{ email }, { username }]
  })
  // console.log(existedUser);
  
  
  if (existedUser) {
    throw new ApiError(409, "User already exists!")
  }


  //handle avatar problems

  const localAvatar = req.files?.avatar[0]?.path;
  const localCoverImg = req.files?.coverImg[0]?.path;

  if (!localAvatar) {
    throw new ApiError(400, "Avatar is required!")
  }

  const avatar = await uploadOnCloudinary(localAvatar)
  const coverImg = await uploadOnCloudinary(localCoverImg)

  if (!avatar) {
    throw new ApiError(400,"Avatar is required!")
  }


  // add user in DB

  const user = User.create({
    fullname,
    username: username.toLowerCase(),
    avatar: avatar.url,
    coverImg: coverImg?.url || "",
    email: email.toLowerCase(),
    password,
  })

  const createdUser = await User.findById(user._id).select(
      "-password -refreshToken"
  )

  if (!createdUser) {
    throw new ApiError(500, "Something went wrong whilee creating a user!")
  }

  return res.status(201).json(
    new ApiResponse(200, createdUser, "User created successfully!")
  )

});


export {registerUser}
