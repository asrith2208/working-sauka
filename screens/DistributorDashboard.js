import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { auth, db } from '../firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { useFocusEffect } from '@react-navigation/native';

const DistributorDashboard = ({ navigation }) => {
    const [stats, setStats] = useState({ incoming: 0, myOrders: 0 });
    const [loading, setLoading] = useState(true);

    useFocusEffect(
        React.useCallback(() => {
            const currentUser = auth.currentUser;
            if (!currentUser) return;

            // Query 1: Incoming orders from medical stores to be fulfilled
            const incomingQuery = query(collection(db, 'orders'), where("fulfilledBy", "==", currentUser.uid), where("status", "in", ["Pending", "Shipped"]));
            
            // Query 2: Orders placed by this distributor to the admin
            const myOrdersQuery = query(collection(db, 'orders'), where("placedBy.uid", "==", currentUser.uid));
            
            const unsubIncoming = onSnapshot(incomingQuery, (snapshot) => {
                setStats(prevStats => ({ ...prevStats, incoming: snapshot.size }));
            });

            const unsubMyOrders = onSnapshot(myOrdersQuery, (snapshot) => {
                setStats(prevStats => ({ ...prevStats, myOrders: snapshot.size }));
                setLoading(false); // Stop loading after the second query
            });

            return () => {
                unsubIncoming();
                unsubMyOrders();
            };
        }, [])
    );

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Distributor Dashboard</Text>

            <View style={styles.statsContainer}>
                {loading ? <ActivityIndicator size="large" /> : (
                    <>
                        <View style={styles.statBox}>
                            <Text style={styles.statNumber}>{stats.incoming}</Text>
                            <Text style={styles.statLabel}>Incoming Orders</Text>
                        </View>
                        <View style={styles.statBox}>
                            <Text style={styles.statNumber}>{stats.myOrders}</Text>
                            <Text style={styles.statLabel}>My Orders Placed</Text>
                        </View>
                    </>
                )}
            </View>

            <TouchableOpacity style={styles.menuButton} onPress={() => navigation.navigate('AddMedicalStore')}>
                <Text style={styles.menuButtonText}>Add New Medical Store</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.menuButton} onPress={() => navigation.navigate('UserProductList')}>
                <Text style={styles.menuButtonText}>Place New Order</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.menuButton} onPress={() => navigation.navigate('OrderList', { role: 'distributor' })}>
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
// Use the same styles as MedicalStoreDashboard
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


export default DistributorDashboard;