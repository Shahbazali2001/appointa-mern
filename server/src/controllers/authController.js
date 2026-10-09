import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

// Model Import
import User from "../models/User.js";

// Util Function Import
import { requestEmailOtp, verifyEmailOtp } from "../utils/emailOTP.js";
import slugify from "../utils/slug.js";

// Async Handler Import
import asyncHandler from "../utils/asyncHandler.js";
import { logou } from "./authController";

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

// Request Registration OTP

export const requestRegistrationEmailOtp = asyncHandler(async (req, res) => {
  const { email } = req.body;

  if (!email) {
    res.status(400);
    throw new Error("Email is required");
  }

  const normalizedEmail = email.trim().toLowerCase();

  const userExists = await User.findOne({ email: normalizedEmail });

  if (userExists) {
    res.status(400);
    throw new Error("User already exists");
  }

  const otpRequestResult = await requestEmailOtp({
    email: normalizedEmail,
    purpose: "registration",
  });

  res.status(200).json({
    message: "OTP sent successfully",
    ...otpRequestResult,
  });
});

// Verify Registration OTP
export const verifyRegistrationEmailOtp = asyncHandler(async (req, res) => {
  const { email, emailOtp } = req.body;

  if (!email || !emailOtp) {
    res.status(400);
    throw new Error("Email and code are required");
  }

  const normalizedEmail = email.trim().toLowerCase();

  const userExists = await User.findOne({ email: normalizedEmail });

  if (userExists) {
    res.status(400);
    throw new Error("User already exists");
  }

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

  res.status(200).json({
    message: "OTP verified successfully",
    email: normalizedEmail,
  });
});

// Login User
export const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400);
    throw new Error("Email and password are required");
  }

  const normalizedEmail = email.trim().toLowerCase();

  const user = await User.findOne({ email: normalizedEmail });

  if (!user) {
    res.status(400);
    throw new Error("Invalid email or password");
  }

  const isMatch = await bcrypt.compare(password, user.password);

  if (!isMatch) {
    res.status(400);
    throw new Error("Invalid email or password");
  }

  const token = createToken(user._id);

  res.status(200).json({
    message: "User logged in successfully",
    user: toUserResponse(user),
    token,
  });
});

// Get Current User
export const getCurrentUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id).select("-password");

  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }

  res.status(200).json({
    user: toUserResponse(user),
  });
});

// Update User Profile
export const updateUserProfile = asyncHandler(async (req, res) => {
  const {
    businessName,
    businessDescription,
    timezone,
    brandTheme,
    brandAccent,
  } = req.body;

  const user = await User.findById(req.user.id);

  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }

  if (businessName !== undefined) user.businessName = businessName;
  if (businessDescription !== undefined)
    user.businessDescription = businessDescription;
  if (timezone !== undefined) user.timezone = timezone;
  if (brandTheme !== undefined) user.brandTheme = brandTheme;
  if (brandAccent !== undefined) user.brandAccent = brandAccent;

  const baseSlug = slugify(user.businessName || user.name) || "business";
  let finalSlug = baseSlug;
  let counter = 1;

  while (await User.findOne({ slug: finalSlug, _id: { $ne: user._id } })) {
    finalSlug = `${baseSlug}-${counter}`;
    counter += 1;
  }

  user.slug = finalSlug;

  await user.save();

  res.status(200).json({
    message: "Profile updated successfully",
    user: toUserResponse(user),
  });
});

// Logout User
export const logoutUser = asyncHandler(async (req, res) => {
  res.status(200).json({
    message: "User logged out successfully",
  });
});
