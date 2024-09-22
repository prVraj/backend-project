import ApiError from "../utils/ApiError.js";
import { asyncHandler } from "../utils/requestHandler.js"
import jwt from "jsonwebtoken"
import { User } from "../models/user.model.js";

export const verifyJWT = asyncHandler(async ( req, _, next ) => {

try {
        const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "");
        
        if (!token) {
            throw new ApiError(402, "Unauthorized request!")
        }
        
        // verify that user have correct token or not
        const decodedTokenInfo = jwt.verify( token, process.env.ACCESS_TOKEN_SECRET )
        
        const user = await User.findById(decodedTokenInfo?._id).select(" -password -refreshToken");
    
        if (!user) {
            throw new ApiError(403, "Invalid access token");
        }
    
        req.user = user;
        next()

} catch (error) {
    throw new ApiError( 401, error?.message )
}

})