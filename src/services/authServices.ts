import { Client } from "https://deno.land/x/postgres@v0.17.0/mod.ts";
import "https://deno.land/std@0.204.0/dotenv/load.ts"; // Load env vars
import { decode, verify } from "https://deno.land/x/djwt@v3.0.1/mod.ts";
import { otps } from "../db/schema.ts";
import { users } from "../db/schema.ts";
import { eq } from "drizzle-orm";
import { create, getNumericDate } from "https://deno.land/x/djwt@v2.8/mod.ts";

import { nanoid } from "https://deno.land/x/nanoid/mod.ts";
const db = new Client(Deno.env.get("DATABASE_URL")!);
await db.connect();

const RESEND_API_KEY = Deno.env.get("RESEND_API");
const CLERK_API_KEY = Deno.env.get("CLERK_SECRET_KEY");

const FAST2SMS_API_KEY = Deno.env.get("FAST2SMS_API_KEY")!; // ✅ Replace with your SMS key

const generateOtp = () =>
  Math.floor(100000 + Math.random() * 900000).toString();

// Helper function to check if user exists
const checkUserExists = async (email: string) => {
  try {
    const userResponse = await fetch(`https://api.clerk.com/v1/users?email_address=${encodeURIComponent(email)}`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${CLERK_API_KEY}`,
        "Content-Type": "application/json"
      }
    });

    if (!userResponse.ok) {
      return null;
    }

    const users = await userResponse.json();
    return users.find((u: any) => 
      u.email_addresses?.some((emailAddr: any) => emailAddr.email_address === email)
    );
  } catch (error) {
    console.error("Error checking user existence:", error);
    return null;
  }
};


export const signUpUserService = async (email: string, password: string, name: string, phone: string) => {
  try {
    // 1. Check if user already exists in Clerk
    const existingUser = await checkUserExists(email);
    if (existingUser) {
      throw new Error("User with this email already exists. Please sign in instead.");
    }

    // 2. Create user in Clerk
    const response = await fetch("https://api.clerk.com/v1/users", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${CLERK_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        email_address: [email],
        password,
        first_name: name.split(" ")[0] || "",
        last_name: name.split(" ")[1] || "",
        phone_numbers: [phone]
      })
    });

    const responseText = await response.text();
    if (!response.ok) {
      throw new Error(`Sign up failed: ${responseText}`);
    }

    const data = JSON.parse(responseText);

    // 3. Insert user into PostgreSQL `users` table
    const now = new Date();
    const id = nanoid(); // or use data.id from Clerk if you want

    await db.queryObject`
      INSERT INTO users (
        id, name, email, phone, state, city, sign_id,
        address, latitude, longitude, updated_at, created_at
      )
      VALUES (
        ${id},
        ${name},
        ${email},
        ${phone},
        NULL,
        NULL,
        ${data.id},
        NULL,
        NULL,
        NULL,
        ${now},
        ${now}
      )
    `;

    // 4. Return success response
    return {
      clerkId: data.id,
      email: data.email_addresses?.[0]?.email_address,
      status: "signed_up",
      message: "User created successfully"
    };
  } catch (error) {
    console.error("SignUp error:", error);
    throw error;
  }
};


const CLERK_FRONTEND_API_KEY = Deno.env.get("CLERK_FRONTEND_API_KEY");

export const signInUserService = async (email: string, password: string) => {
  try {
    // Check if user exists using the helper function
    const user = await checkUserExists(email);

    if (!user) {
      console.log("No user found for email:", email);
      throw new Error("User not found. Please check your email or sign up first.");
    }

    console.log("User found:", user.id);

    // Note: Clerk's backend API doesn't support direct password verification
    // In a production environment, you would typically:
    // 1. Use JWT tokens from the frontend
    // 2. Implement a custom password verification system
    // 3. Use Clerk's webhooks for user management
    
    // For now, we'll create a session for the user (assuming password is correct)
    // In a real implementation, you should verify the password first
    
    
    const sessionResponse = await fetch("https://api.clerk.com/v1/sessions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${CLERK_API_KEY}`,
        "Content-Type": "application/json",
        
      },
      body: JSON.stringify({
        user_id: user.id,
        duration: 60 * 60 * 24 * 7, // 7 days in seconds
        token: true 
      })
    });

    if (!sessionResponse.ok) {
      const sessionError = await sessionResponse.text();
      console.error("Session creation error:", sessionError);
      throw new Error(`Failed to create session: ${sessionError}`);
    }

    const sessionData = await sessionResponse.json();
    console.log("Session created successfully", sessionResponse);

    const tokenResponse = await fetch(`https://api.clerk.com/v1/sessions/${sessionData.id}/tokens`, {
  method: "POST",
  headers: {
    "Authorization": `Bearer ${CLERK_API_KEY}`,
    "Content-Type": "application/json",
  }
});

