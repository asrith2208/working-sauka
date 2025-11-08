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
        <SafeAreaView style={globalStyles.safeArea}>
            <StatusBar barStyle="dark-content" backgroundColor={COLORS.neutralGray} />
            <View style={styles.container}>
                <Text style={globalStyles.h1}>My Dashboard</Text>
                
                <View style={styles.statsContainer}>
                    <StatCard 
                        title="Active Orders" 
                        value={stats.pending}
                        loading={loading} 
                        onPress={() => navigation.navigate('My Orders')}
                    />
                    <StatCard 
                        title="Completed Orders"
                        value={stats.completed}
                        loading={loading} 
                        onPress={() => navigation.navigate('My Orders')}
                    />
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
});

export default MedicalStoreDashboard;
