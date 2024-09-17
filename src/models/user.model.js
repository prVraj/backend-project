import mongoose, { model, Schema } from "mongoose";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

const fullNameSchema = new Schema(
  {
    firstname: {
      type: String,
      required: true,
      lowercase: true,
      index: true,
    },
    secondname: {
      type: String,
      required: true,
      lowercase: true,
      index: true,
    },
  },
  { timestamps: true }
);

const userSchema = new Schema(
  {
    username: {
      type: String,
      required: [true, "User name is required!"],
      lowercase: true,
      unique: true,
      index: true,
    },
    emial: {
      type: String,
      required: [true, "Email is required!"],
      lowercase: true,
      unique: true,
    },
    fullname: [fullNameSchema],
    avtar: {
      type: String,
      required: [true, "avtar is required!"],
    },
    coverImg: {
      type: String,
    },
    watchHistory: {
      type: Schema.Types.ObjectId,
      ref: "Video",
    },
    password: {
      type: String,
      required: [true, "password is required!"],
    },
    refreshToken: {
      type: String,
    },
  },
  { timestamps: true }
);

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();

  this.password = bcrypt.hash(this.password, 8);
  next();
});

userSchema.methods.isPasswordCorrect = async function(password) {
  return await bcrypt.compare(password, this.password)
}
userSchema.methods.generateAccessToken = function () {
  return jwt.sign(
    {
      _id: this._id,
      username: this.username,
      email: this.email,
      fullname: this.fullname
    },
    process.env.ACCESS_TOKEN_SECRET,
    {
      expiresIn: ACCESS_TOKEN_EXPIRY
    }
  )
}
userSchema.methods.generateRefreshToken = function () {
  return jwt.sign(
    {
      _id: this._id,
    },
    process.env.REFRESH_TOKEN_SECRET,
    {
      expiresIn: REFRESH_TOKEN_EXPIRY
    }
  )
}

export const User = model("User", userSchema);
