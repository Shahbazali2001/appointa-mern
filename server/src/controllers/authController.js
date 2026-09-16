import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

// Model Import
import User from "../models/User.js";

// Util Function Import
import { requestEmailOtp, verifyEmailOtp } from "../utils/emailOTP.js";
import slugify from "../utils/slug.js";

// Async Handler Import
import asyncHandler from "../utils/asyncHandler.js";

//Create Token
const createToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET_KEY, {
    expiresIn: process.env.JWT_EXPIRATION_TIME,
  });
};

const toUserResponse = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  slug: user.slug,
  businessName: user.businessName,
  businessDescription: user.businessDescription,
  brandTheme: user.brandTheme,
  brandAccent: user.brandAccent,
  timezone: user.timezone,
  googleCalendarConnected: user.googleCalendarConnected,
  googleCalendarId: user.googleCalendarId,
  payoutDetails: user.payoutDetails,
  stripeConfigured: Boolean(process.env.STRIPE_SECRET_KEY),
});
