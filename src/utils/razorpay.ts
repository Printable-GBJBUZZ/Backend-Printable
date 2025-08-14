// import Razorpay from "npm:razorpay";

// export const razorpay = new Razorpay({
//   key_id: process.env.RAZORPAY_KEY_ID!,
//   key_id: process.env.RAZORPAY_KEY_ID!,
//   key_secret: process.env.RAZORPAY_KEY_SECRET!,
// });
import Razorpay from "npm:razorpay";

export const razorpay = new Razorpay({
  key_id: Deno.env.get("RAZORPAY_KEY_ID")!,
  key_secret: Deno.env.get("RAZORPAY_KEY_SECRET")!,
});