import React, { useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { useFocusEffect } from '@react-navigation/native';

const MedicalStoreDetailScreen = ({ route }) => {
    const { medicalStore } = route.params;
    const [stats, setStats] = useState({ totalOrders: 0, totalSales: 0 });
    const [loading, setLoading] = useState(true);

    useFocusEffect(
        React.useCallback(() => {
            const fetchStoreStats = async () => {
                if (!medicalStore.id) return;
                setLoading(true);
                try {
                    const ordersQuery = query(
                        collection(db, 'orders'),
                        where('placedBy.uid', '==', medicalStore.id)
                    );
                    const querySnapshot = await getDocs(ordersQuery);
                    
                    let totalSales = 0;
                    querySnapshot.forEach(doc => {
                        const order = doc.data();
                        if (order.status.toLowerCase() === 'completed') {
                            totalSales += order.totalAmount;
                        }
                    });

                    setStats({
                        totalOrders: querySnapshot.size,
                        totalSales: totalSales,
                    });

                } catch (error) {
                    console.error("Error fetching medical store stats:", error);
                } finally {
                    setLoading(false);
                }
            };
            fetchStoreStats();
        }, [medicalStore.id])
    );

    return (
        <View style={styles.container}>
            <View style={styles.headerCard}>
                <Text style={styles.storeName}>{medicalStore.name}</Text>
                <Text style={styles.storeContact}>{medicalStore.email}</Text>
                <Text style={styles.storeContact}>{medicalStore.phone}</Text>
                <Text style={styles.storeContact}>{medicalStore.address}</Text>
            </View>

            <Text style={styles.kpiHeader}>Performance Metrics</Text>
            
            {loading ? <ActivityIndicator size="large" /> : (
                <View style={styles.kpiContainer}>
                    <View style={styles.kpiBox}>
                        <Text style={styles.kpiValue}>₹{stats.totalSales.toFixed(0)}</Text>
                        <Text style={styles.kpiLabel}>Total Sales</Text>
                    </View>
                    <View style={styles.kpiBox}>
                        <Text style={styles.kpiValue}>{stats.totalOrders}</Text>
                        <Text style={styles.kpiLabel}>Total Orders</Text>
                    </View>
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f8f9fa' },
    headerCard: { backgroundColor: 'white', padding: 20, borderBottomWidth: 1, borderBottomColor: '#eee' },
    storeName: { fontSize: 24, fontWeight: 'bold', color: '#333', marginBottom: 5 },
    storeContact: { fontSize: 16, color: '#666', lineHeight: 22 },
    kpiHeader: { fontSize: 20, fontWeight: 'bold', padding: 20, paddingBottom: 10, color: '#333' },
    kpiContainer: { flexDirection: 'row', justifyContent: 'space-around', backgroundColor: 'white', paddingVertical: 20, marginHorizontal: 16, borderRadius: 8, elevation: 2 },
    kpiBox: { alignItems: 'center', flex: 1 },
    kpiValue: { fontSize: 22, fontWeight: 'bold', color: '#40916c' },
    kpiLabel: { fontSize: 14, color: '#666', marginTop: 4 },
});

export default MedicalStoreDetailScreen;