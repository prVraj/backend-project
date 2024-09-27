import { asyncHandler } from "../utils/requestHandler.js";
import ApiError from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import {uploadOnCloudinary, deleteFromCloudinary} from "../utils/cloudinary.js";
import ApiResponse from "../utils/ApiResponce.js";
import jwt from "jsonwebtoken";

// getting refresh and access tokens
const generateAccessAndRefereshTokens = async (userId) => {
  try {
    const user = await User.findById(userId);
    if (!user) {
      throw new ApiError(404, "User not found");
    }

    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };
  } catch (error) {
    console.error("Error generating tokens:", error);
    throw new ApiError(
      500,
      "Something went wrong while generating referesh and access token"
    );
  }
};

const option = {
  httpOnly: true,
  secure: true,
};

// logic of register User
const registerUser = asyncHandler(async (req, res) => {
  const { username, fullname, email, password } = req.body;
  // console.log(`email: ${email}\nusername: ${username}`);

  // handle empty name error

  if (
    [username, fullname, email, password].some(
      (fields) => fields?.trim() === ""
    )
  ) {
    throw new ApiError(400, "All given fields required!!");
  }

  // handle existed user

  const existedUser = await User.findOne({
    $or: [{ email }, { username }],
  });
  // console.log(existedUser);

  if (existedUser) {
    throw new ApiError(409, "User already exists!");
  }

  //handle avatar and cover image problems

  const localAvatar = req.files?.avatar[0]?.path;
  // const localCoverImg = req.files?.coverImg[0]?.path;

  let localCoverImg;
  if (
    req.files &&
    Array.isArray(req.files.coverImg) &&
    req.files.coverImg.lenght > 0
  ) {
    localCoverImg = req.files.coverImg[0].path;
  }

  if (!localAvatar) {
    throw new ApiError(400, "Avatar is required!");
  }

  const avatar = await uploadOnCloudinary(localAvatar);
  const coverImg = await uploadOnCloudinary(localCoverImg);

  if (!avatar) {
    throw new ApiError(400, "Avatar is required!");
  }

  // add user in DB

  const user = await User.create({
    fullname,
    username: username.toLowerCase(),
    avatar: avatar.url,
    coverImg: coverImg?.url || "",
    email: email.toLowerCase(),
    password,
  });

  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  if (!createdUser) {
    throw new ApiError(500, "Something went wrong while creating a user!");
  }

  return res
    .status(201)
    .json(new ApiResponse(200, createdUser, "User created successfully!"));
});

// logic of login User
const loginUser = asyncHandler(async (req, res) => {
  const { email, username, password } = req.body;

  // checking user enters required field or not
  if (!username && !email) {
    throw new ApiError(400, "either Username or Email is required!");
  }

  // if (!(username || email)) {
  //   throw new ApiError(400, "either Username or Email is required!");
  // }

  // user is exist or not
  const user = await User.findOne({
    $or: [{ username }, { email }],
  });

  if (!user) {
    throw new ApiError(404, "User not found! Please register first");
  }

  // password validation
  const isPasswordValid = await user.isPasswordCorrect(password);

  if (!isPasswordValid) {
    throw new ApiError(401, "password is not matched!");
  }

  const { accessToken, refreshToken } = await generateAccessAndRefereshTokens(
    user._id
  );

  // refuse fields which we don't want
  const loggedInUser = await User.findById(user._id).select(
    " -password -refreshToken "
  );

  return res
    .status(200)
    .cookie("accessToken", accessToken, option)
    .cookie("refreshToken", refreshToken, option)
    .json(
      new ApiResponse(
        200,
        {
          user: loggedInUser,
          accessToken,
          refreshToken,
        },
        "User logged In Successfully"
      )
    );
});

// logic of logout User

const logoutUser = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(
    req.body._id,
    {
      $set: {
        refreshToken: undefined,
      },
    },
    {
      new: true,
    }
  );

  return res
    .status(200)
    .clearCookie("accessToken", option)
    .clearCookie("refreshToken", option)
    .json(new ApiResponse(200, {}, "User logged out successfully"));
});

// logic of access token
const refreshAccessToken = asyncHandler(async (req, res) => {
  const incomingRefreshToken =
    req.cookies.refreshToken || req.body.refreshToken;

  if (!incomingRefreshToken) {
    throw new ApiError(401, "Unathorized token request");
  }

  try {
    const decodedToken = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
    );

    const user = await User.findById(decodedToken?._id);

    if (!user) {
      throw new ApiError(401, "Invalid refresh token");
    }

    if (incomingRefreshToken !== user?.refreshToken) {
      throw new ApiError(401, "This token is expired or used");
    }

    const { accessToken, newRefreshToken } =
      await generateAccessAndRefereshTokens(user._id);

    return res
      .status(200)
      .cookie("accessToken", accessToken, option)
      .cookie("refreshToken", newRefreshToken, option)
      .json(
        new ApiResponce(200, "Refresh token generated successfully", {
          accessToken,
          newRefreshToken,
        })
      );
  } catch (error) {
    throw new ApiError(401, "Invalid refresh token" || error?.message);
  }
});

