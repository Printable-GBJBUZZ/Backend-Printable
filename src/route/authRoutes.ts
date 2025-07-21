import { Router } from 'express';
import { sendOtp, handleGoogleOAuth,  signUpController, signInController, refreshTokenController, verifyOtp } from '../controller/authController.ts';

const router = Router();

router.post('/otp', sendOtp);
router.post("/google", handleGoogleOAuth);

router.post('/signup', signUpController);
router.post('/signin', signInController);
router.post('/refresh', refreshTokenController);
router.post("/verify-otp", verifyOtp);
export default router;
