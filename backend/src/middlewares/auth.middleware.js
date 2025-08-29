import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken";
import { User } from "../models/user.model.js";

// Middleware for mandatory authentication
export const verifyJWT = asyncHandler(async (req, _, next) => {
  try {
    // Extract token from Authorization header
    const authHeader = req.header("Authorization");
    const token = authHeader?.startsWith("Bearer ") 
      ? authHeader.replace("Bearer ", "") 
      : null;

    if (!token) {
      throw new ApiError(401, "Unauthorized request: No access token provided");
    }

    // Verify JWT token
    const decodedTokenInfo = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

    // Fetch user from database, excluding sensitive fields
    const user = await User.findById(decodedTokenInfo._id).select("-password -refreshToken");
    if (!user) {
      throw new ApiError(401, "Invalid access token: User not found");
    }

    // Attach user to request object
    req.user = user;
    next();
  } catch (error) {
    // Handle specific JWT errors for better clarity
    if (error instanceof jwt.TokenExpiredError) {
      throw new ApiError(401, "Access token expired");
    } else if (error instanceof jwt.JsonWebTokenError) {
      throw new ApiError(401, "Invalid access token");
    }
    throw new ApiError(401, error?.message || "Authentication failed");
  }
});

// Middleware for optional authentication
export const optionalJWT = asyncHandler(async (req, _, next) => {
  try {
    // Extract token from Authorization header, if present
    const authHeader = req.header("Authorization");
    const token = authHeader?.startsWith("Bearer ") 
      ? authHeader.replace("Bearer ", "") 
      : null;

    if (!token) {
      return next(); // No token provided, proceed as anonymous
    }

    // Verify JWT token
    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

    // Fetch user from database, excluding sensitive fields
    const user = await User.findById(decoded._id).select("-password -refreshToken");

    if (user) {
      // Attach user to request object if found
      req.user = user;
    }

    next();
  } catch (error) {
    // Log error for debugging but proceed as anonymous
    console.error("Optional JWT validation failed:", error.message);
    next();
  }
});