import mongoose from "mongoose";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const healthCheck = asyncHandler(async (req, res) => {
  const dbStatus = mongoose.connection.readyState === 1 ? "connected" : "disconnected";

  return res
    .status(200)
    .json(
      new ApiResponse(200, {
        message: "Backend is healthy 🚀",
        uptime: process.uptime(),
        timestamp: new Date(),
        database: dbStatus,
      })
    );
});

export { healthCheck };
