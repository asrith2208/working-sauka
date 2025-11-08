const { onDocumentUpdated } = require("firebase-functions/v2/firestore"); // CORRECTED IMPORT
const { logger } = require("firebase-functions");
const admin = require("firebase-admin");

admin.initializeApp();

exports.onOrderStatusUpdate = onDocumentUpdated( // CORRECTED FUNCTION NAME
    "orders/{orderId}",
    async (event) => {
      // Get the new and old data from the event object
      const newValue = event.data.after.data();
      const previousValue = event.data.before.data();
      const orderId = event.params.orderId;

      // Log the change for debugging
      logger.info(`Order ${orderId} status changed from ${previousValue.status} to ${newValue.status}`);

      // Only send a notification if the status has actually changed
      if (newValue.status === previousValue.status) {
        logger.info("Status is the same, no notification needed.");
        return null;
      }

      let recipientId;
      let title = `Order Update: ${newValue.product.name}`;
      let body = `Your order status has been updated to "${newValue.status}".`;

      // Determine who should receive the notification
      if (newValue.status === "Pending") {
        logger.info("New order created, skipping notification to fulfiller for now.");
        return null;
      } else {
        // For all other status updates (Shipped, Completed, Cancelled), notify the customer
        recipientId = newValue.placedBy.uid;
      }

      if (!recipientId) {
        logger.warn("No recipient ID found for this order update.");
        return null;
      }

      // Get the recipient's push token from their user document
      try {
        const userDoc = await admin.firestore().collection("users").doc(recipientId).get();
        if (!userDoc.exists || !userDoc.data().expoPushToken) {
          logger.warn(`Recipient ${recipientId} does not have a push token.`);
          return null;
        }
        const pushToken = userDoc.data().expoPushToken;
        
        const message = {
          to: pushToken,
          sound: "default",
          title: title,
          body: body,
          data: { orderId: orderId },
        };

        const response = await fetch("https://exp.host/--/api/v2/push/send", {
          method: "POST",
          headers: {
            "Accept": "application/json",
            "Accept-encoding": "gzip, deflate",
            "Content-Type": "application/json",
          },
          body: JSON.stringify(message),
        });

        const responseBody = await response.json();
        logger.info("Expo Push API Response:", responseBody);

      } catch (error) {
        logger.error("Error sending push notification:", error);
      }

      return null;
    },
); // Added closing parenthesis