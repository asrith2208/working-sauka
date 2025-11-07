import React from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Image, TouchableOpacity, Alert } from 'react-native';
import { doc, onSnapshot, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '../firebase';

const OrderDetailScreen = ({ route }) => {
  const { orderId, role } = route.params; // We now receive the user's role
  const [order, setOrder] = React.useState(null);
  const [updating, setUpdating] = React.useState(false);

  React.useEffect(() => {
    const docRef = doc(db, 'orders', orderId);
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        setOrder(docSnap.data());
      }
    });
    return () => unsubscribe();
  }, [orderId]);

  const handleUpdateStatus = async (newStatus) => {
    setUpdating(true);
    const docRef = doc(db, 'orders', orderId);
    try {
      await updateDoc(docRef, {
        status: newStatus,
        lastUpdatedAt: serverTimestamp()
      });
      Alert.alert("Success", `Order status has been updated to "${newStatus}".`);
    } catch (error) {
      console.error("Error updating status:", error);
      Alert.alert("Error", "Failed to update order status.");
    } finally {
      setUpdating(false);
    }
  };

  if (!order) {
    return <ActivityIndicator size="large" style={{ flex: 1 }} />;
  }

  const currentUser = auth.currentUser;
  // Determine if the current user can update this order's status
  const canUpdateStatus = (role === 'admin' && order.fulfilledBy === 'admin') ||
                          (role === 'distributor' && order.fulfilledBy === currentUser.uid);

  const totalAmount = order.items.reduce((sum, item) => sum + item.totalPrice, 0);
  const orderDate = order.createdAt ? new Date(order.createdAt.seconds * 1000).toLocaleString() : 'Date N/A';

  const renderActionButtons = () => {
    if (!canUpdateStatus || updating) {
      return null;
    }

    switch (order.status.toLowerCase()) {
      case 'pending':
        return (
          <TouchableOpacity style={styles.button} onPress={() => handleUpdateStatus('Shipped')}>
            <Text style={styles.buttonText}>Mark as Shipped</Text>
          </TouchableOpacity>
        );
      case 'shipped':
        return (
          <TouchableOpacity style={styles.button} onPress={() => handleUpdateStatus('Completed')}>
            <Text style={styles.buttonText}>Mark as Completed</Text>
          </TouchableOpacity>
        );
      case 'completed':
        return <Text style={styles.finalStatusText}>This order is complete.</Text>;
      default:
        return null;
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.header}>Order Details</Text>
        <Text style={styles.detailText}>Order ID: {order.orderId}</Text>
        <Text style={styles.detailText}>Placed On: {orderDate}</Text>
        <Text style={styles.detailText}>Status: {order.status}</Text>
        <Text style={styles.detailText}>Placed By: {order.placedBy.name} ({order.placedBy.role})</Text>
      </View>
      
      <View style={styles.card}>
        <Text style={styles.header}>Items</Text>
        <View style={styles.productHeader}>
          <Image source={{ uri: order.product.imageUrl }} style={styles.productImage} />
          <Text style={styles.productName}>{order.product.name}</Text>
        </View>
        {order.items.map((item, index) => (
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
      
      <View style={styles.actionsContainer}>
        {renderActionButtons()}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
    container: { flex: 1, padding: 10, backgroundColor: '#f8f9fa' },
    card: { backgroundColor: '#fff', borderRadius: 8, padding: 20, marginBottom: 15 },
    header: { fontSize: 20, fontWeight: 'bold', marginBottom: 15 },
    detailText: { fontSize: 16, marginBottom: 8 },
    productHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
    productImage: { width: 50, height: 50, borderRadius: 5, marginRight: 10 },
    productName: { fontSize: 18, fontWeight: '600' },
    itemRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#eee' },
    itemText: { fontSize: 16 },
    totalRow: { flexDirection: 'row', justifyContent: 'space-between', paddingTop: 15, marginTop: 5 },
    totalText: { fontSize: 18, fontWeight: 'bold' },
    actionsContainer: { marginTop: 10, padding: 10 },
    button: { height: 50, backgroundColor: '#40916c', justifyContent: 'center', alignItems: 'center', borderRadius: 8 },
    buttonText: { color: '#ffffff', fontSize: 18, fontWeight: 'bold' },
    finalStatusText: { textAlign: 'center', fontSize: 16, color: '#5cb85c', fontStyle: 'italic', padding: 20 }
});

export default OrderDetailScreen;