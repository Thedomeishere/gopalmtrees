import { Router, Request, Response } from "express";
import { prisma } from "../prisma.js";
import { hashPassword, comparePassword } from "../utils/password.js";
import { signToken } from "../utils/jwt.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

// POST /api/auth/login
router.post("/login", async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      res.status(400).json({ error: "Email and password are required" });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        notificationPreferences: true,
        addresses: true,
      },
    });

    if (!user || !(await comparePassword(password, user.passwordHash))) {
      res.status(401).json({ error: "Invalid email or password" });
      return;
    }

    const token = signToken({ sub: user.id, email: user.email, role: user.role });

    const { passwordHash: _, ...profile } = user;
    res.json({
      token,
      user: { id: user.id, email: user.email, displayName: user.displayName, role: user.role },
      profile,
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/auth/register
router.post("/register", async (req: Request, res: Response) => {
  try {
    const { email, password, displayName } = req.body;
    if (!email || !password) {
      res.status(400).json({ error: "Email and password are required" });
      return;
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      res.status(409).json({ error: "Email already registered" });
      return;
    }

    const passwordHash = await hashPassword(password);

    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        displayName: displayName || "",
        notificationPreferences: {
          create: {
            orderUpdates: true,
            promotions: true,
            quoteResponses: true,
          },
        },
      },
      include: {
        notificationPreferences: true,
        addresses: true,
      },
    });

    const token = signToken({ sub: user.id, email: user.email, role: user.role });

    const { passwordHash: _, ...profile } = user;
    res.status(201).json({
      token,
      user: { id: user.id, email: user.email, displayName: user.displayName, role: user.role },
      profile,
    });
  } catch (error) {
    console.error("Register error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/auth/me
router.get("/me", requireAuth, async (req: Request, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.sub },
      include: {
        notificationPreferences: true,
        addresses: true,
      },
    });

    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    const { passwordHash: _, ...profile } = user;
    res.json({
      user: { id: user.id, email: user.email, displayName: user.displayName, role: user.role },
      profile,
    });
  } catch (error) {
    console.error("Get me error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/auth/forgot-password
router.post("/forgot-password", async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    if (!email) {
      res.status(400).json({ error: "Email is required" });
      return;
    }
    // In production, send a password reset email here.
    // For now, just acknowledge the request.
    res.json({ message: "If an account with that email exists, a reset link has been sent." });
  } catch (error) {
    console.error("Forgot password error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
