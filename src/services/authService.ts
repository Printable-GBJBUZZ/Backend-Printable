import { db } from '../configs/db.ts';
import { users } from '../db/schema.ts';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import admin from 'firebase-admin';

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: Deno.env.get('FIREBASE_PROJECT_ID')!,
      privateKey: Deno.env.get('FIREBASE_PRIVATE_KEY')!.replace(/\\n/g, '\n'),
      clientEmail: Deno.env.get('FIREBASE_CLIENT_EMAIL')!,
    }),
  });
}

const otpSchema = z.object({
  phone: z.string().regex(/^\+?[1-9]\d{9,14}$/),
});

export class AuthService {
  public async googleLogin(idToken: string) {
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    const { uid, name, email } = decodedToken;
    let user = await db.select().from(users).where(eq(users.id, uid)).limit(1);
    if (!user.length) {
      [user] = await db.insert(users).values({
        id: uid,
        name: name || 'Google User',
        email: email || null,
      }).returning();
    }
    return { token: await admin.auth().createCustomToken(uid) };
  }

  public async sendOtp({ phone }: z.infer<typeof otpSchema>) {
    const verificationId = await admin.auth().createCustomToken(crypto.randomUUID());
    const phoneAuthProvider = new admin.auth.PhoneAuthProvider();
    const verificationCode = await phoneAuthProvider.verifyPhoneNumber({
      phoneNumber: phone,
      sessionInfo: verificationId,
    });
    return { verificationId };
  }

  public async verifyOtp(verificationId: string, code: string) {
    const credential = admin.auth.PhoneAuthProvider.credential(verificationId, code);
    const userCredential = await admin.auth().signInWithCredential(credential);
    const { uid, phoneNumber } = userCredential.user;
    await db.update(users).set({ phone: phoneNumber }).where(eq(users.id, uid));
    return { token: await admin.auth().createCustomToken(uid) };
  }

  public async refreshToken(refreshToken: string) {
    const decodedToken = await admin.auth().verifyIdToken(refreshToken);
    const newToken = await admin.auth().createCustomToken(decodedToken.uid);
    return { token: newToken };
  }

  public async logout(token: string) {
    const decodedToken = await admin.auth().verifyIdToken(token);
    await admin.auth().revokeRefreshTokens(decodedToken.uid);
    return { message: 'Logout successful' };
  }
}