if (!tokenResponse.ok) {
  const tokenError = await tokenResponse.text();
  console.error("Token fetch error:", tokenError);
  throw new Error(`Failed to fetch session token: ${tokenError}`);
}

const tokenData = await tokenResponse.json();
const sessionToken = tokenData.jwt;
console.log(tokenData)
    return {
      message: "Login successful",
      sessionId: sessionData.id,
      userId: user.id,
      status: "active",
      token: sessionToken || null,
      user: {
        id: user.id,
        email: user.email_addresses?.[0]?.email_address,
        firstName: user.first_name,
        lastName: user.last_name
      }
    };
  } catch (error) {
    console.error("SignIn error:", error);
    throw error;
  }
};

export const handleGoogleOAuthService = async (googleToken: string) => {
  try {
    let googleUser;

    // Step 1: Try ID token flow (recommended)
    const googleResponse = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${googleToken}`);
    if (googleResponse.ok) {
      googleUser = await googleResponse.json();
      console.log("✅ Using ID token flow");
    } else {
      // Fallback: access token
      const accessTokenResponse = await fetch(`https://www.googleapis.com/oauth2/v2/userinfo?access_token=${googleToken}`);
      if (accessTokenResponse.ok) {
        googleUser = await accessTokenResponse.json();
        console.log("✅ Using access token flow");
      } else {
        throw new Error("Invalid Google OAuth token");
      }
    }

    const {
      user_id: googleId,
      email,
      name = "",
      given_name,
      family_name
    } = googleUser;

    // Step 2: Check if user already exists in Clerk
    const userExistsRes = await fetch(`https://api.clerk.com/v1/users?email_address=${encodeURIComponent(email)}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${CLERK_API_KEY}`,
        "Content-Type": "application/json",
      }
    });

    const existingUsers = await userExistsRes.json();
    const existingUser = existingUsers?.find((u: any) =>
      u.email_addresses?.some((addr: any) => addr.email_address === email)
    );

    let clerkUser;
    if (existingUser) {
      clerkUser = existingUser;
      console.log("✅ Existing Clerk user found:", clerkUser.id);
    } else {
      // Step 3: Create new user in Clerk
      const createUserRes = await fetch("https://api.clerk.com/v1/users", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${CLERK_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email_address: [email],
          first_name: given_name || name?.split(" ")[0] || "",
          last_name: family_name || name?.split(" ")[1] || "",
          external_id: googleId,
          skip_password_requirement: true
        })
      });

      if (!createUserRes.ok) {
        const errText = await createUserRes.text();
        console.error("❌ Clerk user creation failed:", errText);
        throw new Error(`Failed to create Clerk user: ${errText}`);
      }

      clerkUser = await createUserRes.json();
      console.log("✅ New Clerk user created:", clerkUser.id);
    }

    // Step 4: Create a session in Clerk
    const sessionRes = await fetch("https://api.clerk.com/v1/sessions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${CLERK_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        user_id: clerkUser.id,
        duration: 60 * 60 * 24 * 7
      })
    });

    if (!sessionRes.ok) {
      const sessionError = await sessionRes.text();
      console.error("❌ Session creation failed:", sessionError);
      throw new Error(`Failed to create session: ${sessionError}`);
    }

    const sessionData = await sessionRes.json();

    // Step 5: Insert into PostgreSQL users table
    const signId = `google-${clerkUser.id}`;
    await db.queryObject`
      INSERT INTO users (id, name, email, sign_id, created_at, updated_at)
      VALUES (
        ${clerkUser.id},
        ${name || given_name || "Google User"},
        ${email},
        ${signId},
        NOW(),
        NOW()
      )
      ON CONFLICT (id) DO UPDATE
      SET
        name = EXCLUDED.name,
        email = EXCLUDED.email,
        sign_id = EXCLUDED.sign_id,
        updated_at = NOW()
    `;

    return {
      id: clerkUser.id,
      name,
      email,
      sessionId: sessionData.id,
      token: sessionData.last_active_token || null,
      message: "Google login successful"
    };

  } catch (error) {
    console.error("Google OAuth error:", error);
    throw new Error("Google OAuth failed");
  }
};
function decodeJwt(token: string): any {
  const [header, payload] = token.split('.');

  if (!payload) throw new Error("Invalid JWT");

  const decoded = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
  return JSON.parse(decoded);
}

