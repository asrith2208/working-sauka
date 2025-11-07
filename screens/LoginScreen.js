import React, { useState, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, Platform } from 'react-native';
import { signInWithEmailAndPassword, PhoneAuthProvider, signInWithCredential } from 'firebase/auth';
import { auth } from '../firebase';
import { FirebaseRecaptchaVerifierModal } from 'expo-firebase-recaptcha';

const LoginScreen = () => {
  const [loginMethod, setLoginMethod] = useState('email'); // 'email' or 'phone'
  
  // State for Email Login
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // State for Phone Login
  const [phoneNumber, setPhoneNumber] = useState('');
  const [verificationId, setVerificationId] = useState(null);
  const [otpCode, setOtpCode] = useState('');
  
  const recaptchaVerifier = useRef(null);

  const handleLogin = () => {
    if (loginMethod === 'email') {
      signInWithEmailAndPassword(auth, email, password)
        .then((userCredential) => {
          console.log('Logged in with email:', userCredential.user.email);
        })
        .catch((error) => {
          Alert.alert('Login Error', error.message);
        });
    }
  };

  const handleSendOtp = async () => {
    try {
      const phoneProvider = new PhoneAuthProvider(auth);
      const verId = await phoneProvider.verifyPhoneNumber(
        phoneNumber,
        recaptchaVerifier.current
      );
      setVerificationId(verId);
      Alert.alert('OTP Sent', `An OTP has been sent to ${phoneNumber}.`);
    } catch (error) {
      Alert.alert('OTP Error', error.message);
      console.error(error);
    }
  };

  const handleConfirmOtp = async () => {
    try {
      const credential = PhoneAuthProvider.credential(verificationId, otpCode);
      await signInWithCredential(auth, credential);
      console.log('Logged in with phone number!');
    } catch (error) {
      Alert.alert('OTP Confirmation Error', error.message);
    }
  };

  return (
    <View style={styles.container}>
      <FirebaseRecaptchaVerifierModal
        ref={recaptchaVerifier}
        firebaseConfig={auth.config}
        // Use this for invisible reCAPTCHA on web. For mobile, it's always invisible.
        // On Expo Go, you'll see a web view to solve the challenge.
        attemptInvisibleVerification={Platform.OS !== 'web'}
      />

      <Text style={styles.title}>Saukyam Pads</Text>

      {/* --- TABS TO SWITCH LOGIN METHOD --- */}
      <View style={styles.tabContainer}>
        <TouchableOpacity 
          style={[styles.tab, loginMethod === 'email' && styles.activeTab]}
          onPress={() => setLoginMethod('email')}
        >
          <Text style={[styles.tabText, loginMethod === 'email' && styles.activeTabText]}>Email</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, loginMethod === 'phone' && styles.activeTab]}
          onPress={() => setLoginMethod('phone')}
        >
          <Text style={[styles.tabText, loginMethod === 'phone' && styles.activeTabText]}>Phone</Text>
        </TouchableOpacity>
      </View>

      {/* --- EMAIL LOGIN FORM --- */}
      {loginMethod === 'email' && (
        <>
          <TextInput style={styles.input} placeholder="Email" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
          <TextInput style={styles.input} placeholder="Password" value={password} onChangeText={setPassword} secureTextEntry />
          <TouchableOpacity style={styles.button} onPress={handleLogin}>
            <Text style={styles.buttonText}>Login</Text>
          </TouchableOpacity>
        </>
      )}

      {/* --- PHONE LOGIN FORM --- */}
      {loginMethod === 'phone' && !verificationId && (
        <>
          <TextInput style={styles.input} placeholder="Phone Number (with country code, e.g., +91...)" value={phoneNumber} onChangeText={setPhoneNumber} keyboardType="phone-pad" />
          <TouchableOpacity style={styles.button} onPress={handleSendOtp}>
            <Text style={styles.buttonText}>Send OTP</Text>
          </TouchableOpacity>
        </>
      )}

      {/* --- OTP CONFIRMATION FORM --- */}
      {loginMethod === 'phone' && verificationId && (
        <>
          <TextInput style={styles.input} placeholder="Enter 6-Digit OTP" value={otpCode} onChangeText={setOtpCode} keyboardType="number-pad" maxLength={6} />
          <TouchableOpacity style={styles.button} onPress={handleConfirmOtp}>
            <Text style={styles.buttonText}>Confirm OTP and Login</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setVerificationId(null)}>
            <Text style={styles.linkText}>Use a different phone number?</Text>
          </TouchableOpacity>
        </>
      )}
    </View>
  );
};

// Add new styles for the tabs and link
const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20, backgroundColor: '#f0f4f7' },
  title: { fontSize: 32, fontWeight: 'bold', color: '#2d6a4f', marginBottom: 30 },
  tabContainer: { flexDirection: 'row', marginBottom: 20, borderWidth: 1, borderColor: '#40916c', borderRadius: 8, overflow: 'hidden' },
  tab: { paddingVertical: 10, paddingHorizontal: 40 },
  activeTab: { backgroundColor: '#40916c' },
  tabText: { color: '#40916c', fontSize: 16, fontWeight: '600' },
  activeTabText: { color: '#ffffff' },
  input: { width: '100%', height: 50, backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#b7e4c7', borderRadius: 8, paddingHorizontal: 15, marginBottom: 15, fontSize: 16 },
  button: { width: '100%', height: 50, backgroundColor: '#40916c', justifyContent: 'center', alignItems: 'center', borderRadius: 8, marginTop: 10 },
  buttonText: { color: '#ffffff', fontSize: 18, fontWeight: 'bold' },
  linkText: { color: '#2d6a4f', marginTop: 20, fontSize: 16 }
});

export default LoginScreen;