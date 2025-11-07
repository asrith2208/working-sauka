import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity } from 'react-native';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import { useFocusEffect } from '@react-navigation/native';

const DistributorDetailScreen = ({ route, navigation }) => {
    const { distributor } = route.params;
    const [medicalStores, setMedicalStores] = useState([]);
    const [loading, setLoading] = useState(true);

    useFocusEffect(
        React.useCallback(() => {
            const fetchMedicalStores = async () => {
                if (!distributor.id) return;
                setLoading(true);
                try {
                    const storesQuery = query(
                        collection(db, 'users'),
                        where('role', '==', 'medical_store'),
                        where('mapped_to_distributor', '==', distributor.id),
                        orderBy('name')
                    );
                    const querySnapshot = await getDocs(storesQuery);
                    const stores = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                    setMedicalStores(stores);
                } catch (error) {
                    console.error("Error fetching medical stores:", error);
                } finally {
                    setLoading(false);
                }
            };
            fetchMedicalStores();
        }, [distributor.id])
    );
    
    // --- THIS IS THE UPDATED PART ---
    // The View is now a TouchableOpacity with an onPress handler
    const renderStoreItem = ({ item }) => (
        <TouchableOpacity 
            style={styles.storeItem}
            onPress={() => navigation.navigate('MedicalStoreDetail', { medicalStore: item })}
        >
            <Text style={styles.storeName}>{item.name}</Text>
            <Text style={styles.storeDetail}>{item.address}</Text>
            <Text style={styles.storeDetail}>{item.phone}</Text>
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            <View style={styles.headerCard}>
                <Text style={styles.distributorName}>{distributor.name}</Text>
                <Text style={styles.distributorContact}>{distributor.email}</Text>
                <Text style={styles.distributorContact}>{distributor.phone}</Text>
                
                <View style={styles.kpiContainer}>
                    <View style={styles.kpiBox}>
                        <Text style={styles.kpiValue}>₹{distributor.totalSales.toFixed(0)}</Text>
                        <Text style={styles.kpiLabel}>Sales to Admin</Text>
                    </View>
                    <View style={styles.kpiBox}>
                        <Text style={styles.kpiValue}>{distributor.storeCount}</Text>
                        <Text style={styles.kpiLabel}>Stores Managed</Text>
                    </View>
                </View>
            </View>

            <Text style={styles.listHeader}>Mapped Medical Stores</Text>
            
            {loading ? <ActivityIndicator size="large" /> : (
                <FlatList
                    data={medicalStores}
                    renderItem={renderStoreItem}
                    keyExtractor={item => item.id}
                    ListEmptyComponent={<Text style={styles.emptyText}>No medical stores mapped to this distributor.</Text>}
                />
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f8f9fa' },
    headerCard: { backgroundColor: 'white', padding: 20, borderBottomWidth: 1, borderBottomColor: '#eee' },
    distributorName: { fontSize: 24, fontWeight: 'bold', color: '#333', marginBottom: 5 },
    distributorContact: { fontSize: 16, color: '#666' },
    kpiContainer: { flexDirection: 'row', justifyContent: 'space-around', marginTop: 20 },
    kpiBox: { alignItems: 'center', flex: 1 },
    kpiValue: { fontSize: 22, fontWeight: 'bold', color: '#40916c' },
    kpiLabel: { fontSize: 14, color: '#666', marginTop: 4 },
    listHeader: { fontSize: 20, fontWeight: 'bold', padding: 20, paddingBottom: 10, color: '#333' },
    storeItem: { backgroundColor: 'white', padding: 15, marginHorizontal: 16, marginVertical: 6, borderRadius: 8, elevation: 2 },
    storeName: { fontSize: 18, fontWeight: '600' },
    storeDetail: { fontSize: 14, color: '#555', marginTop: 4 },
    emptyText: { textAlign: 'center', marginTop: 20, fontSize: 16 }
});

export default DistributorDetailScreen;