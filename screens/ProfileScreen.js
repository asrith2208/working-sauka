import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity } from 'react-native';
import { doc, onSnapshot } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { useFocusEffect } from '@react-navigation/native';

// Simple component for displaying a row of information
const InfoRow = ({ label, value }) => (
    <View style={styles.infoRow}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue}>{value || 'Not set'}</Text>
    </View>
);

const ProfileScreen = ({ navigation }) => {
    const [userData, setUserData] = useState(null);
    const [loading, setLoading] = useState(true);
    const currentUser = auth.currentUser;

    useFocusEffect(
        React.useCallback(() => {
            if (!currentUser) return;
            setLoading(true);
            
            const docRef = doc(db, 'users', currentUser.uid);
            
            const unsubscribe = onSnapshot(docRef, (docSnap) => {
                if (docSnap.exists()) {
                    setUserData(docSnap.data());
                } else {
                    console.log("No such user document!");
                }
                setLoading(false);
            });

            return () => unsubscribe(); // Cleanup listener on screen blur
        }, [currentUser])
    );

    if (loading) {
        return <ActivityIndicator size="large" style={styles.loader} />;
    }

    if (!userData) {
        return <View style={styles.container}><Text>User data not found.</Text></View>;
    }

    return (
        <ScrollView style={styles.container}>
            <View style={styles.card}>
                <Text style={styles.header}>Personal Information</Text>
                <InfoRow label="Name" value={userData.name} />
                <InfoRow label="Email" value={userData.email} />
                <InfoRow label="Phone" value={userData.phone} />
                <InfoRow label="Role" value={userData.role.charAt(0).toUpperCase() + userData.role.slice(1).replace('_', ' ')} />
            </View>

            <View style={styles.card}>
                <Text style={styles.header}>Address</Text>
                <InfoRow label="Full Address" value={userData.address} />
                {userData.pincode && <InfoRow label="Pincode" value={userData.pincode} />}
                {/* For distributors, pincodes is an array */}
                {Array.isArray(userData.pincodes) && <InfoRow label="Serviceable Pincodes" value={userData.pincodes.join(', ')} />}
            </View>

            {/* --- Edit Profile Button --- */}
            <TouchableOpacity 
                style={styles.editButton} 
                onPress={() => navigation.navigate('EditProfile', { userData: userData })}
            >
                <Text style={styles.editButtonText}>Edit Profile</Text>
            </TouchableOpacity>
            
            {/* --- Change Password Button (Added from Step 22) --- */}
            <TouchableOpacity 
                style={styles.passwordButton} 
                onPress={() => navigation.navigate('ChangePassword')}
            >
                <Text style={styles.passwordButtonText}>Change Password</Text>
            </TouchableOpacity>
            
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f8f9fa', padding: 10 },
    loader: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    card: { backgroundColor: 'white', borderRadius: 8, padding: 20, marginBottom: 15, elevation: 2 },
    header: { fontSize: 20, fontWeight: 'bold', color: '#333', marginBottom: 15, borderBottomWidth: 1, borderBottomColor: '#eee', paddingBottom: 10 },
    infoRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10 },
    infoLabel: { fontSize: 16, color: '#666', flex: 1 },
    infoValue: { fontSize: 16, color: '#000', fontWeight: '500', flex: 2, textAlign: 'right' },
    
    editButton: {
        backgroundColor: '#007AFF', // Blue for primary action
        padding: 15,
        borderRadius: 8,
        alignItems: 'center',
        marginHorizontal: 10,
        marginTop: 10,
        elevation: 2
    },
    editButtonText: {
        color: 'white',
        fontSize: 18,
        fontWeight: 'bold',
    },
    
    // --- STYLES FOR THE NEW BUTTON ---
    passwordButton: {
        backgroundColor: '#f0ad4e', // Amber/warning color for a sensitive action
        padding: 15,
        borderRadius: 8,
        alignItems: 'center',
        marginHorizontal: 10,
        marginTop: 15,
        marginBottom: 30, // Add some bottom margin
        elevation: 2
    },
    passwordButtonText: {
        color: 'white',
        fontSize: 18,
        fontWeight: 'bold',
    },
});

export default ProfileScreen;