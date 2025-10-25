// backend/src/routes/auth.ts
import { Router, Request, Response } from "express";
import jwt from "jsonwebtoken"; // if this errors, change to: import * as jwt from "jsonwebtoken";
import nodemailer from "nodemailer";
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
    `
  };

  await transporter.sendMail(mailOptions);
};

router.post("/login", async (req: Request, res: Response) => {
  try {
    const { Email, Password, verificationCode } = req.body;
    
    // First step: validate email/password
    if (!Email || !Password) {
      return res.status(400).json({ message: "Email and password required" });
    }

    const sanitizedEmail = Email.trim().toLowerCase();
    const user = await User.findOne({ Email: sanitizedEmail });
    
    if (!user || user.Password !== Password.trim()) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // If verification code is provided, verify it
    if (verificationCode) {
      const storedData = verificationCodes.get(sanitizedEmail);
      
      if (!storedData || storedData.code !== verificationCode || Date.now() > storedData.expires) {
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

    // If no verification code provided, send one
    const code = generateCode();
    const expires = Date.now() + 10 * 60 * 1000; // 10 minutes

    // Store code
    verificationCodes.set(sanitizedEmail, { code, expires, userId: user.id });

    // Send email
    await sendVerificationEmail(sanitizedEmail, code);

    return res.json({
      requiresVerification: true,
      message: "Verification code sent to your email"
    });

  } catch (e) {
    console.error('Login error:', e);
    return res.status(500).json({ message: "Server error" });
  }
});

export default router;