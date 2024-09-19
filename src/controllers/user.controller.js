import { asyncHandler } from "../utils/requestHandler.js";

const registerUser = asyncHandler( async (req, res) => {
  res.status(200).json({
    message: "Yo Hacker",
  });
});


export {registerUser}
