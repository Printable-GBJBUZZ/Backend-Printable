import admin from "firebase-admin";
import { Pool } from "pg";
import { Request, Response, NextFunction } from "express";

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert("D:/New folder/New Backend-Printable/Backend-Printable/serviceAccountKey.json"),
  });
}

const pool = new Pool({
  connectionString: "postgresql://neondb_owner:npg_XRSN6kcE7ylA@ep-rough-glitter-a15ya1tf-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require",
  ssl: { rejectUnauthorized: true }
});

export const googleLogin = async (req: Request, res: Response, next?: NextFunction) => {
  let client;
  try {
    const { idToken } = req.body;
    if (!idToken) {
      return res.status(400).json({ status: "error", message: "idToken is required" });
    }

    const decodedToken = await admin.auth().verifyIdToken(idToken);
    const { name, email, uid: signId } = decodedToken;

    if (!signId || !name || !email) {
      return res.status(400).json({ status: "error", message: "Missing required token data" });
    }

    client = await pool.connect();
    const checkQuery = "SELECT id, name, phone, is_verified FROM users WHERE email = $1";
    const result = await client.query(checkQuery, [email]);
    const existingUser = result.rows[0];

    if (!existingUser) {
      const insertQuery = "INSERT INTO users (id, sign_id, name, email) VALUES ($1, $2, $3, $4) ON CONFLICT (email) DO NOTHING RETURNING id";
      await client.query(insertQuery, [signId, signId, name, email]);
    } else {
      if (existingUser.name !== name) {
        const updateQuery = "UPDATE users SET name = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2";
        await client.query(updateQuery, [name, existingUser.id]);
      }
    }

    const userId = signId;
    let user = existingUser || (await client.query("SELECT id, phone, is_verified FROM users WHERE id = $1", [userId])).rows[0];
    if (!user.phone || !user.is_verified) {
      return res.status(200).json({ status: "pending", message: "Phone number required for verification", data: { userId } });
    }

    const customToken = await admin.auth().createCustomToken(signId);
    res.status(200).json({ status: "success", data: { token: customToken } });
  } catch (error) {
    console.error("Authentication error:", error);
    res.status(400).json({ status: "error", message: error.message });
  } finally {
    if (client) client.release();
  }
};

export const sendOtp = async (req: Request, res: Response, next?: NextFunction) => {
  let client;
  try {
    const { idToken, phoneNumber } = req.body;
    if (!idToken || !phoneNumber) {
      return res.status(400).json({ status: "error", message: "idToken and phoneNumber are required" });
    }

    const decodedToken = await admin.auth().verifyIdToken(idToken);
    const { uid: signId } = decodedToken;

    client = await pool.connect();
    const userQuery = "SELECT id, phone, is_verified FROM users WHERE id = $1";
    const userResult = await client.query(userQuery, [signId]);
    const user = userResult.rows[0];

    if (!user || (user.phone && user.is_verified)) {
      return res.status(400).json({ status: "error", message: "User not found or already verified" });
    }

    const phone = `+${phoneNumber.replace(/[^\d]/g, '')}`;
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    await client.query("UPDATE users SET phone = $1, otp = $2, is_verified = FALSE WHERE id = $3", [phone, otp, signId]);

    res.status(200).json({
      status: "pending",
      message: "OTP sent for phone verification",
      data: { userId: signId, phone, otp } // ⚠️ Remove otp in production
    });
  } catch (error) {
    console.error("OTP request error:", error);
    res.status(400).json({ status: "error", message: error.message });
  } finally {
    if (client) client.release();
  }
};

export const verifyOtp = async (req: Request, res: Response, next?: NextFunction) => {
  let client;
  try {
    const { userId, phoneNumber, otp } = req.body;
    if (!userId || !phoneNumber || !otp) {
      return res.status(400).json({ status: "error", message: "userId, phoneNumber, and otp are required" });
    }

    client = await pool.connect();
    const userQuery = "SELECT phone, is_verified, otp FROM users WHERE id = $1";
    const userResult = await client.query(userQuery, [userId]);
    const user = userResult.rows[0];

    if (!user || user.phone !== `+${phoneNumber.replace(/[^\d]/g, '')}`) {
      return res.status(404).json({ status: "error", message: "User or phone not found" });
    }

    if (user.otp !== otp) {
      return res.status(400).json({ status: "error", message: "Invalid OTP" });
    }

    await client.query("UPDATE users SET is_verified = TRUE, otp = NULL, updated_at = CURRENT_TIMESTAMP WHERE id = $1", [userId]);

    const customToken = await admin.auth().createCustomToken(userId);
    res.status(200).json({ status: "success", message: "Phone verified", data: { token: customToken } });
  } catch (error) {
    console.error("OTP verification error:", error);
    res.status(400).json({ status: "error", message: error.message });
  } finally {
    if (client) client.release();
  }
};

export const refreshToken = (req: Request, res: Response) => {
  res.status(501).json({ status: "error", message: "Not implemented" });
};

export const logout = (req: Request, res: Response) => {
  res.status(501).json({ status: "error", message: "Not implemented" });
};