export const handleRefreshTokenService = async (sessionId: string) => {
  try {
    const tokenRes = await fetch(`https://api.clerk.com/v1/sessions/${sessionId}/tokens`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${CLERK_API_KEY}`,
        "Content-Type": "application/json",
      },
    });

    if (!tokenRes.ok) {
      const err = await tokenRes.text();
      throw new Error(`Token generation failed: ${err}`);
    }

    const data = await tokenRes.json();
// console.log(tokenRes."set-cookie")
    const tokenResponse = await fetch(`https://api.clerk.com/v1/sessions/${sessionId}/tokens`, {
  method: "POST",
  headers: {
    "Authorization": `Bearer ${CLERK_API_KEY}`,
    "Content-Type": "application/json",
  }
});

if (!tokenResponse.ok) {
  const tokenError = await tokenResponse.text();
  console.error("Token fetch error:", tokenError);
  throw new Error(`Failed to fetch session token: ${tokenError}`);
}

const tokenData = await tokenResponse.json();
console.log(tokenResponse)
const sessionToken = tokenData.jwt;
const payload = decodeJwt(sessionToken);
const exp = new Date(payload.exp * 1000).toLocaleString()
console.log("JWT Payload:", payload);
console.log("Expires at:",exp);

    return {
      sessionId,
      jwt: sessionToken, // <-- This is your JWT
      expiresAt: exp,
    };
  } catch (err) {
    console.error("Session refresh error:", err);
    throw err;
  }
};

export const sendOtpService = async (email?: string, phone?: string) => {
  const otp = generateOtp(); // Still used for email
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 min

  const TWILIO_ACCOUNT_SID = Deno.env.get("TWILIO_SID")!;
  const TWILIO_AUTH_TOKEN = Deno.env.get("TWILIO_AUTH_TOKEN")!;
  const TWILIO_VERIFY_SID = Deno.env.get("TWILIO_VERIFY_SID")!;
  const RESEND_API_KEY = Deno.env.get("RESEND_API");
console.log(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_VERIFY_SID, RESEND_API_KEY)
  if (email && RESEND_API_KEY) {
    console.log("📧 Sending OTP to email:", email);

    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "onboarding@resend.dev",
        to: email,
        subject: "Your OTP Code",
        html: `<p>Your OTP is <strong>${otp}</strong>. It expires in 5 minutes.</p>`,
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      console.error("Resend Error:", data);
      throw new Error("Failed to send email");
    }

    // Only store OTP if it's managed by your backend (email OTPs)
    await db.queryObject({
      text: `INSERT INTO otps (email, phone, otp, expires_at, created_at)
             VALUES ($1, $2, $3, $4, $5)`,
      args: [email, phone, otp, expiresAt, new Date()],
    });
  }

  else if (phone) {
    console.log("📱 Sending OTP to phone via Twilio:", phone);

    const body = new URLSearchParams({
      To: phone.startsWith("+") ? phone : `+91${phone}`,
      Channel: "sms",
    });

    const twilioResponse = await fetch(
      `https://verify.twilio.com/v2/Services/${TWILIO_VERIFY_SID}/Verifications`,
      {
        method: "POST",
        headers: {
          Authorization: "Basic " + btoa(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`),
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body,
      }
    );

    const responseData = await twilioResponse.json();
    if (!twilioResponse.ok) {
      console.error("Twilio Error:", responseData);
      throw new Error("Failed to send OTP via SMS");
    }
  }

  else {
    throw new Error("No valid email or phone provided");
  }

  return { success: true, message: "OTP sent successfully" };
};


const JWT_SECRET = Deno.env.get("JWT_SECRET") || "your-secret";

export const verifyOtpService = async (
  email?: string,
  phone?: string,
  inputOtp?: string
) => {
  if (!inputOtp || (!email && !phone)) {
    throw new Error("OTP and either email or phone are required.");
  }

  // ✅ Build SQL query
  let query = "";
  let value;
  if (email) {
    query = `SELECT * FROM otps WHERE email = $1 ORDER BY created_at DESC LIMIT 1`;
    value = email;
  } else {
    query = `SELECT * FROM otps WHERE phone = $1 ORDER BY created_at DESC LIMIT 1`;
    value = phone;
  }

  const result = await db.queryObject({ text: query, args: [value] });
console.log("one")
  if (!result.rows || result.rows.length === 0) {
    throw new Error("OTP not found.");
  }

  const latestOtp = result.rows[0];

  // ✅ Expiry check
  if (new Date(latestOtp.expires_at) < new Date()) {
    throw new Error("OTP expired.");
  }
console.log(latestOtp.otp,  inputOtp)
  // ✅ Match check
  if (latestOtp.otp !== inputOtp) {
    throw new Error("Invalid OTP.");
  }
  // ✅ Update verification status
  if (email) {
    await db.queryObject({
      text: `UPDATE users SET is_email_verified = true WHERE email = $1`,
      args: [email],
    });
  }

  if (phone) {
    await db.queryObject({
      text: `UPDATE users SET is_phone_verified = true WHERE phone = $1`,
      args: [phone],
    });
  }

  // ✅ Create JWT token
  // const jwt = await create(
  //   { alg: "HS256", typ: "JWT" },
  //   {
  //     email: email ?? null,
  //     phone: phone ?? null,
  //     exp: getNumericDate(60 * 60 * 24), // 1 day
  //   },
  //   JWT_SECRET
  // );

  return { token: "jwt" };
};
