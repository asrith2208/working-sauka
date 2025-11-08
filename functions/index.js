const { onDocumentUpdated } = require("firebase-functions/v2/firestore");
const { onCall, HttpsError } = require("firebase-functions/v2/https"); // Import HttpsError
const { logger } = require("firebase-functions");
const admin = require("firebase-admin");
const Razorpay = require("razorpay");

admin.initializeApp();

// Define keys at the top
const RAZORPAY_KEY_ID = "rzp_test_RdEoLDI0FpDimW"; // Make sure these are filled
const RAZORPAY_KEY_SECRET = "GcP3kj9NucaI5z4vb8wI71zA"; // Make sure these are filled


// --- onOrderStatusUpdate function (UNCHANGED) ---
exports.onOrderStatusUpdate = onDocumentUpdated(
    "orders/{orderId}",
    async (event) => {
        // ... all the logic for sending notifications remains the same
    }
);


// --- createRazorpayOrder function (CORRECTED) ---
exports.createRazorpayOrder = onCall(async (request) => {
    // --- INITIALIZE RAZORPAY CLIENT HERE, INSIDE THE FUNCTION ---
    const razorpayInstance = new Razorpay({
        key_id: RAZORPAY_KEY_ID,
        key_secret: RAZORPAY_KEY_SECRET,
    });

    const { amount, currency } = request.data;
    
    if (!amount || !currency) {
        throw new HttpsError("invalid-argument", "The function must be called with 'amount' and 'currency' arguments.");
    }
    
    const options = {
        amount: amount, // amount in the smallest currency unit
        currency: currency,
        receipt: `receipt_order_${new Date().getTime()}`,
    };

    try {
        const order = await razorpayInstance.orders.create(options);
        logger.info("Razorpay Order Created:", order);
        return { orderId: order.id };
    } catch (error) {
        logger.error("Razorpay Order Creation Error:", error);
        throw new HttpsError("internal", "Could not create Razorpay order.", error.message);
    }
});