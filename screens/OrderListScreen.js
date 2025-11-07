import React, { useState } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, ActivityIndicator, ScrollView } from 'react-native';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { useFocusEffect } from '@react-navigation/native';

const STATUSES = ["All", "Pending", "Shipped", "Completed", "Cancelled"];

// A reusable component for the filter tabs
const FilterTabs = ({ selected, onSelect }) => {
    return (
        <View style={styles.filterContainer}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {STATUSES.map(status => (
                    <TouchableOpacity
                        key={status}
                        style={[styles.filterTab, selected === status && styles.selectedTab]}
                        onPress={() => onSelect(status)}
                    >
                        <Text style={[styles.filterText, selected === status && styles.selectedTabText]}>
                            {status}
                        </Text>
                    </TouchableOpacity>
                ))}
            </ScrollView>
        </View>
    );
};


const OrderListScreen = ({ navigation }) => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [userRole, setUserRole] = useState('');
    const [activeFilter, setActiveFilter] = useState("All"); // State for the active filter

    useFocusEffect(
        React.useCallback(() => {
            setLoading(true);
            const currentUser = auth.currentUser;
            if (!currentUser) return;

            const { role } = navigation.getState().routes.find(r => r.name === 'OrderList').params || {};
            setUserRole(role);

            // Base query definition
            let q = collection(db, 'orders');
            let constraints = [orderBy("createdAt", "desc")];
            
            // --- QUERY LOGIC ---
            // 1. Filter by user role
            if (role === 'admin') {
                constraints.push(where("fulfilledBy", "==", "admin"));
            } else if (role === 'distributor') {
                // For now, showing orders they FULFILL.
                // A toggle for "My Orders" vs "Incoming" would be a future enhancement.
                constraints.push(where("fulfilledBy", "==", currentUser.uid));
            } else { // medical_store
                constraints.push(where("placedBy.uid", "==", currentUser.uid));
            }

            // 2. Add status filter if not "All"
            if (activeFilter !== "All") {
                // Firestore queries are case-sensitive, so we might need to query for both
                // for robustness, but assuming our statuses are well-managed now.
                constraints.push(where("status", "==", activeFilter));
            }

            const finalQuery = query(q, ...constraints);

            const unsubscribe = onSnapshot(finalQuery, (querySnapshot) => {
                const ordersData = [];
                querySnapshot.forEach((doc) => {
                    ordersData.push({ ...doc.data(), id: doc.id });
                });
                setOrders(ordersData);
                setLoading(false);
            }, (error) => {
                console.error("Error fetching orders: ", error);
                setLoading(false);
            });

            return () => unsubscribe();
        }, [activeFilter]) // Re-run the effect whenever the activeFilter changes
    );
      
    const getStatusStyle = (status) => {
        // ... (this function remains the same) ...
        switch (status.toLowerCase()) {
            case 'pending': return styles.statusPending;
            case 'shipped': return styles.statusShipped;
            case 'completed': return styles.statusCompleted;
            case 'cancelled': return styles.statusCancelled;
            default: return {};
        }
    };

    const renderItem = ({ item }) => (
        // ... (this function remains the same) ...
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

    return (
        <View style={styles.container}>
            <FilterTabs selected={activeFilter} onSelect={setActiveFilter} />

            {loading ? <ActivityIndicator size="large" style={{ flex: 1 }} /> : (
                <FlatList
                    data={orders}
                    renderItem={renderItem}
                    keyExtractor={(item) => item.id}
                    ListEmptyComponent={<Text style={styles.emptyText}>No orders found for this filter.</Text>}
                />
            )}
        </View>
    );
};

// --- Add the new filter styles ---
const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f8f9fa' },
    filterContainer: {
        paddingVertical: 10,
        backgroundColor: 'white',
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
        paddingLeft: 10,
    },
    filterTab: {
        paddingHorizontal: 20,
        paddingVertical: 8,
        borderRadius: 20,
        marginHorizontal: 5,
        borderWidth: 1,
        borderColor: '#40916c',
    },
    selectedTab: {
        backgroundColor: '#40916c',
    },
    filterText: {
        color: '#40916c',
        fontSize: 14,
    },
    selectedTabText: {
        color: '#fff',
        fontWeight: 'bold',
    },
    // --- Existing styles ---
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