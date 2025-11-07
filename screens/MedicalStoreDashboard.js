import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { auth, db } from '../firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { useFocusEffect } from '@react-navigation/native';

const MedicalStoreDashboard = ({ navigation }) => {
    const [stats, setStats] = useState({ pending: 0, completed: 0 });
    const [loading, setLoading] = useState(true);

    useFocusEffect(
        React.useCallback(() => {
            const currentUser = auth.currentUser;
            if (!currentUser) return;

            const q = query(collection(db, 'orders'), where("placedBy.uid", "==", currentUser.uid));
            
            const unsubscribe = onSnapshot(q, (querySnapshot) => {
                let pendingCount = 0;
                let completedCount = 0;
                querySnapshot.forEach((doc) => {
                    if (doc.data().status.toLowerCase() === 'pending' || doc.data().status.toLowerCase() === 'shipped') {
                        pendingCount++;
                    } else if (doc.data().status.toLowerCase() === 'completed') {
                        completedCount++;
                    }
                });
                setStats({ pending: pendingCount, completed: completedCount });
                setLoading(false);
            });

            return () => unsubscribe();
        }, [])
    );

    return (
        <View style={styles.container}>
            <Text style={styles.title}>My Dashboard</Text>
            
            <View style={styles.statsContainer}>
                {loading ? <ActivityIndicator size="large" /> : (
                    <>
                        <View style={styles.statBox}>
                            <Text style={styles.statNumber}>{stats.pending}</Text>
                            <Text style={styles.statLabel}>Active Orders</Text>
                        </View>
                        <View style={styles.statBox}>
                            <Text style={styles.statNumber}>{stats.completed}</Text>
                            <Text style={styles.statLabel}>Completed Orders</Text>
                        </View>
                    </>
                )}
            </View>

            <TouchableOpacity style={styles.menuButton} onPress={() => navigation.navigate('UserProductList')}>
                <Text style={styles.menuButtonText}>Place New Order</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.menuButton} onPress={() => navigation.navigate('OrderList', { role: 'medical_store' })}>
                <Text style={styles.menuButtonText}>My Orders</Text>
            </TouchableOpacity>

            <View style={styles.logoutButtonContainer}>
                <TouchableOpacity style={styles.logoutButton} onPress={() => auth.signOut()}>
                    <Text style={styles.logoutButtonText}>Logout</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
};

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

export default MedicalStoreDashboard;