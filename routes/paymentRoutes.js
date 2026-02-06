// const express = require("express");
// const Razorpay = require("razorpay");
// const crypto = require("crypto");

// const router = express.Router();

// const razorpay = new Razorpay({
//     key_id: process.env.RAZORPAY_KEY_ID,
//     key_secret: process.env.RAZORPAY_KEY_SECRET,
// });

// //   CREATE ORDER

// router.post("/create-order", async (req, res) => {
//     try {
//         const { amount } = req.body;

//         const order = await razorpay.orders.create({
//             amount: amount * 100, // paise
//             currency: "INR",
//             receipt: `receipt_${Date.now()}`,
//         });

//         res.status(200).json(order);
//     } catch (error) {
//         res.status(500).json({ message: error.message });
//     }
// });

// //  VERIFY PAYMENT

// router.post("/verify", (req, res) => {
//     const {
//         razorpay_order_id,
//         razorpay_payment_id,
//         razorpay_signature,
//     } = req.body;

//     const body = razorpay_order_id + "|" + razorpay_payment_id;

//     const expectedSignature = crypto
//         .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
//         .update(body)
//         .digest("hex");

//     if (expectedSignature === razorpay_signature) {
//         return res.json({ success: true });
//     } else {
//         return res.status(400).json({ success: false });
//     }
// });

// module.exports = router;
