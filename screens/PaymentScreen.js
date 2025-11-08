import React from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { WebView } from 'react-native-webview';

const PaymentScreen = ({ route, navigation }) => {
    const { orderDetails, razorpayOrderId } = route.params;

    // This is the HTML that will be loaded in the WebView. It includes Razorpay's checkout script.
    const checkoutHtml = `
      <html>
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body>
          <script src="https://checkout.razorpay.com/v1/checkout.js"></script>
          <script>
            var options = {
              "key": "${RAZORPAY_KEY_ID}",
              "amount": "${orderDetails.totalAmount * 100}",
              "currency": "INR",
              "name": "Saukyam Pads",
              "description": "Payment for ${orderDetails.product.name}",
              "image": "${orderDetails.product.imageUrl || 'https://i.imgur.com/3g7nmJC.png'}",
              "order_id": "${razorpayOrderId}",
              "handler": function (response){
                // This sends a message back to the React Native app on success
                window.ReactNativeWebView.postMessage(JSON.stringify({
                  status: 'success',
                  paymentId: response.razorpay_payment_id,
                  orderId: response.razorpay_order_id,
                  signature: response.razorpay_signature
                }));
              },
              "prefill": {
                "name": "${orderDetails.userName}",
                "email": "${orderDetails.userEmail}",
                "contact": "${orderDetails.userPhone}"
              },
              "theme": {
                "color": "#40916c"
              }
            };
            var rzp = new Razorpay(options);
            rzp.on('payment.failed', function (response){
                // This sends a message back to the React Native app on failure
                window.ReactNativeWebView.postMessage(JSON.stringify({
                  status: 'failure',
                  error_code: response.error.code,
                  error_description: response.error.description
                }));
            });
            
            // Open the checkout immediately
            rzp.open();
          </script>
        </body>
      </html>
    `;

    const handleWebViewMessage = (event) => {
        const data = JSON.parse(event.nativeEvent.data);
        if (data.status === 'success') {
            // Payment was successful, navigate back and pass the payment details
            navigation.navigate('OrderSummary', { paymentResult: data });
        } else {
            // Payment failed, just go back
            navigation.goBack();
            alert(`Payment failed: ${data.error_description}`);
        }
    };

    return (
        <WebView
            originWhitelist={['*']}
            source={{ html: checkoutHtml }}
            onMessage={handleWebViewMessage}
            startInLoadingState={true}
            renderLoading={() => <ActivityIndicator size="large" style={StyleSheet.absoluteFill} />}
        />
    );
};

// You need to re-import your Razorpay Key ID here
const RAZORPAY_KEY_ID = "YOUR_TEST_KEY_ID"; 

export default PaymentScreen;