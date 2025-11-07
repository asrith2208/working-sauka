import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { doc, getDoc, setDoc, serverTimestamp, collection } from 'firebase/firestore';
import { db, auth } from '../firebase';

const OrderSummaryScreen = ({ route, navigation }) => {
  const { orderDetails } = route.params;
  const [currentUserData, setCurrentUserData] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchUserData = async () => {
      const docRef = doc(db, 'users', auth.currentUser.uid);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setCurrentUserData(docSnap.data());
      }
    };
    fetchUserData();
  }, []);

  const totalAmount = orderDetails.items.reduce((sum, item) => sum + item.totalPrice, 0);

  const handleConfirmOrder = async () => {
    if (!currentUserData) {
      Alert.alert("Error", "Could not verify user data. Please try again.");
      return;
    }
    setSubmitting(true);
    try {
      const newOrderRef = doc(collection(db, 'orders'));
      
      let fulfilledBy = 'admin'; // Default for distributors ordering
      if (currentUserData.role === 'medical_store') {
        fulfilledBy = currentUserData.mapped_to_distributor;
      }

      await setDoc(newOrderRef, {
        orderId: newOrderRef.id,
        placedBy: {
          uid: currentUserData.uid,
          name: currentUserData.name,
          role: currentUserData.role
        },
        fulfilledBy,
        items: orderDetails.items,
        product: orderDetails.product,
        totalAmount,
        status: 'Pending',
        createdAt: serverTimestamp(),
      });

      Alert.alert("Order Placed!", "Your order has been successfully placed.");
      navigation.popToTop(); // Go back to the dashboard

    } catch (error) {
      console.error("Error placing order:", error);
      Alert.alert("Error", "There was an issue placing your order.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.header}>Order Summary</Text>
      <View style={styles.card}>
        <Text style={styles.productName}>{orderDetails.product.name}</Text>
        {orderDetails.items.map((item, index) => (
          <View key={index} style={styles.itemRow}>
            <Text style={styles.itemText}>{item.quantity} x {item.size} ({item.pieces} pcs)</Text>
            <Text style={styles.itemText}>₹{item.totalPrice.toFixed(2)}</Text>
          </View>
        ))}
        <View style={styles.totalRow}>
          <Text style={styles.totalText}>Total Amount</Text>
          <Text style={styles.totalText}>₹{totalAmount.toFixed(2)}</Text>
        </View>
      </View>
      <TouchableOpacity style={styles.button} onPress={handleConfirmOrder} disabled={submitting}>
        <Text style={styles.buttonText}>{submitting ? 'Placing Order...' : 'Confirm and Place Order'}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
    container: { flex: 1, padding: 20, backgroundColor: '#f8f9fa' },
    header: { fontSize: 24, fontWeight: 'bold', marginBottom: 20, color: '#2d6a4f' },
    card: { backgroundColor: '#fff', borderRadius: 8, padding: 20, marginBottom: 20 },
    productName: { fontSize: 18, fontWeight: '600', borderBottomWidth: 1, borderBottomColor: '#eee', paddingBottom: 10, marginBottom: 10 },
    itemRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8 },
    itemText: { fontSize: 16 },
    totalRow: { flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: '#eee', paddingTop: 10, marginTop: 10 },
    totalText: { fontSize: 18, fontWeight: 'bold' },
    button: { height: 50, backgroundColor: '#40916c', justifyContent: 'center', alignItems: 'center', borderRadius: 8 },
    buttonText: { color: '#ffffff', fontSize: 18, fontWeight: 'bold' }
});

export default OrderSummaryScreen;