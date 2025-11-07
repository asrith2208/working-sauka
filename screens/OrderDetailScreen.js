import React from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Image, TouchableOpacity, Alert } from 'react-native';
// Import runTransaction for atomic stock updates
import { doc, onSnapshot, updateDoc, serverTimestamp, runTransaction } from 'firebase/firestore';
import { db, auth } from '../firebase';

const OrderDetailScreen = ({ route }) => {
  const { orderId, role } = route.params;
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
    const orderDocRef = doc(db, 'orders', orderId);

    try {
        if (newStatus === 'Completed') {
            // Use a transaction for 'Completed' to ensure stock is updated safely
            await runTransaction(db, async (transaction) => {
                const productDocRef = doc(db, 'products', order.product.id);
                const productDoc = await transaction.get(productDocRef);

                if (!productDoc.exists()) {
                    throw new Error("Product does not exist!");
                }

                const productData = productDoc.data();
                const newVariants = [...productData.variants];

                order.items.forEach(item => {
                    const variantIndex = newVariants.findIndex(v => v.size === item.size);
                    if (variantIndex > -1) {
                        const currentStock = newVariants[variantIndex].stock;
                        if (currentStock < item.quantity) {
                            throw new Error(`Not enough stock for size ${item.size}. Only ${currentStock} left.`);
                        }
                        newVariants[variantIndex].stock -= item.quantity;
                    }
                });

                transaction.update(productDocRef, { variants: newVariants });
                transaction.update(orderDocRef, {
                    status: newStatus,
                    lastUpdatedAt: serverTimestamp()
                });
            });
        } else {
            // For other status updates ('Shipped'), a simple update is fine
            await updateDoc(orderDocRef, {
                status: newStatus,
                lastUpdatedAt: serverTimestamp()
            });
        }
        Alert.alert("Success", `Order status has been updated to "${newStatus}".`);

    } catch (error) {
        console.error("Error updating status:", error);
        Alert.alert("Transaction Failed", error.message);
    } finally {
        setUpdating(false);
    }
  };

  const handleCancelOrder = () => {
    Alert.alert(
        "Confirm Cancellation",
        "Are you sure you want to cancel this order? This action cannot be undone.",
        [
            { text: "Go Back", style: "cancel" },
            { text: "Yes, Cancel", style: "destructive", onPress: async () => {
                setUpdating(true);
                const docRef = doc(db, 'orders', orderId);
                try {
                    await updateDoc(docRef, {
                        status: 'Cancelled',
                        lastUpdatedAt: serverTimestamp()
                    });
                    Alert.alert("Success", "The order has been cancelled.");
                } catch (error) {
                    console.error("Error cancelling order:", error);
                    Alert.alert("Error", "Failed to cancel the order.");
                } finally {
                    setUpdating(false);
                }
            }}
        ]
    );
  };


  if (!order) {
    return <ActivityIndicator size="large" style={{ flex: 1, justifyContent: 'center' }} />;
  }

  // --- Main Render Function ---
  const totalAmount = order.items.reduce((sum, item) => sum + item.totalPrice, 0);
  const orderDate = order.createdAt ? new Date(order.createdAt.seconds * 1000).toLocaleString() : 'Date N/A';

  const renderActionButtons = () => {
    if (updating) return <ActivityIndicator />;

    const currentUser = auth.currentUser;
    // The user who fulfills the order (Admin or Distributor)
    const canFulfill = (role === 'admin' && order.fulfilledBy === 'admin') ||
                       (role === 'distributor' && order.fulfilledBy === currentUser.uid);
    
    // The user who placed the order
    const isCustomer = order.placedBy.uid === currentUser.uid;

    if (order.status.toLowerCase() === 'pending') {
        return (
            <View>
                {canFulfill && (
                    <TouchableOpacity style={styles.button} onPress={() => handleUpdateStatus('Shipped')}>
                        <Text style={styles.buttonText}>Mark as Shipped</Text>
                    </TouchableOpacity>
                )}
                {/* Both fulfiller and customer can cancel a pending order */}
                <TouchableOpacity style={[styles.button, styles.cancelButton]} onPress={handleCancelOrder}>
                    <Text style={styles.buttonText}>Cancel Order</Text>
                </TouchableOpacity>
            </View>
        );
    }

    if (order.status.toLowerCase() === 'shipped') {
        if (canFulfill) {
            return (
                <TouchableOpacity style={styles.button} onPress={() => handleUpdateStatus('Completed')}>
                    <Text style={styles.buttonText}>Mark as Completed</Text>
                </TouchableOpacity>
            );
        }
    }

    if (order.status.toLowerCase() === 'completed') {
        return <Text style={styles.finalStatusText}>This order is complete.</Text>;
    }

    if (order.status.toLowerCase() === 'cancelled') {
        return <Text style={[styles.finalStatusText, {color: '#d9534f'}]}>This order was cancelled.</Text>;
    }

    return null; // Return null if no actions are available
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
    cancelButton: { backgroundColor: '#d9534f', marginTop: 10, },
    finalStatusText: { textAlign: 'center', fontSize: 16, color: '#5cb85c', fontStyle: 'italic', padding: 20 }
});

export default OrderDetailScreen;