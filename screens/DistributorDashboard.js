import React, { useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, SafeAreaView, StatusBar, TouchableOpacity } from 'react-native';
import { auth, db } from '../firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { useFocusEffect } from '@react-navigation/native';
import { globalStyles, COLORS, SPACING, FONTS } from '../styles/globalStyles';

const StatCard = ({ title, value, loading, onPress }) => (
    <TouchableOpacity style={styles.statCard} onPress={onPress} disabled={!onPress}>
        {loading ? (
            <ActivityIndicator size="small" color={COLORS.primary} />
        ) : (
            <>
                <Text style={styles.statValue}>{value}</Text>
                <Text style={styles.statLabel}>{title}</Text>
            </>
        )}
    </TouchableOpacity>
);

const DistributorDashboard = ({ navigation }) => {
    const [stats, setStats] = useState({ incoming: 0, myOrders: 0 });
    const [loading, setLoading] = useState(true);

    useFocusEffect(
        React.useCallback(() => {
            const currentUser = auth.currentUser;
            if (!currentUser) return;

            const incomingQuery = query(collection(db, 'orders'), where("fulfilledBy", "==", currentUser.uid), where("status", "in", ["Pending", "Shipped"]));
            const myOrdersQuery = query(collection(db, 'orders'), where("placedBy.uid", "==", currentUser.uid));
            
            const unsubIncoming = onSnapshot(incomingQuery, (snapshot) => {
                setStats(prevStats => ({ ...prevStats, incoming: snapshot.size }));
            });

            const unsubMyOrders = onSnapshot(myOrdersQuery, (snapshot) => {
                setStats(prevStats => ({ ...prevStats, myOrders: snapshot.size }));
                setLoading(false);
            });

            return () => {
                unsubIncoming();
                unsubMyOrders();
            };
        }, [])
    );

    return (
        <SafeAreaView style={globalStyles.safeArea}>
            <StatusBar barStyle="dark-content" backgroundColor={COLORS.neutralGray} />
            <View style={styles.container}>
                <Text style={globalStyles.h1}>Distributor Dashboard</Text>
                
                <View style={styles.statsContainer}>
                    <StatCard 
                        title="Incoming Orders" 
                        value={stats.incoming}
                        loading={loading} 
                        onPress={() => navigation.navigate('Orders', { screen: 'Orders', params: { role: 'distributor' }})}
                    />
                    <StatCard 
                        title="My Orders Placed"
                        value={stats.myOrders}
                        loading={loading} 
                        onPress={() => navigation.navigate('Orders', { screen: 'Orders', params: { role: 'distributor' }})}
                    />
                </View>

                 <View style={styles.quickActionsContainer}>
                    <TouchableOpacity style={styles.quickActionButton} onPress={() => navigation.navigate('DistributorStoreList')}>
                        <Text style={styles.quickActionButtonText}>My Medical Stores</Text>
                    </TouchableOpacity>
                     <TouchableOpacity style={styles.quickActionButton} onPress={() => navigation.navigate('AddMedicalStore')}>
                        <Text style={styles.quickActionButtonText}>Add New Medical Store</Text>
                    </TouchableOpacity>
                </View>

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
    },
    quickActionsContainer: {
        marginTop: SPACING.lg,
    },
    quickActionButton: {
        ...globalStyles.buttonSecondary,
        marginBottom: SPACING.md,
    },
    quickActionButtonText: {
        ...globalStyles.buttonSecondaryText,
    }
});

export default DistributorDashboard;
