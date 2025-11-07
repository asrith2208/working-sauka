import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { doc, updateDoc } from 'firebase/firestore';
import { db, auth } from '../firebase';

const EditProfileScreen = ({ route, navigation }) => {
    // Get the user data passed from the profile screen
    const { userData } = route.params;
    
    // Set up state for the form fields, pre-populated with existing data
    const [name, setName] = useState(userData.name || '');
    const [phone, setPhone] = useState(userData.phone || '');
    const [address, setAddress] = useState(userData.address || '');
    const [loading, setLoading] = useState(false);

    const handleSaveChanges = async () => {
        if (!name || !phone || !address) {
            Alert.alert("Validation Error", "Please fill in all fields.");
            return;
        }

        setLoading(true);
        const currentUser = auth.currentUser;
        if (!currentUser) {
            Alert.alert("Error", "No authenticated user found.");
            setLoading(false);
            return;
        }

        const userDocRef = doc(db, 'users', currentUser.uid);

        try {
            await updateDoc(userDocRef, {
                name: name,
                phone: phone,
                address: address,
            });

            Alert.alert("Success", "Your profile has been updated.");
            navigation.goBack(); // Go back to the profile screen

        } catch (error) {
            console.error("Error updating profile: ", error);
            Alert.alert("Error", "There was an issue updating your profile.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <ScrollView style={styles.container}>
            <View style={styles.card}>
                <Text style={styles.label}>Full Name</Text>
                <TextInput
                    style={styles.input}
                    value={name}
                    onChangeText={setName}
                    placeholder="Enter your full name"
                />
                
                <Text style={styles.label}>Phone Number</Text>
                <TextInput
                    style={styles.input}
                    value={phone}
                    onChangeText={setPhone}
                    placeholder="Enter your phone number"
                    keyboardType="phone-pad"
                />
                
                <Text style={styles.label}>Full Address</Text>
                <TextInput
                    style={[styles.input, styles.textArea]}
                    value={address}
                    onChangeText={setAddress}
                    placeholder="Enter your full address"
                    multiline
                />

                {/* Email is not editable for security reasons */}
                <Text style={styles.label}>Email (Read-only)</Text>
                <TextInput
                    style={[styles.input, styles.readOnlyInput]}
                    value={userData.email}
                    editable={false}
                />
            </View>

            <TouchableOpacity style={styles.button} onPress={handleSaveChanges} disabled={loading}>
                {loading ? (
                    <ActivityIndicator color="#fff" />
                ) : (
                    <Text style={styles.buttonText}>Save Changes</Text>
                )}
            </TouchableOpacity>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f8f9fa', padding: 10 },
    card: { backgroundColor: 'white', borderRadius: 8, padding: 20, marginBottom: 15, elevation: 2 },
    label: { fontSize: 16, color: '#333', marginBottom: 5, marginTop: 10 },
    input: { backgroundColor: '#f0f4f7', padding: 12, borderRadius: 8, marginBottom: 15, fontSize: 16, borderWidth: 1, borderColor: '#ddd' },
    textArea: { height: 100, textAlignVertical: 'top' },
    readOnlyInput: { backgroundColor: '#e9ecef', color: '#6c757d' },
    button: { height: 50, backgroundColor: '#40916c', justifyContent: 'center', alignItems: 'center', borderRadius: 8, marginHorizontal: 10 },
    buttonText: { color: '#ffffff', fontSize: 18, fontWeight: 'bold' }
});

export default EditProfileScreen;