import React, { useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, SafeAreaView, StatusBar } from 'react-native';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { useFocusEffect } from '@react-navigation/native';
import { globalStyles, COLORS, SPACING, FONTS } from '../styles/globalStyles';

const StatCard = ({ title, value, loading }) => (
    <View style={styles.statCard}>
        {loading ? (
            <ActivityIndicator size="small" color={COLORS.primary} />
        ) : (
            <>
                <Text style={styles.statValue}>{value}</Text>
                <Text style={styles.statLabel}>{title}</Text>
            </>
        )}
    </View>
);

const AdminDashboard = ({ navigation }) => {
    const [stats, setStats] = useState({ pendingOrders: 0, totalSales: 0 });
    const [loading, setLoading] = useState(true);

    useFocusEffect(
        React.useCallback(() => {
            const q = query(collection(db, 'orders'));
            const unsubscribe = onSnapshot(q, (querySnapshot) => {
                let pendingCount = 0;
                let sales = 0;
                querySnapshot.forEach((doc) => {
                    const order = doc.data();
                    if (order.status.toLowerCase() === 'pending' && order.fulfilledBy === 'admin') {
                        pendingCount++;
                    }
                    if (order.status.toLowerCase() === 'completed' && order.placedBy.role === 'distributor') {
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
        <SafeAreaView style={globalStyles.safeArea}>
            <StatusBar barStyle="dark-content" backgroundColor={COLORS.neutralGray} />
            <View style={styles.container}>
                <Text style={globalStyles.h1}>Admin Dashboard</Text>
                
                <View style={styles.statsContainer}>
                    <StatCard 
                        title="Pending Orders" 
                        value={stats.pendingOrders}
                        loading={loading} 
                    />
                    <StatCard 
                        title="Total Sales"
                        value={`₹${(stats.totalSales / 1000).toFixed(1)}k`}
                        loading={loading} 
                    />
                </View>

                {/* Add other dashboard-specific content or charts here in the future */}

            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: SPACING.md,
        backgroundColor: COLORS.neutralGray,
    },
    statsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: SPACING.lg,
    },
    statCard: {
        ...globalStyles.card,
        flex: 1,
        marginHorizontal: SPACING.xs,
        alignItems: 'center',
        justifyContent: 'center',
        padding: SPACING.md
    },
    statValue: {
        ...FONTS.h2,
        color: COLORS.primary,
    },
    statLabel: {
        ...FONTS.body,
        color: COLORS.textSecondary,
        marginTop: SPACING.xs,
    }
});

export default AdminDashboard;
