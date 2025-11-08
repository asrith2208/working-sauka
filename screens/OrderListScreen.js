import React, { useState, useMemo } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, ActivityIndicator, ScrollView, TextInput, SafeAreaView, StatusBar } from 'react-native';
import { collection, query, where, orderBy, onSnapshot, Timestamp } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { useFocusEffect } from '@react-navigation/native';
import DateTimePickerModal from "react-native-modal-datetime-picker";
import { globalStyles, COLORS, FONTS, SPACING } from '../styles/globalStyles';
import { Ionicons } from '@expo/vector-icons';

const STATUSES = ["All", "Pending", "Shipped", "Completed", "Cancelled"];

const FilterTabs = ({ selected, onSelect }) => {
    return (
        <View style={styles.filterContainer}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: SPACING.md }}>
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

const OrderListScreen = ({ navigation, route }) => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeFilter, setActiveFilter] = useState("All");
    const [startDate, setStartDate] = useState(null);
    const [endDate, setEndDate] = useState(null);
    const [isDatePickerVisible, setDatePickerVisibility] = useState(false);
    const [datePickerMode, setDatePickerMode] = useState('start');
    const [searchQuery, setSearchQuery] = useState('');
    const userRole = route.params?.role;

    useFocusEffect(
        React.useCallback(() => {
            setLoading(true);
            const currentUser = auth.currentUser;
            if (!currentUser) return;

            let q = collection(db, 'orders');
            let constraints = [orderBy("createdAt", "desc")];

            if (userRole === 'admin') {
                constraints.push(where("fulfilledBy", "==", "admin"));
            } else if (userRole === 'distributor') {
                constraints.push(where("fulfilledBy", "==", currentUser.uid));
            } else { // medical_store
                constraints.push(where("placedBy.uid", "==", currentUser.uid));
            }

            if (activeFilter !== "All") {
                constraints.push(where("status", "==", activeFilter));
            }

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
        }, [activeFilter, startDate, endDate, userRole])
    );

    const filteredOrders = useMemo(() => {
        if (!searchQuery) return orders;
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

    const hideDatePicker = () => setDatePickerVisibility(false);

    const handleConfirmDate = (date) => {
        if (datePickerMode === 'start') setStartDate(date);
        else setEndDate(date);
        hideDatePicker();
    };
    
    const clearDates = () => {
        setStartDate(null);
        setEndDate(null);
    };
    
    const getStatusStyle = (status) => {
        switch (status?.toLowerCase()) {
            case 'pending': return { backgroundColor: COLORS.warning, color: COLORS.white };
            case 'shipped': return { backgroundColor: COLORS.info, color: COLORS.white };
            case 'completed': return { backgroundColor: COLORS.success, color: COLORS.white };
            case 'cancelled': return { backgroundColor: COLORS.danger, color: COLORS.white };
            default: return { backgroundColor: COLORS.neutralGray2, color: COLORS.textSecondary };
        }
    };

    const renderItem = ({ item }) => {
        const statusStyle = getStatusStyle(item.status);
        return (
            <TouchableOpacity style={styles.orderItem} onPress={() => navigation.navigate('OrderDetail', { orderId: item.id, role: userRole })}>
                <View style={styles.orderItemHeader}>
                    <Text style={styles.orderId}>ID: {item.id.substring(0, 8)}...</Text>
                    <View style={[styles.statusBadge, { backgroundColor: statusStyle.backgroundColor }]}>
                        <Text style={[styles.statusText, { color: statusStyle.color }]}>{item.status}</Text>
                    </View>
                </View>
                <View style={styles.orderItemBody}>
                    {userRole !== 'medical_store' && <Text style={styles.placedBy}>From: {item.placedBy.name}</Text>}
                    <Text style={styles.orderDate}>
                        {item.createdAt ? new Date(item.createdAt.seconds * 1000).toLocaleDateString() : 'N/A'}
                    </Text>
                    <Text style={styles.orderTotal}>₹{item.totalAmount.toFixed(2)}</Text>
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <SafeAreaView style={globalStyles.safeArea}>
            <StatusBar barStyle="dark-content" backgroundColor={COLORS.neutralGray} />
            <View style={styles.container}>
                <Text style={globalStyles.h1}>My Orders</Text>

                <DateTimePickerModal isVisible={isDatePickerVisible} mode="date" onConfirm={handleConfirmDate} onCancel={hideDatePicker} />

                <FilterTabs selected={activeFilter} onSelect={setActiveFilter} />

                <View style={styles.controlsContainer}>
                    <View style={styles.searchContainer}>
                        <Ionicons name="search-outline" size={20} color={COLORS.textSecondary} style={{marginLeft: SPACING.sm}}/>
                        <TextInput
                            style={styles.searchInput}
                            placeholder={userRole !== 'medical_store' ? "Search ID or Name..." : "Search by Order ID..."}
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                            placeholderTextColor={COLORS.textSecondary}
                        />
                    </View>
                    {/* Add date filter UI if needed in the future */}
                </View>

                {loading ? <ActivityIndicator size="large" color={COLORS.primary} style={{ flex: 1 }} /> : (
                    <FlatList
                        data={filteredOrders}
                        renderItem={renderItem}
                        keyExtractor={(item) => item.id}
                        contentContainerStyle={{ paddingHorizontal: SPACING.md, paddingBottom: SPACING.md }}
                        ListEmptyComponent={<View style={globalStyles.centered}><Text style={styles.emptyText}>No orders found.</Text></View>}
                    />
                )}
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.neutralGray },
    filterContainer: { paddingVertical: SPACING.sm, backgroundColor: COLORS.neutralGray },
    filterTab: { paddingHorizontal: SPACING.lg, paddingVertical: SPACING.sm, borderRadius: 20, marginHorizontal: 4, backgroundColor: COLORS.white },
    selectedTab: { backgroundColor: COLORS.primary },
    filterText: { ...FONTS.body, color: COLORS.textPrimary, fontWeight: '500' },
    selectedTabText: { color: COLORS.white },
    controlsContainer: {
        paddingHorizontal: SPACING.md,
        paddingBottom: SPACING.sm
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.white,
        borderRadius: 8,
    },
    searchInput: {
        flex: 1,
        height: 45,
        paddingHorizontal: SPACING.sm,
        ...FONTS.body,
    },
    orderItem: {
        ...globalStyles.card,
        marginHorizontal: SPACING.md,
        marginBottom: SPACING.sm,
        padding: SPACING.md
    },
    orderItemHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottomWidth: 1,
        borderBottomColor: COLORS.neutralGray2,
        paddingBottom: SPACING.sm,
        marginBottom: SPACING.sm
    },
    orderId: { ...FONTS.h4, color: COLORS.textPrimary },
    statusBadge: { paddingHorizontal: SPACING.md, paddingVertical: SPACING.xs, borderRadius: 12 },
    statusText: { ...FONTS.small, fontWeight: 'bold' },
    orderItemBody: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center'
    },
    placedBy: { ...FONTS.body, color: COLORS.textSecondary, flex: 1 },
    orderDate: { ...FONTS.body, color: COLORS.textSecondary },
    orderTotal: { ...FONTS.h4, color: COLORS.primary },
    emptyText: { ...FONTS.body, color: COLORS.textSecondary, marginTop: SPACING.lg }
});

export default OrderListScreen;
