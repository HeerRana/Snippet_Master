import asyncHandler from "express-async-handler";
import crypto from "node:crypto";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { OAuth2Client } from "google-auth-library";
import User from "../../models/auth/UserModel.js";
import generateToken from "../../helpers/generateToken.js";
import sendEmail from "../../helpers/sendEmail.js";

const OTP_TTL_MS = 10 * 60 * 1000;
const MAX_OTP_ATTEMPTS = 5;

export const setAuthCookie = (res, userId) => {
  const token = generateToken(userId);
  res.cookie("token", token, {
    path: "/",
    httpOnly: true,
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    sameSite: "none",
    secure: true,
  });
  return token;
};

const userPayload = (user, token) => ({
  _id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  photo: user.photo,
  bio: user.bio,
  isVerified: user.isVerified,
  twoFactorEnabled: !!user.twoFactorEnabled,
  token,
});

const hashOtp = (userId, code) =>
  crypto
    .createHash("sha256")
    .update(`${userId}:${code}:${process.env.JWT_SECRET}`)
    .digest("hex");

// Generate a 6 digit code, store its hash and email it to the user.
const sendOtp = async (user) => {
  const code = crypto.randomInt(0, 1000000).toString().padStart(6, "0");

  user.loginOtp = {
    hash: hashOtp(user._id, code),
    expiresAt: new Date(Date.now() + OTP_TTL_MS),
    attempts: 0,
  };
  await user.save();

  const senderEmail = process.env.USER_EMAIL || process.env.EMAIL_USER;

  await sendEmail(
    "Your Snippet Master login code",
    user.email,
    senderEmail,
    senderEmail || "noreply@snippetmaster.com",
    "loginOtp",
    user.name,
    "",
    { code }
  );
};

// Called by loginUser after the password was verified for a 2-step account.
export const startOtpChallenge = async (user, res) => {
  try {
    await sendOtp(user);
  } catch (error) {
    console.log("Error sending login code:", error.message);
    return res.status(500).json({
      message: "Could not send the verification code, please try again",
    });
  }

  // short lived token that only proves the password step passed (not a session!)
  const challengeToken = jwt.sign(
    { uid: user._id, purpose: "login-otp" },
    process.env.JWT_SECRET,
    { expiresIn: "10m" }
  );

  return res.status(202).json({
    twoFactorRequired: true,
    challengeToken,
    message: "Verification code sent to your email",
  });
};

const readChallenge = (challengeToken) => {
  try {
    const decoded = jwt.verify(challengeToken, process.env.JWT_SECRET);
    return decoded.purpose === "login-otp" ? decoded.uid : null;
  } catch (error) {
    return null;
  }
};

// POST /login/verify-otp  { challengeToken, otp }
export const verifyLoginOtp = asyncHandler(async (req, res) => {
  const { challengeToken, otp } = req.body;
  const uid = readChallenge(challengeToken);

  if (!uid || !otp) {
    return res.status(400).json({ message: "Session expired, please log in again" });
  }

  const user = await User.findById(uid);
  if (!user || !user.loginOtp?.hash) {
    return res.status(400).json({ message: "No code requested, please log in again" });
  }

  if (user.loginOtp.expiresAt < new Date()) {
    return res.status(400).json({ message: "Code expired, please log in again" });
  }

  if (user.loginOtp.attempts >= MAX_OTP_ATTEMPTS) {
    return res.status(429).json({ message: "Too many attempts, please log in again" });
  }

  if (user.loginOtp.hash !== hashOtp(user._id, String(otp).trim())) {
    user.loginOtp.attempts += 1;
    await user.save();
    return res.status(400).json({ message: "Incorrect code" });
  }

  // single use
  user.loginOtp = undefined;
  await user.save();

  const token = setAuthCookie(res, user._id);
  return res.status(200).json(userPayload(user, token));
});

// POST /login/resend-otp  { challengeToken }
export const resendLoginOtp = asyncHandler(async (req, res) => {
  const uid = readChallenge(req.body.challengeToken);
  const user = uid && (await User.findById(uid));
  if (!user) {
    return res.status(400).json({ message: "Session expired, please log in again" });
  }

  // 30 second cooldown between emails
  const issuedAt = user.loginOtp?.expiresAt
    ? user.loginOtp.expiresAt.getTime() - OTP_TTL_MS
    : 0;
  if (Date.now() - issuedAt < 30 * 1000) {
    return res.status(429).json({ message: "Please wait before requesting another code" });
  }

  try {
    await sendOtp(user);
  } catch (error) {
    return res.status(500).json({ message: "Could not send the verification code" });
  }
  return res.status(200).json({ message: "A new code was sent" });
});

// PATCH /two-factor  { enabled, password? }  (logged in)
export const setTwoFactor = asyncHandler(async (req, res) => {
  const enabled = req.body.enabled === true;
  const user = await User.findById(req.user._id);

  // require the password to change this security setting (Google-only accounts have none)
  if (user.password) {
    const ok = req.body.password && (await bcrypt.compare(req.body.password, user.password));
    if (!ok) return res.status(400).json({ message: "Incorrect password" });
  }

  user.twoFactorEnabled = enabled;
  if (!enabled) user.loginOtp = undefined;
  await user.save();

  return res.status(200).json({ twoFactorEnabled: user.twoFactorEnabled });
});

// POST /auth/google  { credential }  (ID token from Google Identity Services)
export const googleLogin = asyncHandler(async (req, res) => {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId) {
    return res.status(503).json({ message: "Google sign-in is not configured" });
  }
  if (!req.body.credential) {
    return res.status(400).json({ message: "Missing Google credential" });
  }

  let payload;
  try {
    const client = new OAuth2Client(clientId);
    const ticket = await client.verifyIdToken({
      idToken: req.body.credential,
      audience: clientId,
    });
    payload = ticket.getPayload();
  } catch (error) {
    return res.status(401).json({ message: "Google sign-in failed" });
  }

  if (!payload?.email || !payload.email_verified) {
    return res.status(400).json({ message: "Your Google email is not verified" });
  }

  const email = payload.email.toLowerCase();
  let user = await User.findOne({ $or: [{ googleId: payload.sub }, { email }] });

  if (!user) {
    user = await User.create({
      name: payload.name || email.split("@")[0],
      email,
      googleId: payload.sub,
      photo: payload.picture || undefined,
      isVerified: true, // Google already verified this email
    });
  } else if (!user.googleId) {
    // existing email/password account: link it
    user.googleId = payload.sub;
    user.isVerified = true;
    await user.save();
  }

  const token = setAuthCookie(res, user._id);
  return res.status(200).json(userPayload(user, token));
});
