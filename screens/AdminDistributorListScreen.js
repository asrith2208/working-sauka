import React, { useState } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { useFocusEffect } from '@react-navigation/native';

const AdminDistributorListScreen = ({ navigation }) => {
    const [distributors, setDistributors] = useState([]);
    const [loading, setLoading] = useState(true);

    useFocusEffect(
        React.useCallback(() => {
            const fetchData = async () => {
                setLoading(true);
                try {
                    // Step 1: Fetch all data concurrently
                    const distributorsQuery = query(collection(db, 'users'), where('role', '==', 'distributor'));
                    const storesQuery = query(collection(db, 'users'), where('role', '==', 'medical_store'));
                    const ordersQuery = query(
                        collection(db, 'orders'),
                        where('status', 'in', ['completed', 'Completed']),
                        where('placedBy.role', '==', 'distributor')
                    );

                    const [distributorSnapshot, storeSnapshot, orderSnapshot] = await Promise.all([
                        getDocs(distributorsQuery),
                        getDocs(storesQuery),
                        getDocs(ordersQuery)
                    ]);

                    const distributorData = distributorSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                    
                    // Step 2: Map store counts to their respective distributors
                    const storeCountMap = new Map();
                    storeSnapshot.forEach(doc => {
                        const store = doc.data();
                        const distributorId = store.mapped_to_distributor;
                        storeCountMap.set(distributorId, (storeCountMap.get(distributorId) || 0) + 1);
                    });

                    const salesDataMap = new Map();
                    orderSnapshot.forEach(doc => {
                        const order = doc.data();
                        const distributorId = order.placedBy.uid; 
                        salesDataMap.set(distributorId, (salesDataMap.get(distributorId) || 0) + order.totalAmount);
                    });
                    
                    const enrichedDistributors = distributorData.map(distributor => ({
                        ...distributor,
                        storeCount: storeCountMap.get(distributor.id) || 0,
                        totalSales: salesDataMap.get(distributor.id) || 0,
                    }));

                    setDistributors(enrichedDistributors);

                } catch (error) {
                    console.error("Error fetching distributor performance data:", error);
                } finally {
                    setLoading(false);
                }
            };
            
            fetchData();
        }, [])
    );

    const renderItem = ({ item }) => (
        // --- THIS IS THE CORRECTED LINE ---
        <TouchableOpacity style={styles.card} onPress={() => navigation.navigate('DistributorDetail', { distributor: item })}>
             <Text style={styles.distributorName}>{item.name}</Text>
            <Text style={styles.distributorPincodes}>
                Pincodes: {Array.isArray(item.pincodes) ? item.pincodes.join(', ') : 'N/A'}
            </Text>
            <View style={styles.kpiContainer}>
                <View style={styles.kpiBox}>
                    <Text style={styles.kpiValue}>₹{item.totalSales.toFixed(0)}</Text>
                    <Text style={styles.kpiLabel}>Sales to Admin</Text>
                </View>
                <View style={styles.kpiBox}>
                    <Text style={styles.kpiValue}>{item.storeCount}</Text>
                    <Text style={styles.kpiLabel}>Stores Managed</Text>
                </View>
            </View>
        </TouchableOpacity>
    );

    if (loading) {
        return <ActivityIndicator size="large" style={{ flex: 1, justifyContent: 'center' }} />;
    }

    return (
        <View style={styles.container}>
            <FlatList
                data={distributors}
                renderItem={renderItem}
                keyExtractor={(item) => item.id}
                ListEmptyComponent={<Text style={styles.emptyText}>No distributors found.</Text>}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f8f9fa' },
    card: { backgroundColor: 'white', borderRadius: 8, padding: 20, marginVertical: 8, marginHorizontal: 16, elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.22, shadowRadius: 2.22 },
    distributorName: { fontSize: 20, fontWeight: 'bold', color: '#333' },
    distributorPincodes: { fontSize: 14, color: '#666', marginBottom: 15, fontStyle: 'italic' },
    kpiContainer: { flexDirection: 'row', justifyContent: 'space-around', borderTopWidth: 1, borderTopColor: '#eee', paddingTop: 15 },
    kpiBox: { alignItems: 'center', flex: 1 },
    kpiValue: { fontSize: 22, fontWeight: 'bold', color: '#40916c' },
    kpiLabel: { fontSize: 14, color: '#666', marginTop: 4 },
    emptyText: { textAlign: 'center', marginTop: 50, fontSize: 16 }
});

export default AdminDistributorListScreen;