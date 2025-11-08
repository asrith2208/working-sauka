const { onDocumentUpdated } = require("firebase-functions/v2/firestore");
const { onCall, onRequest, HttpsError } = require("firebase-functions/v2/https");
const { logger } = require("firebase-functions");
const admin = require("firebase-admin");
const Razorpay = require("razorpay");
const crypto = require("crypto");

admin.initializeApp();

const RAZORPAY_KEY_ID = "rzp_test_RdEoLDI0FpDimW";
const RAZORPAY_KEY_SECRET = "GcP3kj9NucaI5z4vb8wI71zA";

// --- IMPORTANT --- 
// 1. Replace this placeholder with a strong secret.
// 2. Set this same secret in your Razorpay Dashboard Webhook settings.
// 3. For production, set this as a Firebase environment variable: 
//    firebase functions:config:set razorpay.webhook_secret="YOUR_SECRET_HERE"
const RAZORPAY_WEBHOOK_SECRET = "YOUR_WEBHOOK_SECRET"; // <-- CHANGE THIS

exports.onOrderStatusUpdate = onDocumentUpdated(
    "orders/{orderId}",
    async (event) => {
        const orderDataAfter = event.data.after.data();
        const orderDataBefore = event.data.before.data();
        logger.info(`Order ${event.params.orderId} status changed from '${orderDataBefore.status}' to '${orderDataAfter.status}'.`);
        // TODO: Implement push notification logic here.
    }
);

exports.createRazorpayOrder = onCall(async (request) => {
    const razorpayInstance = new Razorpay({
        key_id: RAZORPAY_KEY_ID,
        key_secret: RAZORPAY_KEY_SECRET,
    });
    const { amount, currency } = request.data;
    if (!amount || !currency) {
        throw new HttpsError("invalid-argument", "The function must be called with 'amount' and 'currency' arguments.");
    }
    const options = {
        amount: amount,
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

// --- NEW FUNCTION: Webhook for Razorpay Payment Verification ---
exports.verifyRazorpayPayment = onRequest(async (req, res) => {
    logger.info("Razorpay webhook received...");

    const signature = req.headers["x-razorpay-signature"];
    const webhookBody = req.rawBody;

    // 1. Verify the webhook signature
    try {
        const expectedSignature = crypto
            .createHmac("sha256", RAZORPAY_WEBHOOK_SECRET)
            .update(webhookBody.toString())
            .digest("hex");

        if (expectedSignature !== signature) {
            logger.error("Webhook signature verification failed.");
            res.status(400).send("Invalid signature.");
            return;
        }
    } catch (error) {
         logger.error("Error during webhook signature verification:", error);
         res.status(500).send("Internal Server Error during verification.");
         return;
    }

    // 2. Process the event if signature is valid
    const event = req.body;
    if (event.event === "payment.captured") {
        const payment = event.payload.payment.entity;
        const razorpayOrderId = payment.order_id;

        try {
            // 3. Find the corresponding order in Firestore
            const ordersRef = admin.firestore().collection("orders");
            const querySnapshot = await ordersRef.where("razorpayOrderId", "==", razorpayOrderId).get();

            if (querySnapshot.empty) {
                logger.error(`No order found with razorpayOrderId: ${razorpayOrderId}`);
                res.status(200).send("Order not found, but webhook acknowledged."); // Acknowledge to prevent retries
                return;
            }

            // 4. Update order status to 'Paid' and save payment details
            const orderDoc = querySnapshot.docs[0];
            logger.info(`Updating order ${orderDoc.id} to 'Paid'.`);
            await orderDoc.ref.update({
                status: "Paid",
                paymentDetails: {
                    razorpayPaymentId: payment.id,
                    razorpayOrderId: payment.order_id,
                    razorpaySignature: signature, 
                    method: payment.method,
                    captured: payment.captured,
                    paidAt: admin.firestore.FieldValue.serverTimestamp(),
                },
            });

        } catch (error) {
            logger.error(`Error updating order for razorpayOrderId ${razorpayOrderId}:`, error);
            res.status(500).send("Failed to update order in database."); // This will cause Razorpay to retry the webhook
            return;
        }
    }

    // 5. Acknowledge the event
    res.status(200).send("Webhook received successfully.");
});
