import React, { useState, useEffect } from 'react';
import { TouchableOpacity, Text, StyleSheet, View, Platform } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, updateDoc } from 'firebase/firestore'; // Import updateDoc
import { auth, db } from './firebase';
import { Ionicons } from '@expo/vector-icons';

// --- NEW IMPORTS FOR PUSH NOTIFICATIONS ---
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';


// --- Import All Screens ---
// ... (all your existing screen imports remain the same)
import LoginScreen from './screens/LoginScreen';
// ... etc.

const Stack = createNativeStackNavigator();

// --- NEW PUSH NOTIFICATION SETUP (outside the main component) ---

// This tells the app what to do with a notification when it arrives while the app is FORGROUND (open)
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true, // You can set this to true if you want sound
    shouldSetBadge: false,
  }),
});

async function registerForPushNotificationsAsync(userId) {
  let token;
  if (!Device.isDevice) {
    console.log('Push Notifications require a physical device.');
    return;
  }
  
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  
  if (finalStatus !== 'granted') {
    console.log('User did not grant permission for push notifications.');
    return;
  }

  // Get the Expo Push Token
  token = (await Notifications.getExpoPushTokenAsync()).data;
  console.log("User's Expo Push Token:", token);

  // Set up Android notification channel (does nothing on iOS)
  if (Platform.OS === 'android') {
    Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }
  
  // Save the token to the user's document in Firestore
  if (token && userId) {
    try {
      const userDocRef = doc(db, 'users', userId);
      await updateDoc(userDocRef, {
        expoPushToken: token,
      });
      console.log('Push token saved to Firestore.');
    } catch (error) {
      console.error("Error saving push token to Firestore: ", error);
    }
  }

  return token;
}


// --- Navigators (AuthStack and AppStack) ---
// These remain the same. No changes needed here.
function AuthStack() { /* ... */ }
function AppStack({ userRole }) { /* ... */ }


// --- Main App Component ---

export default function App() {
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (authenticatedUser) => {
      if (authenticatedUser) {
        const userDocRef = doc(db, 'users', authenticatedUser.uid);
        const userDoc = await getDoc(userDocRef);
        
        if (userDoc.exists()) {
          setUserRole(userDoc.data().role);
          setUser(authenticatedUser);

          // --- CALL THE PUSH NOTIFICATION REGISTRATION FUNCTION ---
          // After a user is successfully identified, we get their permission and token
          await registerForPushNotificationsAsync(authenticatedUser.uid);

        } else {
          console.error("No user document found in Firestore for this user! Logging out.");
          auth.signOut();
        }
      } else {
        setUser(null);
        setUserRole(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        {/* You can add your app's logo or a spinner here */}
      </View>
    );
  }

  return (
    <NavigationContainer>
      {user ? <AppStack userRole={userRole} /> : <AuthStack />}
    </NavigationContainer>
  );
}

// Styles remain the same
const styles = StyleSheet.create({
    headerButton: {
        color: '#007AFF',
        fontSize: 18,
    }
});