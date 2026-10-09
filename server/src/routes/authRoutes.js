import express from "express";

import {
  registerUser,
  requestRegistrationEmailOtp,
  verifyRegistrationEmailOtp,
  loginUser,
  getCurrentUser,
  updateUserProfile,
  logoutUser,
} from "../controllers/authController.js";

import protectMiddleware from "../middleware/authMiddleware.js";

const authRouter = express.Router();

// Prefix: "/api/v1/auth"
authRouter.post("/register", registerUser);
authRouter.post("/register/request-otp", requestRegistrationEmailOtp);
authRouter.post("/register/verify-otp", verifyRegistrationEmailOtp);
authRouter.post("/login", loginUser);
authRouter.get("/me", protectMiddleware, getCurrentUser);
authRouter.put("/profile", protectMiddleware, updateUserProfile);
authRouter.post("/logout", protectMiddleware, logoutUser);

export default authRouter;
