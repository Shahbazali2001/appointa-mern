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

// Register User
export const registerUser = asyncHandler(async (req, res) => {
  const {
    name,
    email,
    password,
    businessName,
    businessDescription,
    timezone,
    emailOtp,
  } = req.body;

  if (!name || !email || !password || !emailOtp) {
    res.status(400);
    throw new Error("Please provide all required fields");
  }

  const normalizedEmail = email.trim().toLowerCase();

  const userExists = await User.findOne({ email: normalizedEmail });

  if (userExists) {
    res.status(400);
    throw new Error("User already exists");
  }

  // Verify Email OTP

  const otpVerificationResult = await verifyEmailOtp({
    email: normalizedEmail,
    purpose: "registration",
    code: emailOtp,
    consume: true,
  });

  if (!otpVerificationResult.verified) {
    res.status(400);
    throw new Error("Invalid or expired OTP");
  }

  const baseSlug = slugify(businessName || name) || "business-name";

  let finalSlug = baseSlug;
  let slugCounter = 1;

  while (await User.findOne({ slug: finalSlug })) {
    finalSlug = `${baseSlug}-${slugCounter}`;
    slugCounter += 1;
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await User.create({
    name,
    email: normalizedEmail,
    password: hashedPassword,
    slug: finalSlug,
    businessName,
    businessDescription,
    timezone,
  });

  const token = createToken(user._id);

  res.status(201).json({
    message: "User registered successfully",
    user: toUserResponse(user),
    token,
  });
});
