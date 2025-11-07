import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView } from 'react-native';
import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';

const firebaseConfig = {
  apiKey: "AIzaSyBsA-Cx67ASCsH8GNlwkWYf2gi5w2taqKk",
  authDomain: "saflo-6e13a.firebaseapp.com",
  projectId: "saflo-6e13a",
  storageBucket: "saflo-6e13a.firebasestorage.app",
  messagingSenderId: "1093559246055",
  appId: "1:1093559246055:web:d59da92e4cb23f11705642",
  measurementId: "G-S4VTJZQ5V1"
};

const tempApp = initializeApp(firebaseConfig, 'temp-user-creation-distributor'); // Renamed for clarity
const tempAuth = getAuth(tempApp);

const AddDistributorScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [pincodes, setPincodes] = useState(''); // Storing pincodes as a comma-separated string for input

  const handleAddDistributor = async () => {
    if (!name || !email || !password || !phone || !address || !pincodes) {
      Alert.alert('Error', 'Please fill in all fields.');
      return;
    }

    // Convert comma-separated string of pincodes into an array of strings
    const pincodesArray = pincodes.split(',').map(pincode => pincode.trim()).filter(p => p);

    if (pincodesArray.length === 0) {
        Alert.alert('Error', 'Please enter at least one valid pincode.');
        return;
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(tempAuth, email, password);
      const newUser = userCredential.user;
      
      await setDoc(doc(db, "users", newUser.uid), {
        uid: newUser.uid,
        email: email.toLowerCase(),
        name: name,
        phone: phone,
        address: address,
        // Storing pincodes as an array in Firestore is powerful for queries later
        pincodes: pincodesArray, 
        role: 'distributor'
      });
      
      Alert.alert('Success', `Distributor "${name}" has been created.`);
      navigation.goBack();

    } catch (error) {
      Alert.alert('Creation Failed', error.message);
      console.error(error);
    }
  };

  return (
    <ScrollView style={styles.scrollView}>
        <View style={styles.container}>
            <Text style={styles.title}>Add New Distributor</Text>
            
            <TextInput style={styles.input} placeholder="Distributor's Full Name" value={name} onChangeText={setName} />
            <TextInput style={styles.input} placeholder="Distributor's Email" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
            <TextInput style={styles.input} placeholder="Temporary Password" value={password} onChangeText={setPassword} secureTextEntry />
            <TextInput style={styles.input} placeholder="Phone Number (e.g., +91...)" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
            <TextInput style={styles.input} placeholder="Full Address" value={address} onChangeText={setAddress} />
            <TextInput style={styles.input} placeholder="Pincodes (comma-separated, e.g., 500001, 500002)" value={pincodes} onChangeText={setPincodes} />

            <TouchableOpacity style={styles.button} onPress={handleAddDistributor}>
                <Text style={styles.buttonText}>Create Distributor</Text>
            </TouchableOpacity>
        </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scrollView: { flex: 1, backgroundColor: '#f0f4f7' },
  container: { flex: 1, alignItems: 'center', padding: 20 },
  title: { fontSize: 22, fontWeight: 'bold', color: '#2d6a4f', marginBottom: 30, marginTop: 20 },
  input: { width: '100%', height: 50, backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#b7e4c7', borderRadius: 8, paddingHorizontal: 15, marginBottom: 15, fontSize: 16 },
  button: { width: '100%', height: 50, backgroundColor: '#40916c', justifyContent: 'center', alignItems: 'center', borderRadius: 8, marginTop: 10, marginBottom: 50 },
  buttonText: { color: '#ffffff', fontSize: 18, fontWeight: 'bold' }
});

export default AddDistributorScreen;