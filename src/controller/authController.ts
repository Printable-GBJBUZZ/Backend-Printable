import { Request, Response } from 'express';
import { sendOtpService, signUpUserService, handleGoogleOAuthService, signInUserService, handleRefreshTokenService, verifyOtpService } from '../services/authServices.ts';
import { Client } from "https://deno.land/x/postgres@v0.17.0/mod.ts";
import "https://deno.land/std@0.204.0/dotenv/load.ts"; // Load env vars
const db = new Client(Deno.env.get("DATABASE_URL")!);
await db.connect();

export const signUpController = async (req: Request, res: Response) => {
  try {
    const { email, password, name, phone_numbers } = req.body;

    if (!email || !password || !name)
      return res.status(400).json({ error: "Email, password, and name are required" });

    const result = await signUpUserService(email, password, name, phone_numbers);
    res.status(201).json({ ...result });

  } catch (err) {
    console.error("Sign Up Error:", err);
    res.status(500).json({ error: "Signup failed", details: err.message });
  }
};

export const signInController = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password)
      return res.status(400).json({ error: "Email and Password are required" });

    const result = await signInUserService(email, password);
    res.status(200).json(result);

  } catch (err) {
    console.error("Sign In Error:", err);
    res.status(500).json({ error: "Login failed", details: err.message });
  }
};

// src/controller/authController.ts

export const handleGoogleOAuth = async (req: Request, res: Response) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({ error: "Token is required" });
    }

    const result = await handleGoogleOAuthService(token);
    res.status(200).json({ success: true, user: result });

  } catch (error) {
    console.error("OAuth Error:", error);
    res.status(500).json({ error: "Google OAuth failed", details: error.message });
  }
};

export const refreshTokenController = async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.body;

    if (!sessionId) {
      return res.status(400).json({ error: "Session ID is required" });
    }

    const result = await handleRefreshTokenService(sessionId);
console.log(result)
    return res.status(200).json({
      success: true,
      message: "Token refreshed successfully",
      sessionId: result.sessionId,
      token: result.jwt,             // ✅ Add this
      expiresAt: result.expiresAt,     // ✅ Optional
    });
  } catch (err) {
    console.error("Session token refresh error:", err);
    return res.status(401).json({
      error: "Token refresh failed",
      details: err instanceof Error ? err.message : String(err),
    });
  }
};


export const sendOtp = async (req: Request, res: Response) => {
  try {
    const { email, phone } = req.body;

    if (!email && !phone) {
      return res.status(400).json({ error: "Email or phone is required" });
    }

    console.log("🔐 sendOtp called with:", { email, phone });

    const result = await sendOtpService(email, phone);
    res.status(200).json({ message: "OTP sent successfully", result });
  } catch (error) {
    console.error("❌ OTP Send Error:", error);
    res.status(500).json({
      error: error instanceof Error ? error.message : "Failed to send OTP",
    });
  }
};


export const verifyOtp = async (req: Request, res: Response) => {
  try {
    const { email, phone, otp } = req.body;

    if (!otp || (!email && !phone)) {
      return res.status(400).json({
        error: "OTP and either email or phone are required.",
      });
    }

    const result = await verifyOtpService(email, phone, otp);

    res.status(200).json({
      message: "OTP verified successfully",
      // token: result.token,
    });

  } catch (error) {
    console.error("OTP verification failed:", error);
    res.status(401).json({
      error: error.message || "OTP verification failed.",
    });
  }
};



