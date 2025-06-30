import { Router } from "express";
import admin from "firebase-admin";
import { Pool } from "pg"; // Import Pool explicitly for TypeScript

// Initialize Firebase with service account key
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert("D:/New folder/New Backend-Printable/Backend-Printable/serviceAccountKey.json"), // Replace with your file path
  });
}

const router = Router();

router.post("/google", async (req, res) => {
  try {
    const { idToken } = req.body;
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    console.log("Decoded Token:", decodedToken);
    const { name, email, sub: signId } = decodedToken;

    if (!signId || !name || !email) {
      console.error("Missing data:", { signId, name, email });
      return res.status(400).json({ status: "error", message: "Missing required token data" });
    }

    if (!signId.trim()) {
      throw new Error("signId is empty or invalid");
    }

    // Neon DB connection
    const pool = new Pool({
      connectionString: "postgresql://neondb_owner:npg_XRSN6kcE7ylA@ep-rough-glitter-a15ya1tf-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require",
      ssl: { rejectUnauthorized: true }
    });

    const checkQuery = "SELECT id, name FROM users WHERE email = $1";
    const result = await pool.query(checkQuery, [email]);
    const existingUser = result.rows[0];

    if (!existingUser) {
      const insertQuery = "INSERT INTO users (sign_id, name, email) VALUES ($1, $2, $3) RETURNING id";
      const newUser = await pool.query(insertQuery, [signId, name, email]);
      console.log(`New user signed up: ID ${newUser.rows[0].id}`);
    } else {
      if (existingUser.name !== name) {
        const updateQuery = "UPDATE users SET name = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2";
        await pool.query(updateQuery, [name, existingUser.id]);
        console.log(`Updated name for user ID ${existingUser.id} to ${name}`);
      } else {
        console.log(`Name matches for user ID ${existingUser.id}, signing in`);
      }
    }

    // Ensure pool is closed after use (optional, depends on your setup)
    await pool.end();

    const customToken = await admin.auth().createCustomToken(signId);
    res.status(200).json({ status: "success", data: { token: customToken } });
  } catch (error) {
    console.error("Authentication error:", error);
    res.status(400).json({ status: "error", statusCode: 400, message: error.message });
  }
});

export default router;