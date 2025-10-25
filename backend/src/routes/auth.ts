// backend/src/routes/auth.ts
import { Router, Request, Response } from "express";
import jwt from "jsonwebtoken"; // if this errors, change to: import * as jwt from "jsonwebtoken";
import nodemailer from "nodemailer";
import validator from "validator";
import DOMPurify from "isomorphic-dompurify";
import rateLimit from "express-rate-limit";
import { User } from "../db/models/User.js"; // named import + .js for ESM

const router = Router();

// Email configuration
const transporter = nodemailer.createTransport({
  service: 'gmail', // or your email provider
  auth: {
    user: process.env.EMAIL_USER, // your email
    pass: process.env.EMAIL_PASS  // your app password
  }
});

// In-memory store for verification codes (use Redis in production)
const verificationCodes = new Map<string, { code: string; expires: number; userId: string }>();

// Email rate limiting - prevent spam
const emailLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes window
  max: 3, // Maximum 3 email attempts per 15 minutes per IP
  message: {
    message: "Too many email requests. Please wait 15 minutes before requesting another verification code."
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Custom key generator to track by email instead of just IP
  keyGenerator: (req) => {
    const email = req.body?.Email?.trim()?.toLowerCase() || req.ip;
    return `email_${email}`;
  }
});

// Login rate limiting - prevent brute force
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 login attempts per 15 minutes per IP
  message: {
    message: "Too many login attempts. Please wait 15 minutes before trying again."
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Per-email rate limiting (additional protection)
const emailAttempts = new Map<string, { count: number; resetTime: number }>();

const checkEmailRateLimit = (email: string): boolean => {
  const now = Date.now();
  const attempts = emailAttempts.get(email);
  
  if (!attempts || now > attempts.resetTime) {
    // Reset or create new counter
    emailAttempts.set(email, { count: 1, resetTime: now + 15 * 60 * 1000 });
    return true;
  }
  
  if (attempts.count >= 3) {
    return false; // Rate limit exceeded
  }
  
  attempts.count++;
  return true;
};

// Generate random 6-digit code
const generateCode = () => Math.floor(100000 + Math.random() * 900000).toString();

// Send verification email
const sendVerificationEmail = async (email: string, code: string) => {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: 'SmartSchedule - Verification Code',
    html: `
      <h2>Your Verification Code</h2>
      <p>Your verification code is: <strong style="font-size: 24px; color: #667eea;">${code}</strong></p>
      <p>This code will expire in 10 minutes.</p>
      <p>If you didn't request this, please ignore this email.</p>
      <hr>
      <small style="color: #666;">
        For security reasons, we limit verification code requests. 
        You can request up to 3 codes per 15 minutes.
      </small>
    `
  };

  await transporter.sendMail(mailOptions);
};

router.post("/login", loginLimiter, emailLimiter, async (req: Request, res: Response) => {
  try {
    const { Email, Password, verificationCode } = req.body;
    
    // Input validation
    if (!Email || !Password) {
      return res.status(400).json({ message: "Email and password required" });
    }

    // Type checking
    if (typeof Email !== 'string' || typeof Password !== 'string') {
      return res.status(400).json({ message: "Invalid input format" });
    }

    // Basic sanitization
    let sanitizedEmail = Email.trim();
    let sanitizedPassword = Password.trim();

    // Advanced sanitization
    sanitizedEmail = DOMPurify.sanitize(sanitizedEmail);
    sanitizedPassword = DOMPurify.sanitize(sanitizedPassword);

    // Email validation and normalization
    if (!validator.isEmail(sanitizedEmail)) {
      return res.status(400).json({ message: "Invalid email format" });
    }
    
    sanitizedEmail = validator.normalizeEmail(sanitizedEmail) || sanitizedEmail;

    // Password validation
    if (sanitizedPassword.length < 6) {
      return res.status(400).json({ message: "Password too short" });
    }
    
    if (sanitizedPassword.length > 128) {
      return res.status(400).json({ message: "Password too long" });
    }

    // Sanitize verification code if provided
    let sanitizedVerificationCode = verificationCode;
    if (verificationCode) {
      if (typeof verificationCode !== 'string') {
        return res.status(400).json({ message: "Invalid verification code format" });
      }
      
      sanitizedVerificationCode = DOMPurify.sanitize(verificationCode.trim());
      
      // Validate verification code format (6 digits)
      if (!/^\d{6}$/.test(sanitizedVerificationCode)) {
        return res.status(400).json({ message: "Verification code must be 6 digits" });
      }
    }

    // Database query with sanitized data
    const user = await User.findOne({ Email: sanitizedEmail });
    
    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Use bcrypt to compare password
    const isPasswordValid = await user.comparePassword(sanitizedPassword);
    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // If verification code is provided, verify it
    if (sanitizedVerificationCode) {
      const storedData = verificationCodes.get(sanitizedEmail);
      
      if (!storedData || storedData.code !== sanitizedVerificationCode || Date.now() > storedData.expires) {
        return res.status(401).json({ message: "Invalid or expired verification code" });
      }

      // Clear the used code
      verificationCodes.delete(sanitizedEmail);

      // Generate JWT token
      const token = jwt.sign(
        { sub: user.id, role: user.role },
        process.env.JWT_SECRET || "devsecret",
        { expiresIn: "7d" }
      );

      return res.json({
        message: "Login successful",
        user: {
          id: user.id,
          First_Name: user.First_Name,
          Last_Name: user.Last_Name,
          Email: user.Email,
          role: user.role,
        },
        token,
      });
    }

    // Check per-email rate limit before sending email
    if (!checkEmailRateLimit(sanitizedEmail)) {
      return res.status(429).json({ 
        message: "Too many verification code requests for this email. Please wait 15 minutes." 
      });
    }

    // If no verification code provided, send one
    const code = generateCode();
    const expires = Date.now() + 10 * 60 * 1000; // 10 minutes

    // Store code
    verificationCodes.set(sanitizedEmail, { code, expires, userId: user.id });

    try {
      // Send email
      await sendVerificationEmail(sanitizedEmail, code);
      
      return res.json({
        requiresVerification: true,
        message: "Verification code sent to your email",
        rateLimitInfo: {
          remainingAttempts: 3 - (emailAttempts.get(sanitizedEmail)?.count || 0),
          resetTime: emailAttempts.get(sanitizedEmail)?.resetTime
        }
      });
    } catch (emailError) {
      console.error('Email sending failed:', emailError);
      return res.status(500).json({ 
        message: "Failed to send verification email. Please try again." 
      });
    }

  } catch (e) {
    console.error('Login error:', e);
    return res.status(500).json({ message: "Server error" });
  }
});

export default router;