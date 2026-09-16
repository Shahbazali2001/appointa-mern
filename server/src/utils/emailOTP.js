import bcrypt from "bcryptjs";
import crypto from "crypto";

// Model Import
import EmailOtp from "./../models/EmailOtp";

// Util Function Import
import { sendOtpNotification } from "./bookingNotification.js";

const normalizeEmail = (email = "") => {
  return email.trim().toLowerCase();
};

const createCode = () => {
  const otpCode = crypto.randomInt(100000, 999999).toString();
  return otpCode;
};

// Request Email OTP
export const requestEmailOtp = async ({ email, purpose }) => {
  const normalizedEmail = normalizeEmail(email);
  if (!normalizedEmail) {
    throw new Error("Email is required");
  }
  const code = createCode();
  const hashedCode = await bcrypt.hash(code, 10);
  const expiresAt = new Date(
    Date.now() + process.env.OTP_EXPIRATION_TIME * 60 * 1000,
  ); // Set expiration time based on expiration time in minutes

  await EmailOtp.deleteMany({
    email: normalizedEmail,
    consumedAt: null,
    purpose,
  }); // Remove any existing OTPs for the same email and purpose
  await EmailOtp.create({
    email: normalizedEmail,
    purpose,
    codeHash: hashedCode,
    expiresAt,
  });

  await sendOtpNotification({ email: normalizedEmail, code, purpose });

  return {
    sent: true,
    email: normalizedEmail,
    expiresInMinutes: process.env.OTP_EXPIRATION_TIME,
  };
};

// Verify Email OTP
export const verifyEmailOtp = async ({
  email,
  purpose,
  code,
  consume = false,
}) => {
  const normalizedEmail = normalizeEmail(email);
  if (!normalizedEmail || !code) {
    throw new Error("Email and code are required");
  }

  const otpRecord = await EmailOtp.findOne({
    email: normalizedEmail,
    purpose,
    consumedAt: null,
    expiresAt: { $gt: new Date() },
  }).sort({ createdAt: -1 });

  if (!otpRecord) {
    throw new Error("Invalid email or code");
  }

  if (otpRecord.attempts >= process.env.MAX_OTP_ATTEMPTS) {
    throw new Error("Too many attempts. Please try again later.");
  }

  const isValid = await bcrypt.compare(String(code).trim(), otpRecord.codeHash);
  if (!isValid) {
    otpRecord.attempts += 1;
    await otpRecord.save();
    throw new Error("Invalid email or code");
  }

  if (consume) {
    otpRecord.consumedAt = new Date();
    await otpRecord.save();
  }

  return {
    verified: true,
    email: normalizedEmail,
  };
};
