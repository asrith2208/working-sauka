import React from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { useFocusEffect } from '@react-navigation/native';

const OrderListScreen = ({ navigation }) => {
  const [orders, setOrders] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [userRole, setUserRole] = React.useState(''); // To hold the user's role

  // useFocusEffect runs every time the screen comes into view
  useFocusEffect(
    React.useCallback(() => {
      setLoading(true);
      const currentUser = auth.currentUser;
      if (!currentUser) return;

      // We need the user's role to build the correct query
      // In a real app, you might get this from a global state/context
      // For now, we'll assume the role is stable during the session
      // Let's create a placeholder to get the role; in App.js it's already fetched.
      // We can pass it via navigation params for simplicity.
      // Note: A better long-term solution is React Context for user data.

      const { role } = navigation.getState().routes.find(r => r.name === 'OrderList').params || {};
      setUserRole(role);

      let ordersQuery;
      if (role === 'admin') {
        // Admin sees orders that need to be fulfilled by them
        ordersQuery = query(collection(db, 'orders'), where("fulfilledBy", "==", "admin"), orderBy("createdAt", "desc"));
      } else if (role === 'distributor') {
        // Distributor sees orders placed BY them AND orders they need to FULFILL
        // This requires two separate queries, which we'll handle on the screen
        // For now, let's just show orders they need to fulfill for simplicity.
        ordersQuery = query(collection(db, 'orders'), where("fulfilledBy", "==", currentUser.uid), orderBy("createdAt", "desc"));
      } else { // medical_store
        // Medical Store sees orders placed BY them
        ordersQuery = query(collection(db, 'orders'), where("placedBy.uid", "==", currentUser.uid), orderBy("createdAt", "desc"));
      }

      const unsubscribe = onSnapshot(ordersQuery, (querySnapshot) => {
        const ordersData = [];
        querySnapshot.forEach((doc) => {
          ordersData.push({ ...doc.data(), id: doc.id });
        });
        setOrders(ordersData);
        setLoading(false);
      });

      return () => unsubscribe();
    }, [])
  );
  
  const getStatusStyle = (status) => {
      switch (status.toLowerCase()) {
          case 'pending': return styles.statusPending;
          case 'shipped': return styles.statusShipped;
          case 'completed': return styles.statusCompleted;
          case 'cancelled': return styles.statusCancelled;
          default: return {};
      }
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity style={styles.orderItem} onPress={() => navigation.navigate('OrderDetail', { orderId: item.id, role: userRole })}>
      <View>
        <Text style={styles.orderId}>Order ID: {item.id.substring(0, 8)}...</Text>
        <Text style={styles.orderDate}>
          {item.createdAt ? new Date(item.createdAt.seconds * 1000).toLocaleDateString() : 'Date N/A'}
        </Text>
        {userRole !== 'medical_store' && <Text style={styles.placedBy}>By: {item.placedBy.name}</Text>}
      </View>
      <View style={[styles.statusBadge, getStatusStyle(item.status)]}>
        <Text style={styles.statusText}>{item.status}</Text>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return <ActivityIndicator size="large" style={{ flex: 1 }} />;
  }
  
  return (
    <View style={styles.container}>
      <FlatList
        data={orders}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={<Text style={styles.emptyText}>No orders found.</Text>}
      />
    </View>
  );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f8f9fa' },
    orderItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#eee' },
    orderId: { fontSize: 16, fontWeight: 'bold' },
    orderDate: { fontSize: 14, color: '#666', marginTop: 4 },
    placedBy: { fontSize: 14, color: '#333', fontStyle: 'italic', marginTop: 4 },
    statusBadge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 15 },
    statusText: { color: '#fff', fontWeight: 'bold', fontSize: 12 },
    statusPending: { backgroundColor: '#f0ad4e' },
    statusShipped: { backgroundColor: '#5bc0de' },
    statusCompleted: { backgroundColor: '#5cb85c' },
    statusCancelled: { backgroundColor: '#d9534f' },
    emptyText: { textAlign: 'center', marginTop: 50, fontSize: 16 }
});

export default OrderListScreen;