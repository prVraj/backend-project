import { asyncHandler } from "../utils/requestHandler.js";
import ApiError from "../utils/ApiError.js"
import { User } from "../models/user.model.js";
import uploadOnCloudinary from "../utils/cloudinary.js";
import ApiResponse from "../utils/ApiResponce.js";
import jwt from "jsonwebtoken"


// getting refresh and access tokens
const generateAccessAndRefereshTokens = async(userId) =>{
  try {
      const user = await User.findById(userId)
      if (!user) {
        throw new ApiError(404, "User not found");
      }
      
      const accessToken = user.generateAccessToken()
      const refreshToken = user.generateRefreshToken()

      user.refreshToken = refreshToken
      await user.save({ validateBeforeSave: false })

      return {accessToken, refreshToken}


  } catch (error) {
    console.error("Error generating tokens:", error);
    throw new ApiError(500, "Something went wrong while generating referesh and access token")
  }
}

const option = {
  httpOnly: true,
  secure: true
}


// logic of register User
const registerUser = asyncHandler( async (req, res) => {
  
  const {username, fullname, email, password} = req.body
  // console.log(`email: ${email}\nusername: ${username}`);


  // handle empty name error

  if (
    [username, fullname, email, password].some((fields) => 
      fields?.trim() === "" )
  ) {
    throw new ApiError(400, "All given fields required!!")
  }



  // handle existed user 

  const existedUser = await User.findOne({
    $or: [{ email }, { username }]
  })
  // console.log(existedUser);
  
  
  if (existedUser) {
    throw new ApiError(409, "User already exists!")
  }


  //handle avatar and cover image problems

  const localAvatar = req.files?.avatar[0]?.path;
  // const localCoverImg = req.files?.coverImg[0]?.path;

  let localCoverImg;
  if (req.files && Array.isArray(req.files.coverImg) && req.files.coverImg.lenght > 0) {
    localCoverImg = req.files.coverImg[0].path;
  }

  if (!localAvatar) {
    throw new ApiError(400, "Avatar is required!")
  }

  const avatar = await uploadOnCloudinary(localAvatar)
  const coverImg = await uploadOnCloudinary(localCoverImg)

  if (!avatar) {
    throw new ApiError(400,"Avatar is required!")
  }


  // add user in DB

  const user = await User.create({
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
    throw new ApiError(500, "Something went wrong while creating a user!")
  }

  return res.status(201).json(
    new ApiResponse(200, createdUser, "User created successfully!")
  )

});


// logic of login User
const loginUser = asyncHandler( async (req, res) => {

  const {email, username, password} = req.body

  // checking user enters required field or not
  if (!username && !email) {
    throw new ApiError(400, "either Username or Email is required!");
  }


  // if (!(username || email)) {
  //   throw new ApiError(400, "either Username or Email is required!");
  // }

  // user is exist or not
   const user = await User.findOne({
     $or: [{username}, {email}]
  })

  if (!user) {
    throw new ApiError(404, "User not found! Please register first")
  }

  // password validation
  const isPasswordValid = await user.isPasswordCorrect(password);

  if (!isPasswordValid) {
    throw new ApiError(401, "password is not matched!");
  }

  const { accessToken, refreshToken } = await generateAccessAndRefereshTokens(user._id);

  // refuse fields which we don't want
  const loggedInUser = await User.findById(user._id).select(" -password -refreshToken ")
  
  return res
  .status( 200 )
  .cookie( "accessToken", accessToken, option )
  .cookie( "refreshToken", refreshToken, option )
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


// logic of logout User

const logoutUser = asyncHandler(async( req, res ) => {
  
  await User.findByIdAndUpdate(
    req.body._id,
    {
      $set : {
        refreshToken: undefined,
      }
    },
    {
      new: true
    }

  )

  return res
  .status(200)
  .clearCookie("accessToken", option)
  .clearCookie("refreshToken", option)
  .json( new ApiResponse (200, {}, "User logged out successfully"))

})

const refreshAccessToken = asyncHandler( async ( req, res ) => {

  const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken;

  if ( !incomingRefreshToken ) {
    throw new ApiError( 401, "Unathorized token request" )
  }

try {
    const decodedToken = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET,
    )
  
    const user = await User.findById(decodedToken?._id)
  
    if ( !user ) {
      throw new ApiError( 401, "Invalid refresh token" )
    }
    
    if ( incomingRefreshToken !== user?.refreshToken ) {
      throw new ApiError( 401, "This token is expired or used" ) 
    }
  
    const { accessToken, newRefreshToken } = await generateAccessAndRefereshTokens( user._id )
  
    return res
    .status( 200 )
    .cookie( "accessToken", accessToken, option )
    .cookie( "refreshToken", newRefreshToken, option )
    .json(
      new ApiResponce(
        200,
        "Refresh token generated successfully",
        { accessToken, newRefreshToken }
      )
    )
} catch (error) {
  throw new ApiError( 401, "Invalid refresh token" || error?.message )
}

})

export {
  registerUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
}
