import React from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Image, TouchableOpacity, Alert, SafeAreaView, StatusBar } from 'react-native';
import { doc, onSnapshot, updateDoc, serverTimestamp, runTransaction } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { globalStyles, COLORS, FONTS, SPACING } from '../styles/globalStyles';
import { Ionicons } from '@expo/vector-icons';

const OrderDetailScreen = ({ route, navigation }) => {
  const { orderId, role } = route.params;
  const [order, setOrder] = React.useState(null);
  const [updating, setUpdating] = React.useState(false);

  React.useLayoutEffect(() => {
    navigation.setOptions({ title: `Order #${orderId.substring(0, 8)}...` });
  }, [navigation, orderId]);

  React.useEffect(() => {
    const docRef = doc(db, 'orders', orderId);
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        setOrder({ id: docSnap.id, ...docSnap.data() });
      }
    });
    return () => unsubscribe();
  }, [orderId]);

  const handleUpdateStatus = async (newStatus) => {
    setUpdating(true);
    const orderDocRef = doc(db, 'orders', orderId);

    try {
        if (newStatus === 'Completed') {
            await runTransaction(db, async (transaction) => {
                const productDocRef = doc(db, 'products', order.product.id);
                const productDoc = await transaction.get(productDocRef);

                if (!productDoc.exists()) throw new Error("Product not found!");

                const productData = productDoc.data();
                const newVariants = [...productData.variants];

                order.items.forEach(item => {
                    const variantIndex = newVariants.findIndex(v => v.size === item.size);
                    if (variantIndex > -1) {
                        newVariants[variantIndex].stock -= item.quantity;
                    }
                });

                transaction.update(productDocRef, { variants: newVariants });
                transaction.update(orderDocRef, { status: newStatus, lastUpdatedAt: serverTimestamp() });
            });
        } else {
            await updateDoc(orderDocRef, { status: newStatus, lastUpdatedAt: serverTimestamp() });
        }
        Alert.alert("Success", `Order updated to "${newStatus}".`);
    } catch (error) {
        Alert.alert("Error", error.message);
    } finally {
        setUpdating(false);
    }
  };

  const handleCancelOrder = () => {
    Alert.alert("Confirm Cancellation", "Are you sure?",
        [
            { text: "Back" },
            { text: "Yes, Cancel", style: "destructive", onPress: async () => {
                setUpdating(true);
                try {
                    await updateDoc(doc(db, 'orders', orderId), { status: 'Cancelled', lastUpdatedAt: serverTimestamp() });
                } catch (error) {
                    Alert.alert("Error", "Failed to cancel order.");
                } finally {
                    setUpdating(false);
                }
            }}
        ]
    );
  };

  const renderActionButtons = () => {
    if (updating) return <ActivityIndicator color={COLORS.primary} />;

    const currentUser = auth.currentUser;
    const canFulfill = (role === 'admin' && order.fulfilledBy === 'admin') || (role === 'distributor' && order.fulfilledBy === currentUser.uid);
    
    if (order.status.toLowerCase() === 'pending') {
        return (
            <View style={styles.actionContainer}>
                {canFulfill && (
                    <TouchableOpacity style={globalStyles.buttonPrimary} onPress={() => handleUpdateStatus('Shipped')}>
                        <Text style={globalStyles.buttonPrimaryText}>Mark as Shipped</Text>
                    </TouchableOpacity>
                )}
                <TouchableOpacity style={globalStyles.buttonDanger} onPress={handleCancelOrder}>
                    <Text style={globalStyles.buttonDangerText}>Cancel Order</Text>
                </TouchableOpacity>
            </View>
        );
    }
    if (order.status.toLowerCase() === 'shipped' && canFulfill) {
        return (
            <TouchableOpacity style={globalStyles.buttonSuccess} onPress={() => handleUpdateStatus('Completed')}>
                <Text style={globalStyles.buttonSuccessText}>Mark as Completed</Text>
            </TouchableOpacity>
        );
    }
    return null;
  };

  if (!order) {
    return <View style={globalStyles.centered}><ActivityIndicator size="large" color={COLORS.primary} /></View>;
  }

  const totalAmount = order.items.reduce((sum, item) => sum + item.totalPrice, 0);
  const orderDate = order.createdAt ? new Date(order.createdAt.seconds * 1000).toLocaleString() : 'N/A';

  const getStatusChip = (status) => {
      let style = styles.statusChipBase;
      let textStyle = styles.statusChipTextBase;
      switch (status?.toLowerCase()) {
          case 'pending': style = [style, styles.statusPending]; textStyle = [textStyle, styles.statusTextPending]; break;
          case 'shipped': style = [style, styles.statusShipped]; textStyle = [textStyle, styles.statusTextShipped]; break;
          case 'completed': style = [style, styles.statusCompleted]; textStyle = [textStyle, styles.statusTextCompleted]; break;
          case 'cancelled': style = [style, styles.statusCancelled]; textStyle = [textStyle, styles.statusTextCancelled]; break;
      }
      return <View style={style}><Text style={textStyle}>{status}</Text></View>;
  }

  return (
    <SafeAreaView style={globalStyles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.neutralGray} />
      <ScrollView style={styles.container}>
        {/* -- Order Info Card -- */}
        <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>Order Information</Text>
              {getStatusChip(order.status)}
            </View>
            <InfoRow icon="person-circle-outline" label="Placed By" value={order.placedBy.name} />
            <InfoRow icon="calendar-outline" label="Placed On" value={orderDate} />
            <InfoRow icon="receipt-outline" label="Order ID" value={order.id} isSelectable={true} />
        </View>

        {/* -- Items Card -- */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Order Summary</Text>
          <View style={styles.productHeader}>
            <Image source={{ uri: order.product.imageUrl }} style={styles.productImage} />
            <Text style={styles.productName}>{order.product.name}</Text>
          </View>
          {order.items.map((item, index) => (
            <View key={index} style={styles.itemRow}>
              <Text style={styles.itemText}>{item.quantity} x {item.size} ({item.pieces} pcs)</Text>
              <Text style={styles.itemPrice}>₹{item.totalPrice.toFixed(2)}</Text>
            </View>
          ))}
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalAmount}>₹{totalAmount.toFixed(2)}</Text>
          </View>
        </View>

        {/* -- Actions -- */}
        <View style={styles.actionsContainer}>
          {renderActionButtons()}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const InfoRow = ({ icon, label, value, isSelectable }) => (
  <View style={styles.infoRow}>
    <Ionicons name={icon} size={20} color={COLORS.textSecondary} style={{ marginRight: SPACING.sm }}/>
    <Text style={styles.infoLabel}>{label}:</Text>
    <Text style={styles.infoValue} selectable={isSelectable}>{value}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.neutralGray, paddingVertical: SPACING.md },
  card: { ...globalStyles.card, marginHorizontal: SPACING.md, marginBottom: SPACING.md, padding: SPACING.md },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.md },
  cardTitle: { ...FONTS.h3, color: COLORS.textPrimary },
  infoRow: { flexDirection: 'row', alignItems: 'center', marginVertical: SPACING.xs },
  infoLabel: { ...FONTS.body, color: COLORS.textSecondary, fontWeight: '500' },
  infoValue: { ...FONTS.body, color: COLORS.textPrimary, marginLeft: SPACING.sm, flex: 1 },
  productHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: SPACING.md, paddingBottom: SPACING.sm, borderBottomWidth: 1, borderBottomColor: COLORS.neutralGray2 },
  productImage: { width: 50, height: 50, borderRadius: 8, marginRight: SPACING.md },
  productName: { ...FONTS.h4, color: COLORS.textPrimary },
  itemRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: SPACING.sm },
  itemText: { ...FONTS.body, color: COLORS.textPrimary },
  itemPrice: { ...FONTS.body, color: COLORS.textPrimary, fontWeight: '500' },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', paddingTop: SPACING.md, marginTop: SPACING.sm, borderTopWidth: 1, borderTopColor: COLORS.neutralGray2 },
  totalLabel: { ...FONTS.h4, color: COLORS.textPrimary },
  totalAmount: { ...FONTS.h3, color: COLORS.primary },
  actionsContainer: { paddingHorizontal: SPACING.md, paddingBottom: SPACING.lg },
  actionContainer: { flexDirection: 'row', justifyContent: 'space-around' },
  // Status Chip Styles
  statusChipBase: { paddingVertical: SPACING.xs, paddingHorizontal: SPACING.md, borderRadius: 15 },
  statusChipTextBase: { ...FONTS.small, fontWeight: 'bold' },
  statusPending: { backgroundColor: '#FFEFC9' },
  statusTextPending: { color: '#D68400' },
  statusShipped: { backgroundColor: '#D8EAFE' },
  statusTextShipped: { color: '#3A75E5' },
  statusCompleted: { backgroundColor: '#D7F5D7' },
  statusTextCompleted: { color: '#2A8A2A' },
  statusCancelled: { backgroundColor: '#FAD9D9' },
  statusTextCancelled: { color: '#C73030' },
});

export default OrderDetailScreen;
