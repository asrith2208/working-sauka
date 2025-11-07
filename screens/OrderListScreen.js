import React, { useState, useMemo } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, ActivityIndicator, ScrollView, TextInput } from 'react-native';
import { collection, query, where, orderBy, onSnapshot, Timestamp } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { useFocusEffect } from '@react-navigation/native';
import DateTimePickerModal from "react-native-modal-datetime-picker";

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
    const [orders, setOrders] = useState([]); // Holds the raw data from Firestore
    const [loading, setLoading] = useState(true);
    const [userRole, setUserRole] = useState('');
    const [activeFilter, setActiveFilter] = useState("All");
    const [startDate, setStartDate] = useState(null);
    const [endDate, setEndDate] = useState(null);
    const [isDatePickerVisible, setDatePickerVisibility] = useState(false);
    const [datePickerMode, setDatePickerMode] = useState('start');
    const [searchQuery, setSearchQuery] = useState(''); // State for the search bar

    useFocusEffect(
        React.useCallback(() => {
            setLoading(true);
            const currentUser = auth.currentUser;
            if (!currentUser) return;

            const { role } = navigation.getState().routes.find(r => r.name === 'OrderList').params || {};
            setUserRole(role);

            let q = collection(db, 'orders');
            let constraints = [orderBy("createdAt", "desc")];

            // Filter by user role
            if (role === 'admin') {
                constraints.push(where("fulfilledBy", "==", "admin"));
            } else if (role === 'distributor') {
                constraints.push(where("fulfilledBy", "==", currentUser.uid));
            } else { // medical_store
                constraints.push(where("placedBy.uid", "==", currentUser.uid));
            }

            // Add status filter
            if (activeFilter !== "All") {
                constraints.push(where("status", "==", activeFilter));
            }

            // Add date filter
            if (startDate) {
                constraints.push(where("createdAt", ">=", Timestamp.fromDate(startDate)));
            }
            if (endDate) {
                const endOfDay = new Date(endDate);
                endOfDay.setHours(23, 59, 59, 999);
                constraints.push(where("createdAt", "<=", Timestamp.fromDate(endOfDay)));
            }

            const finalQuery = query(q, ...constraints);

            const unsubscribe = onSnapshot(finalQuery, (snapshot) => {
                const ordersData = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
                setOrders(ordersData);
                setLoading(false);
            }, (error) => {
                console.error("Error fetching orders: ", error);
                setLoading(false);
            });

            return () => unsubscribe();
        }, [activeFilter, startDate, endDate])
    );

    // Client-side filtering logic for the search bar
    const filteredOrders = useMemo(() => {
        if (!searchQuery) {
            return orders; // If search is empty, return all orders from the current query
        }
        const lowercasedQuery = searchQuery.toLowerCase();
        return orders.filter(order => {
            const orderIdMatch = order.id.toLowerCase().includes(lowercasedQuery);
            const placedByNameMatch = order.placedBy?.name?.toLowerCase().includes(lowercasedQuery);
            return orderIdMatch || placedByNameMatch;
        });
    }, [searchQuery, orders]);

    const showDatePicker = (mode) => {
        setDatePickerMode(mode);
        setDatePickerVisibility(true);
    };

    const hideDatePicker = () => {
        setDatePickerVisibility(false);
    };

    const handleConfirmDate = (date) => {
        if (datePickerMode === 'start') {
            setStartDate(date);
        } else {
            setEndDate(date);
        }
        hideDatePicker();
    };
    
    const clearDates = () => {
        setStartDate(null);
        setEndDate(null);
    };
    
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

    return (
        <View style={styles.container}>
            <DateTimePickerModal
                isVisible={isDatePickerVisible}
                mode="date"
                onConfirm={handleConfirmDate}
                onCancel={hideDatePicker}
            />

            <FilterTabs selected={activeFilter} onSelect={setActiveFilter} />

            <View style={styles.dateFilterContainer}>
                <TouchableOpacity style={styles.dateBox} onPress={() => showDatePicker('start')}>
                    <Text style={styles.dateLabel}>Start Date</Text>
                    <Text style={styles.dateText}>{startDate ? startDate.toLocaleDateString() : 'Select'}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.dateBox} onPress={() => showDatePicker('end')}>
                    <Text style={styles.dateLabel}>End Date</Text>
                    <Text style={styles.dateText}>{endDate ? endDate.toLocaleDateString() : 'Select'}</Text>
                </TouchableOpacity>
                {(startDate || endDate) && (
                    <TouchableOpacity style={styles.clearButton} onPress={clearDates}>
                        <Text style={styles.clearButtonText}>Clear</Text>
                    </TouchableOpacity>
                )}
            </View>
            
            <View style={styles.searchContainer}>
                <TextInput
                    style={styles.searchInput}
                    placeholder="Search by Order ID or Placed By Name..."
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                />
            </View>

            {loading ? <ActivityIndicator size="large" style={{ flex: 1 }} /> : (
                <FlatList
                    data={filteredOrders}
                    renderItem={renderItem}
                    keyExtractor={(item) => item.id}
                    ListEmptyComponent={<Text style={styles.emptyText}>No orders found for the selected filters.</Text>}
                />
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f8f9fa' },
    filterContainer: { paddingVertical: 10, backgroundColor: 'white', borderBottomWidth: 1, borderBottomColor: '#eee', paddingLeft: 10 },
    filterTab: { paddingHorizontal: 20, paddingVertical: 8, borderRadius: 20, marginHorizontal: 5, borderWidth: 1, borderColor: '#40916c' },
    selectedTab: { backgroundColor: '#40916c' },
    filterText: { color: '#40916c', fontSize: 14 },
    selectedTabText: { color: '#fff', fontWeight: 'bold' },
    dateFilterContainer: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center', padding: 10, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#eee' },
    dateBox: { flex: 1, alignItems: 'center', padding: 8, borderWidth: 1, borderColor: '#ddd', borderRadius: 5, marginHorizontal: 5 },
    dateLabel: { fontSize: 12, color: '#666' },
    dateText: { fontSize: 14, fontWeight: 'bold', color: '#333' },
    clearButton: { padding: 8 },
    clearButtonText: { color: '#d9534f', fontSize: 14, fontWeight: 'bold' },
    searchContainer: { paddingHorizontal: 10, paddingVertical: 8, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#eee' },
    searchInput: { height: 40, backgroundColor: '#f0f4f7', borderRadius: 8, paddingHorizontal: 15, fontSize: 16 },
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