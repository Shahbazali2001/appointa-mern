import express from "express";
import cors from "cors";

// Utility Imports
import ApiError from "./utils/apiError.js";

// Middleware Imports
import { errorHandler } from "./middleware/errorMiddleware.js";

// Route Imports
// import authRoutes from "./routes/authRoutes.js";

// Initialize App
const app = express();

// 1. Global Pre-Route Middlewares

// CORS Configuration
app.use(
  cors({
    origin: process.env.CORS_ORIGIN?.split(",") || "http://localhost:5173",
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

// Body Parsers
app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));

// Static Assets
app.use(express.static("public"));

// 2. Health Check & Base Routes
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "ok",
    message: "Server is healthy and running",
    timestamp: new Date().toISOString(),
  });
});

// 3. API Routes
// app.use("/api/v1/auth", authRoutes);

// 4. 404 Not Found Handler (Unmatched Routes)

app.use((req, res, next) => {
  next(new ApiError(404, `Route not found: ${req.originalUrl}`));
});

// 5. Global Error Handling Middleware (Always Last)
app.use(errorHandler);

export default app;
