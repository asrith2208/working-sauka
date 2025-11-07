import React, { useState } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator } from 'react-native';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { useFocusEffect } from '@react-navigation/native';

const DistributorStoreListScreen = () => {
    const [medicalStores, setMedicalStores] = useState([]);
    const [loading, setLoading] = useState(true);
    const currentUser = auth.currentUser;

    useFocusEffect(
        React.useCallback(() => {
            const fetchData = async () => {
                if (!currentUser) return;
                setLoading(true);
                try {
                    // Step 1: Fetch all medical stores mapped to this distributor
                    const storesQuery = query(
                        collection(db, 'users'),
                        where('role', '==', 'medical_store'),
                        where('mapped_to_distributor', '==', currentUser.uid)
                    );

                    // Step 2: Fetch all completed orders fulfilled by this distributor
                    const ordersQuery = query(
                        collection(db, 'orders'),
                        where('status', 'in', ['completed', 'Completed']),
                        where('fulfilledBy', '==', currentUser.uid)
                    );

                    const [storeSnapshot, orderSnapshot] = await Promise.all([
                        getDocs(storesQuery),
                        getDocs(ordersQuery)
                    ]);

                    const storeData = storeSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

                    // Step 3: Process and aggregate the sales data for each store
                    const salesDataMap = new Map();
                    orderSnapshot.forEach(doc => {
                        const order = doc.data();
                        const storeId = order.placedBy.uid;
                        salesDataMap.set(storeId, (salesDataMap.get(storeId) || 0) + order.totalAmount);
                    });

                    // Step 4: Combine data for the final list
                    const enrichedStores = storeData.map(store => ({
                        ...store,
                        totalSales: salesDataMap.get(store.id) || 0,
                    }));
                    
                    setMedicalStores(enrichedStores);

                } catch (error) {
                    console.error("Error fetching medical store performance data:", error);
                } finally {
                    setLoading(false);
                }
            };

            fetchData();
        }, [currentUser])
    );

    const renderItem = ({ item }) => (
        <View style={styles.card}>
            <Text style={styles.storeName}>{item.name}</Text>
            <Text style={styles.storeContact}>{item.phone}</Text>
            <Text style={styles.storeContact}>{item.address}</Text>
            
            <View style={styles.kpiContainer}>
                <View style={styles.kpiBox}>
                    <Text style={styles.kpiValue}>₹{item.totalSales.toFixed(0)}</Text>
                    <Text style={styles.kpiLabel}>Total Sales</Text>
                </View>
            </View>
        </View>
    );

    if (loading) {
        return <ActivityIndicator size="large" style={{ flex: 1, justifyContent: 'center' }} />;
    }

    return (
        <View style={styles.container}>
            <FlatList
                data={medicalStores}
                renderItem={renderItem}
                keyExtractor={(item) => item.id}
                ListHeaderComponent={<Text style={styles.header}>My Medical Stores</Text>}
                ListEmptyComponent={<Text style={styles.emptyText}>You have not added any medical stores yet.</Text>}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f8f9fa' },
    header: { fontSize: 22, fontWeight: 'bold', color: '#333', paddingHorizontal: 16, paddingTop: 20, paddingBottom: 10 },
    card: { backgroundColor: 'white', borderRadius: 8, padding: 20, marginVertical: 8, marginHorizontal: 16, elevation: 3 },
    storeName: { fontSize: 18, fontWeight: 'bold' },
    storeContact: { fontSize: 14, color: '#666', marginTop: 4 },
    kpiContainer: { flexDirection: 'row', borderTopWidth: 1, borderTopColor: '#eee', paddingTop: 15, marginTop: 15 },
    kpiBox: { flex: 1, alignItems: 'center' },
    kpiValue: { fontSize: 22, fontWeight: 'bold', color: '#40916c' },
    kpiLabel: { fontSize: 14, color: '#666', marginTop: 4 },
    emptyText: { textAlign: 'center', marginTop: 50, fontSize: 16 }
});

export default DistributorStoreListScreen;