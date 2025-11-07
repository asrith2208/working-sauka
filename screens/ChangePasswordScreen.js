import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { EmailAuthProvider, reauthenticateWithCredential, updatePassword } from 'firebase/auth';
import { auth } from '../firebase';

const ChangePasswordScreen = ({ navigation }) => {
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    
    const handleChangePassword = async () => {
        if (!currentPassword || !newPassword || !confirmPassword) {
            Alert.alert("Validation Error", "Please fill in all fields.");
            return;
        }

        if (newPassword !== confirmPassword) {
            Alert.alert("Validation Error", "New passwords do not match.");
            return;
        }
        
        if (newPassword.length < 6) {
            Alert.alert("Validation Error", "New password must be at least 6 characters long.");
            return;
        }

        setLoading(true);
        const user = auth.currentUser;

        if (user) {
            // Step 1: Create a credential with the user's email and current password
            const credential = EmailAuthProvider.credential(user.email, currentPassword);

            try {
                // Step 2: Re-authenticate the user with the credential
                await reauthenticateWithCredential(user, credential);
                
                // Step 3: If re-authentication is successful, update the password
                await updatePassword(user, newPassword);

                Alert.alert("Success", "Your password has been changed successfully.");
                navigation.goBack();

            } catch (error) {
                console.error("Error changing password:", error);
                let errorMessage = "An error occurred. Please try again.";
                if (error.code === 'auth/wrong-password') {
                    errorMessage = "The current password you entered is incorrect.";
                } else if (error.code === 'auth/too-many-requests') {
                    errorMessage = "Too many attempts. Please try again later.";
                }
                Alert.alert("Password Change Failed", errorMessage);
            } finally {
                setLoading(false);
            }
        }
    };

    return (
        <ScrollView style={styles.container}>
            <View style={styles.card}>
                <Text style={styles.label}>Current Password</Text>
                <TextInput
                    style={styles.input}
                    value={currentPassword}
                    onChangeText={setCurrentPassword}
                    placeholder="Enter your current password"
                    secureTextEntry
                />
                
                <Text style={styles.label}>New Password</Text>
                <TextInput
                    style={styles.input}
                    value={newPassword}
                    onChangeText={setNewPassword}
                    placeholder="Must be at least 6 characters"
                    secureTextEntry
                />
                
                <Text style={styles.label}>Confirm New Password</Text>
                <TextInput
                    style={styles.input}
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    placeholder="Re-enter your new password"
                    secureTextEntry
                />
            </View>

            <TouchableOpacity style={styles.button} onPress={handleChangePassword} disabled={loading}>
                {loading ? (
                    <ActivityIndicator color="#fff" />
                ) : (
                    <Text style={styles.buttonText}>Change Password</Text>
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
    button: { height: 50, backgroundColor: '#d9534f', justifyContent: 'center', alignItems: 'center', borderRadius: 8, marginHorizontal: 10 }, // Red button for security action
    buttonText: { color: '#ffffff', fontSize: 18, fontWeight: 'bold' }
});

export default ChangePasswordScreen;