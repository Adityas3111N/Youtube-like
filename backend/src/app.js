import cors from "cors";
import cookieParser from "cookie-parser";
import express from "express";

const app = express();

// Error handler for uncaught app errors
app.on("error", (error) => {
    console.error("Application error:", error);
    process.exit(1);
});

// Robust CORS configuration for production
const corsOptions = {
    origin: (origin, callback) => {
        // Allow requests with no origin (mobile apps, Postman, etc.)
        if (!origin) return callback(null, true);
        
        const allowedOrigins = process.env.CORS_ORIGIN?.split(",") || [];
        
        if (allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error(`Origin ${origin} not allowed by CORS`));
        }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "Cookie"],
    exposedHeaders: ["Set-Cookie"],
    optionsSuccessStatus: 200 // Legacy browser support
};

// Additional manual CORS headers for better cookie support
app.use((req, res, next) => {
    const origin = req.headers.origin;
    const allowedOrigins = process.env.CORS_ORIGIN?.split(",") || [];
    
    if (allowedOrigins.includes(origin)) {
        res.setHeader('Access-Control-Allow-Origin', origin);
        res.setHeader('Access-Control-Allow-Credentials', 'true');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Cookie');
        res.setHeader('Access-Control-Expose-Headers', 'Set-Cookie');
    }
    
    if (req.method === 'OPTIONS') {
        return res.sendStatus(200);
    }
    
    next();
});

// Middleware stack
app.use(cors(corsOptions));
app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(express.static("public"));
app.use(cookieParser());

// Route imports and registration
import userRouter from "./routes/user.routes.js";
import videoRouter from "./routes/video.routes.js";
import commentRouter from "./routes/comments.routes.js";
import subscriptionRouter from "./routes/subscription.routes.js";
import playlistRouter from "./routes/playlist.routes.js";

app.use("/api/v1/users", userRouter);
app.use("/api/v1/videos", videoRouter);
app.use("/api/v1/comments", commentRouter);
app.use("/api/v1/subscription", subscriptionRouter);
app.use("/api/v1/playlist", playlistRouter);

// Health check endpoint
import { healthCheck } from "./controllers/health.controller.js";
app.get("/api/v1/health", healthCheck);

// Global error handler
app.use((error, req, res, next) => {
    if (error.message?.includes("CORS")) {
        return res.status(403).json({ 
            success: false, 
            message: "CORS policy violation" 
        });
    }
    
    console.error("Unhandled error:", error);
    res.status(500).json({ 
        success: false, 
        message: "Internal server error" 
    });
});

// 404 handler
app.use("*", (req, res) => {
    res.status(404).json({ 
        success: false, 
        message: `Route ${req.originalUrl} not found` 
    });
});

export { app };