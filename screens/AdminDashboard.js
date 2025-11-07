import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { auth, db } from '../firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { useFocusEffect } from '@react-navigation/native';

const AdminDashboard = ({ navigation }) => {
    const [stats, setStats] = useState({ pendingOrders: 0, totalSales: 0 });
    const [loading, setLoading] = useState(true);

    useFocusEffect(
        React.useCallback(() => {
            // Query for all orders (to calculate sales from completed ones) and filter for pending
            const q = query(collection(db, 'orders'));

            const unsubscribe = onSnapshot(q, (querySnapshot) => {
                let pendingCount = 0;
                let sales = 0;
                querySnapshot.forEach((doc) => {
                    const order = doc.data();
                    if (order.status.toLowerCase() === 'pending' && order.fulfilledBy === 'admin') {
                        pendingCount++;
                    }
                    if (order.status.toLowerCase() === 'completed') {
                        sales += order.totalAmount;
                    }
                });
                setStats({ pendingOrders: pendingCount, totalSales: sales });
                setLoading(false);
            });

            return () => unsubscribe();
        }, [])
    );

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Admin Dashboard</Text>
            
            <View style={styles.statsContainer}>
                {loading ? <ActivityIndicator size="large" /> : (
                    <>
                        <View style={styles.statBox}>
                            <Text style={styles.statNumber}>{stats.pendingOrders}</Text>
                            <Text style={styles.statLabel}>Pending Orders</Text>
                        </View>
                        <View style={styles.statBox}>
                            <Text style={styles.statNumber}>₹{stats.totalSales.toFixed(0)}</Text>
                            <Text style={styles.statLabel}>Total Sales</Text>
                        </View>
                    </>
                )}
            </View>

            <TouchableOpacity style={styles.menuButton} onPress={() => navigation.navigate('ProductList')}>
                <Text style={styles.menuButtonText}>Manage Products</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.menuButton} onPress={() => navigation.navigate('AddDistributor')}>
                <Text style={styles.menuButtonText}>Manage Distributors</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.menuButton} onPress={() => navigation.navigate('OrderList', { role: 'admin' })}>
                <Text style={styles.menuButtonText}>View All Orders</Text>
            </TouchableOpacity>

            <View style={styles.logoutButtonContainer}>
                <TouchableOpacity style={styles.logoutButton} onPress={() => auth.signOut()}>
                    <Text style={styles.logoutButtonText}>Logout</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
};
// Use the same styles
const styles = StyleSheet.create({
    container: { flex: 1, alignItems: 'center', padding: 20, backgroundColor: '#f8f9fa' },
    title: { fontSize: 28, fontWeight: 'bold', marginBottom: 30, color: '#2d6a4f' },
    statsContainer: { flexDirection: 'row', justifyContent: 'space-around', width: '100%', marginBottom: 30 },
    statBox: { backgroundColor: '#fff', padding: 20, borderRadius: 10, alignItems: 'center', width: '45%', elevation: 3, shadowColor: '#000' },
    statNumber: { fontSize: 32, fontWeight: 'bold', color: '#40916c' },
    statLabel: { fontSize: 16, color: '#666', marginTop: 5 },
    menuButton: { width: '90%', padding: 15, backgroundColor: '#40916c', borderRadius: 10, alignItems: 'center', marginBottom: 15 },
    menuButtonText: { color: '#ffffff', fontSize: 18, fontWeight: '600' },
    logoutButtonContainer: { position: 'absolute', bottom: 40, width: '90%' },
    logoutButton: { backgroundColor: '#d9534f', padding: 15, borderRadius: 10, alignItems: 'center' },
    logoutButtonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' }
});


export default AdminDashboard;