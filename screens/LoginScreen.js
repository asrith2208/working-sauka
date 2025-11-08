import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, KeyboardAvoidingView, Platform, SafeAreaView, StatusBar } from 'react-native';
import { signInWithEmailAndPassword, PhoneAuthProvider, signInWithCredential, sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../firebase';
import { globalStyles, COLORS, FONTS, SPACING } from '../styles/globalStyles';

const LoginScreen = () => {
  const [loginMethod, setLoginMethod] = useState('email');
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [phoneNumber, setPhoneNumber] = useState('');
  const [verificationId, setVerificationId] = useState(null);
  const [otpCode, setOtpCode] = useState('');

  const handleLogin = () => {
    signInWithEmailAndPassword(auth, email, password)
      .then(userCredential => console.log('Logged in with email:', userCredential.user.email))
      .catch(error => Alert.alert('Login Error', error.message));
  };

  const handleSendOtp = async () => {
    try {
      const phoneProvider = new PhoneAuthProvider(auth);
      const verId = await phoneProvider.verifyPhoneNumber(phoneNumber, null);
      setVerificationId(verId);
      Alert.alert('OTP Sent', `An OTP has been sent to ${phoneNumber}.`);
    } catch (error) {
      const errorMessage = error.code === 'auth/invalid-phone-number' 
        ? 'The phone number is not valid. Please include the country code (e.g., +91).': error.message;
      Alert.alert('OTP Error', errorMessage);
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
  
  const handleForgotPassword = () => {
    if (!email) {
      Alert.alert("Email Required", "Please enter your email address to reset your password.");
      return;
    }
    sendPasswordResetEmail(auth, email)
      .then(() => Alert.alert("Check Your Email", `A password reset link has been sent to ${email}.`))
      .catch(error => {
        const errorMessage = error.code === 'auth/user-not-found'
          ? "No user found with this email address.": "Could not send password reset email.";
        Alert.alert("Error", errorMessage);
      });
  };

  const renderEmailForm = () => (
    <View style={styles.formContainer}>
      <TextInput 
        style={globalStyles.input}
        placeholder="Email Address"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
        placeholderTextColor={COLORS.textSecondary}
      />
      <TextInput
        style={globalStyles.input}
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        placeholderTextColor={COLORS.textSecondary}
      />
      <TouchableOpacity style={globalStyles.buttonPrimary} onPress={handleLogin}>
        <Text style={globalStyles.buttonPrimaryText}>Login</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={handleForgotPassword} style={styles.linkButton}>
        <Text style={styles.linkText}>Forgot Password?</Text>
      </TouchableOpacity>
    </View>
  );

  const renderPhoneForm = () => (
    <View style={styles.formContainer}>
      {!verificationId ? (
        <>
          <TextInput
            style={globalStyles.input}
            placeholder="Phone Number (e.g., +91...)"
            value={phoneNumber}
            onChangeText={setPhoneNumber}
            keyboardType="phone-pad"
            placeholderTextColor={COLORS.textSecondary}
          />
          <TouchableOpacity style={globalStyles.buttonPrimary} onPress={handleSendOtp}>
            <Text style={globalStyles.buttonPrimaryText}>Send OTP</Text>
          </TouchableOpacity>
        </>
      ) : (
        <>
          <TextInput
            style={globalStyles.input}
            placeholder="Enter 6-Digit OTP"
            value={otpCode}
            onChangeText={setOtpCode}
            keyboardType="number-pad"
            maxLength={6}
            placeholderTextColor={COLORS.textSecondary}
          />
          <TouchableOpacity style={globalStyles.buttonPrimary} onPress={handleConfirmOtp}>
            <Text style={globalStyles.buttonPrimaryText}>Confirm & Login</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setVerificationId(null)} style={styles.linkButton}>
            <Text style={styles.linkText}>Use a different number?</Text>
          </TouchableOpacity>
        </>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.neutralGray} />
      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"} 
        style={styles.container}
      >
        <View style={styles.header}>
          <Text style={globalStyles.h1}>Welcome to</Text>
          <Text style={[globalStyles.h1, { color: COLORS.primary }]}>Saukyam</Text>
        </View>

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

        {loginMethod === 'email' ? renderEmailForm() : renderPhoneForm()}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.neutralGray },
  container: { 
    flex: 1, 
    justifyContent: 'center', 
    paddingHorizontal: SPACING.lg
  },
  header: {
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  tabContainer: {
    flexDirection: 'row',
    marginBottom: SPACING.lg,
    backgroundColor: COLORS.white,
    borderRadius: 8,
    elevation: 2, 
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  tab: { 
    flex: 1,
    paddingVertical: SPACING.md,
    alignItems: 'center',
    borderRadius: 8,
  },
  activeTab: { 
    backgroundColor: COLORS.primary,
  },
  tabText: { 
    ...FONTS.body,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  activeTabText: {
    color: COLORS.white,
  },
  formContainer: {
    width: '100%',
  },
  linkButton: {
    marginTop: SPACING.md,
    alignSelf: 'center',
  },
  linkText: {
    color: COLORS.primary,
    ...FONTS.body,
    fontWeight: '600',
    fontSize: 14
  },
});

export default LoginScreen;
