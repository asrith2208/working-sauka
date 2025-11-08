import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator, SafeAreaView, StatusBar, Image } from 'react-native';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { doc, getDoc, setDoc, updateDoc, serverTimestamp, collection } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { globalStyles, COLORS, FONTS, SPACING } from '../styles/globalStyles';

const OrderSummaryScreen = ({ route, navigation }) => {
    const { orderDetails } = route.params;
    const [currentUserData, setCurrentUserData] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    const [localOrderId, setLocalOrderId] = useState(null);

    useEffect(() => {
        const fetchUserData = async () => {
            const docRef = doc(db, 'users', auth.currentUser.uid);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                setCurrentUserData(docSnap.data());
            } else {
                Alert.alert("Error", "Could not find user data.");
            }
        };
        fetchUserData();

        if (route.params?.paymentResult && localOrderId) {
            const { status, paymentId } = route.params.paymentResult;
            if (status === 'success' && !submitting) {
                updateOrderAfterPayment(paymentId);
            }
        }
    }, [route.params?.paymentResult, localOrderId]);

    const totalAmount = orderDetails.items.reduce((sum, item) => sum + item.totalPrice, 0);

    const handleProceedToPayment = async () => {
        if (!currentUserData) {
            Alert.alert("Error", "Still fetching your data. Please wait a moment.");
            return;
        }
        setSubmitting(true);

        try {
            const functions = getFunctions();
            const createRazorpayOrder = httpsCallable(functions, 'createRazorpayOrder');
            const response = await createRazorpayOrder({ amount: totalAmount * 100, currency: "INR" });
            
            const { orderId: razorpayOrderId } = response.data;
            if (!razorpayOrderId) throw new Error("Razorpay order ID not returned.");

            const newOrderRef = doc(collection(db, 'orders'));
            setLocalOrderId(newOrderRef.id);

            await setDoc(newOrderRef, {
                orderId: newOrderRef.id,
                razorpayOrderId,
                placedBy: { uid: currentUserData.uid, name: currentUserData.name, role: currentUserData.role },
                fulfilledBy: currentUserData.role === 'medical_store' ? currentUserData.mapped_to_distributor : 'admin',
                items: orderDetails.items,
                product: orderDetails.product,
                totalAmount,
                status: 'Pending Payment',
                paymentStatus: 'Unpaid',
                createdAt: serverTimestamp(),
            });

            navigation.navigate('Payment', {
                razorpayOrderId,
                orderDetails: {
                    ...orderDetails,
                    totalAmount,
                    userName: currentUserData.name,
                    userEmail: currentUserData.email,
                    userPhone: currentUserData.phone,
                }
            });

        } catch (error) {
            console.error("Error during payment process:", error);
            Alert.alert("Payment Error", "Could not connect to the payment gateway. Please try again later.");
        } finally {
            setSubmitting(false);
        }
    };

    const updateOrderAfterPayment = async (paymentId) => {
        setSubmitting(true);
        try {
            const orderRef = doc(db, "orders", localOrderId);
            await updateDoc(orderRef, {
                status: 'Paid', 
                paymentStatus: 'Paid',
                paymentId: paymentId, 
            });
            Alert.alert('Payment Successful', `Your order has been placed successfully! Payment ID: ${paymentId}` );
            navigation.popToTop();
        } catch (error) {
            console.error("Critical Error:", error);
            Alert.alert("Critical Error", "Your payment was successful, but we failed to update your order. Please contact support immediately.");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.neutralGray }}>
            <StatusBar barStyle="dark-content" backgroundColor={COLORS.neutralGray} />
            <ScrollView contentContainerStyle={styles.container}>
                <Text style={globalStyles.h2}>Review Your Order</Text>

                <View style={[globalStyles.card, styles.summaryCard]}>
                  <View style={styles.cardHeader}>
                    <Image source={{ uri: orderDetails.product.imageUrl }} style={styles.productImage} />
                    <Text style={styles.productName}>{orderDetails.product.name}</Text>
                  </View>

                  {orderDetails.items.map((item, index) => (
                      <View key={index} style={styles.itemRow}>
                          <Text style={styles.itemText}>{item.quantity} x {item.size} ({item.pieces} pcs)</Text>
                          <Text style={styles.itemText}>₹{item.totalPrice.toFixed(2)}</Text>
                      </View>
                  ))}

                  <View style={styles.separator} />

                  <View style={styles.totalRow}>
                      <Text style={styles.totalText}>Total Payable</Text>
                      <Text style={styles.totalAmount}>₹{totalAmount.toFixed(2)}</Text>
                  </View>
                </View>

            </ScrollView>
            <View style={styles.footer}>
                <TouchableOpacity style={globalStyles.buttonPrimary} onPress={handleProceedToPayment} disabled={submitting || !currentUserData}>
                    {submitting ? (
                        <ActivityIndicator color={COLORS.white} />
                    ) : (
                        <Text style={globalStyles.buttonPrimaryText}>Proceed to Payment</Text>
                    )}
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { 
        padding: SPACING.md,
        paddingBottom: SPACING.xl, // Extra padding for footer space
    },
    summaryCard: {
      marginTop: SPACING.lg,
    },
    cardHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingBottom: SPACING.md,
      marginBottom: SPACING.md,
      borderBottomWidth: 1,
      borderBottomColor: COLORS.neutralGray2,
    },
    productImage: {
      width: 50,
      height: 50,
      borderRadius: 8,
      marginRight: SPACING.md,
    },
    productName: { 
      ...FONTS.h3,
      flex: 1,
    },
    itemRow: { 
      flexDirection: 'row', 
      justifyContent: 'space-between', 
      paddingVertical: SPACING.sm,
    },
    itemText: { 
      ...FONTS.body,
      color: COLORS.textSecondary
    },
    separator: {
      height: 1,
      backgroundColor: COLORS.neutralGray2,
      marginVertical: SPACING.md,
    },
    totalRow: { 
      flexDirection: 'row', 
      justifyContent: 'space-between', 
      alignItems: 'center',
    },
    totalText: { 
      ...FONTS.body,
      fontSize: 18,
      fontWeight: '600',
    },
    totalAmount: {
      ...FONTS.h2,
      color: COLORS.primary
    },
    footer: {
        padding: SPACING.md,
        borderTopWidth: 1,
        borderTopColor: COLORS.neutralGray2,
        backgroundColor: COLORS.white,
    },
});

export default OrderSummaryScreen;
