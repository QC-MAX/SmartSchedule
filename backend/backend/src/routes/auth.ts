// backend/src/routes/auth.ts
import { Router, Request, Response } from "express";
import jwt from "jsonwebtoken"; // if this errors, change to: import * as jwt from "jsonwebtoken";
import { User } from "../db/models/User.js"; // named import + .js for ESM

const router = Router();

router.post("/register", async (req: Request, res: Response) => {
  try {
    const { First_Name, Last_Name, Email, Password, role } = req.body;
    if (!First_Name || !Last_Name || !Email || !Password) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    // unique email check
    const exists = await User.findOne({ Email }).lean();
    if (exists) {
      return res.status(409).json({ message: "Email already registered" });
    }

    // create user (userID is auto-generated in your model's pre-validate hook)
    const user = await User.create({ First_Name, Last_Name, Email, Password, role });

    return res
      .status(201)
      .json({ message: "Registered", user: { id: user.id, Email: user.Email, role: user.role } });
  } catch (e) {
    return res.status(500).json({ message: "Server error", error: String(e) });
  }
});

router.post("/login", async (req: Request, res: Response) => {
  try {
    const { Email, Password } = req.body;
    if (!Email || !Password) {
      return res.status(400).json({ message: "Email and password required" });
    }

    const user = await User.findOne({ Email });
    if (!user || user.Password !== Password) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign(
      { sub: user.id, role: user.role },
      process.env.JWT_SECRET || "devsecret",
      { expiresIn: "7d" }
    );

    return res.json({
      message: "Login ok",
      user: {
        id: user.id,
        First_Name: user.First_Name,
        Last_Name: user.Last_Name,
        Email: user.Email,
        role: user.role,
      },
      token,
    });
  } catch (e) {
    return res.status(500).json({ message: "Server error", error: String(e) });
  }
});

export default router;
