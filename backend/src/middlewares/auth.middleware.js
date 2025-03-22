import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken"
import { User } from "../models/user.model.js";

//we will use this middleware alot. like when user like, download, create playlist, upload, edit username, video discription and alot.
export const verifyJWT = asyncHandler(
    async (req, res, next) => {
       try {
         const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "");
 
         if(!token){
             throw new ApiError(401, "unauthorized request")
         }
 
         const decodedTokenInfo = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)
 
         const user = await User.findById(decodedTokenInfo._id).select("-password -refreshToken")
         if(!user){
             //todo: discuss about frontend.
             throw new ApiError(401, "invalid access token")
         }
 
         req.user = user;
         next();
       } catch (error) {
        throw new ApiError(401, error?.message || "invalid access token")
       }
    }
)