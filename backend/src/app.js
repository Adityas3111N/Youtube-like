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

// Middleware stack
app.use(cors(corsOptions));
app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(express.static("public"));
app.use(cookieParser());

// Route imports and registration
const routes = [
    { path: "/api/v1/users", router: () => import("./routes/user.routes.js") },
    { path: "/api/v1/videos", router: () => import("./routes/video.routes.js") },
    { path: "/api/v1/comments", router: () => import("./routes/comments.routes.js") },
    { path: "/api/v1/subscription", router: () => import("./routes/subscription.routes.js") },
    { path: "/api/v1/playlist", router: () => import("./routes/playlist.routes.js") }
];

// Dynamic route registration
routes.forEach(async ({ path, router }) => {
    const { default: routeHandler } = await router();
    app.use(path, routeHandler);
});

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