// change the password
const changeCurrentUserPassword = asyncHandler(async (req, res) => {
  const { oldPassword, newPassword, confPassword } = req.body;

  if (!(newPassword === confPassword)) {
    throw new ApiError(402, "new and confirm password are not same");
  }

  const user = await User.findById(user.req?._id);

  const isPasswordMatch = user.isPasswordCorrect(oldPassword);

  if (!isPasswordMatch) {
    throw new ApiError(400, "Invalid current password");
  }

  user.password = newPassword;

  await user.save({ validateBeforeSave: false });

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "password changed successfully"));
});

const getCurrentUser = asyncHandler(async (req, res) => {
  const user = req.user;

  return res
    .status(200)
    .json(new ApiResponse(200, user, "current user fetched successfully"));
});

// update user
const updateAccountDetails = asyncHandler(async (req, res) => {
  const { username, email, fullname } = req.body;

  if (!(username || email || fullname)) {
    throw new ApiError(401, "use another name or email");
  }

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        username,
        email,
        fullname,
      },
    },
    { new: true }
  ).select("-password");

  return res
    .status(200)
    .json(new ApiResponse(200, user, "Account details updated successfully"));
});

// update avatar and cover image
const updateUserAvatar = asyncHandler(async (req, res) => {
  const localAvatarPath = req.file?.path;

  if (!localAvatarPath) {
    throw new ApiError(
      302,
      "provided path of avatar maybe changed or something"
    );
  }

  const user = await User.findById(req.user?._id);
  if (!user) {
    throw new ApiResponse(404, "User not found");
  }

  const oldAvatar = user.avatar;

  const avatar = await uploadOnCloudinary(localAvatarPath);

  if (!avatar) {
    throw new ApiError(402, "url of avatar is not found");
  }

  if (oldAvatar) {
    await deleteFromCloudinary();
  }

  const updatedUser = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        avatar: avatar.url,
      },
    },
    { new: true }
  ).select("-password");

  return res
    .status(200)
    .json(new ApiResponse(200, updatedUser, "avatar is updated successfully"));
});

const updateUserCoverImage = asyncHandler(async (req, res) => {
  const localCoverImagePath = req.file?.path;

  if (!localCoverImagePath) {
    throw new ApiError(
      302,
      "provided path of cover image maybe changed or something"
    );
  }

  const coverImg = await uploadOnCloudinary(localCoverImagePath);

  if (!coverImg) {
    throw new ApiError(402, "url of cover image is not found");
  }

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        coverImg: coverImg.url,
      },
    },
    { new: true }
  ).select("-password");

  return res
    .status(200)
    .json(new ApiResponse(200, user, "cover image is updated successfully"));
});

const getUserChannelProfile = asyncHandler( async (req, res) => {

  const {username} = req.params

  if (username) {
    throw new ApiError(400, "username is not define")
  }

  const channel = await User.aggregate([
    {
      $match: {
        username: username?.toLowerCase()
      }
    },
    {
        $lookup: {
          from: "subscriptions",
          localField: "_id",
          foreignField: "channel",
          as: "subscribers"
        }
    },
    {
      $lookup: {
        from: "subscriptions",
        localField: "_id",
        foreignField: "subscriber",
        as: "subscribedTo"
      }
    },
    {
      $addFields: {
        // total subscribers of your channel
        subscribersCount: {
          $size: "$subscribers"
        },
        // this is for channels that you subscribe
        channelsYouSubscribed: {
          $size: "$subscribedTo"
        },
        // this is to show subscribe button is 'true || false'
        isSubscribed:{
          $cond: {
            if: { $in: [req.user?._id , "$subscribers.subscriber"] },
            then: true,
            else: false
          }
        }
      }
    },
    // which fields you want to show 
    {
      $project: {
        fullname: 1,
        username: 1,
        avatar: 1,
        coverImg: 1,
        createdAt: 1,
        subscribersCount: 1,
        channelsYouSubscribed: 1,
        isSubscribed: 1
      }
    }
  ])

  if (!channel?.length) {
    throw new ApiError( 400, "channel does not found or exist" )
  }

  return res
  .status(200)
  .json(
    new ApiResponse( 200, channel[0], "channel fetched successfully" )
  )

} )

export {
  registerUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  changeCurrentUserPassword,
  getCurrentUser,
  updateAccountDetails,
  updateUserAvatar,
  updateUserCoverImage,
  getUserChannelProfile,
};
