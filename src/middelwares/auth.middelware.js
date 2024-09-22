import ApiError from "../utils/ApiError";
import { asyncHandler } from "../utils/requestHandler"
import jwt from "jsonwebtoken"
import { User } from "../models/user.model";

export const verifyJWT = asyncHandler(async ( req, _, next ) => {

try {
        const token = req.cookie?.accessToken || req.header("Authorization")?.replace("Bearer ", "");
        
        if (!token) {
            throw new ApiError(402, "Unauthorized request!")
        }
    
        const decodedTokenInfo = jwt.verify( token, procces.env.ACCESS_TOKEN_SECRET )
        
        const user = await User.findById(decodedTokenInfo?._id).select(" -password -refreshToken");
    
        if (!user) {
            throw new ApiError(403, "Invalid access token");
        }
    
        req.user = user;
        next()

} catch (error) {
    throw new ApiError( 401, error.message || "Invalid access token" )
}

})