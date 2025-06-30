import express from 'express';
import {
  googleLogin,
  sendOtp,
  verifyOtp,
  refreshToken,
  logout,
} from '../controller/authController.ts';

const router = express.Router();

router.post('/google', googleLogin);
router.post('/otp', sendOtp);
router.post('/verify-otp', verifyOtp);
router.post('/refresh', refreshToken);
router.post('/logout', logout);

export default router;
