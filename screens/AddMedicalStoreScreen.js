import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView } from 'react-native';
import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { db, auth } from '../firebase'; // Import main auth as well

const firebaseConfig = {
  apiKey: "AIzaSyBsA-Cx67ASCsH8GNlwkWYf2gi5w2taqKk",
  authDomain: "saflo-6e13a.firebaseapp.com",
  projectId: "saflo-6e13a",
  storageBucket: "saflo-6e13a.firebasestorage.app",
  messagingSenderId: "1093559246055",
  appId: "1:1093559246055:web:d59da92e4cb23f11705642",
  measurementId: "G-S4VTJZQ5V1"
};

const medicalStoreApp = initializeApp(firebaseConfig, 'medical-store-creation-enhanced'); // Renamed
const medicalStoreAuth = getAuth(medicalStoreApp);

const AddMedicalStoreScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [pincode, setPincode] = useState(''); // A single pincode for the store
  const [distributorPincodes, setDistributorPincodes] = useState([]); // To store the distributor's allowed pincodes

  const distributorId = auth.currentUser.uid;

  // Fetch the distributor's allowed pincodes when the screen loads
  useEffect(() => {
    const fetchDistributorData = async () => {
      const docRef = doc(db, 'users', distributorId);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists() && docSnap.data().pincodes) {
        setDistributorPincodes(docSnap.data().pincodes);
      }
    };
    fetchDistributorData();
  }, [distributorId]);

  const handleAddMedicalStore = async () => {
    if (!name || !email || !password || !phone || !address || !pincode) {
      Alert.alert('Error', 'Please fill in all fields.');
      return;
    }

    // --- Business Logic Validation ---
    if (!distributorPincodes.includes(pincode.trim())) {
      Alert.alert(
        'Invalid Pincode',
        `This medical store's pincode (${pincode}) is not in your serviceable area. Your serviceable pincodes are: ${distributorPincodes.join(', ')}`
      );
      return;
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(medicalStoreAuth, email, password);
      const newUser = userCredential.user;
      
      await setDoc(doc(db, "users", newUser.uid), {
        uid: newUser.uid,
        email: email.toLowerCase(),
        name: name,
        phone: phone,
        address: address,
        pincode: pincode.trim(), // Storing the single pincode
        role: 'medical_store',
        mapped_to_distributor: distributorId
      });
      
      Alert.alert('Success', `Medical Store "${name}" has been created.`);
      navigation.goBack();

    } catch (error) {
      Alert.alert('Creation Failed', error.message);
      console.error(error);
    }
  };

  return (
    <ScrollView style={styles.scrollView}>
        <View style={styles.container}>
            <Text style={styles.title}>Add New Medical Store</Text>
            
            <TextInput style={styles.input} placeholder="Medical Store Name" value={name} onChangeText={setName} />
            <TextInput style={styles.input} placeholder="Store's Email" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
            <TextInput style={styles.input} placeholder="Temporary Password" value={password} onChangeText={setPassword} secureTextEntry />
            <TextInput style={styles.input} placeholder="Phone Number" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
            <TextInput style={styles.input} placeholder="Full Address" value={address} onChangeText={setAddress} />
            <TextInput style={styles.input} placeholder="Pincode" value={pincode} onChangeText={setPincode} keyboardType="number-pad" />
            
            <TouchableOpacity style={styles.button} onPress={handleAddMedicalStore}>
                <Text style={styles.buttonText}>Create Medical Store</Text>
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

export default AddMedicalStoreScreen;