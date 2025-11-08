import React, { useState, useEffect } from 'react';
import { View, Platform, ActivityIndicator, Text } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from './firebase';
import 'react-native-get-random-values';

// --- PUSH NOTIFICATION & DEVICE IMPORTS ---
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';

// --- IMPORT NAVIGATORS ---
import AdminTabNavigator from './navigation/AdminTabNavigator';
import DistributorTabNavigator from './navigation/DistributorTabNavigator';
import MedicalStoreTabNavigator from './navigation/MedicalStoreTabNavigator';

// --- IMPORT ALL SCREENS ---
import LoginScreen from './screens/LoginScreen';

const Stack = createNativeStackNavigator();

// --- PUSH NOTIFICATION SETUP ---
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

async function registerForPushNotificationsAsync(userId) {
  if (!Device.isDevice) return;

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') return;

  try {
    const token = (await Notifications.getExpoPushTokenAsync()).data;
    if (token && userId) {
      const userDocRef = doc(db, 'users', userId);
      await updateDoc(userDocRef, { expoPushToken: token });
    }
    if (Platform.OS === 'android') {
      Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
      });
    }
  } catch (e) {
    console.error("Failed to get push token", e);
  }
}

// --- NAVIGATORS ---
function AuthStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
    </Stack.Navigator>
  );
}

function AppStack({ userRole }) {
    return (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
            {userRole === 'admin' && (
                <Stack.Screen name="AdminHome" component={AdminTabNavigator} />
            )}
            {userRole === 'distributor' && (
                <Stack.Screen name="DistributorHome" component={DistributorTabNavigator} />
            )}
            {userRole === 'medical_store' && (
                <Stack.Screen name="MedicalStoreHome" component={MedicalStoreTabNavigator} />
            )}
        </Stack.Navigator>
    );
}


// --- MAIN APP COMPONENT ---
export default function App() {
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (authenticatedUser) => {
      try {
        if (authenticatedUser) {
          const userDocRef = doc(db, 'users', authenticatedUser.uid);
          const userDoc = await getDoc(userDocRef);

          if (userDoc.exists()) {
            setUserRole(userDoc.data().role);
            setUser(authenticatedUser);
            await registerForPushNotificationsAsync(authenticatedUser.uid);
          } else {
            auth.signOut();
          }
        } else {
          setUser(null);
          setUserRole(null);
        }
      } catch (error) {
        console.error("Auth error:", error);
      } finally {
        if (initializing) {
          setInitializing(false);
        }
      }
    });

    return unsubscribe;
  }, [initializing]);

  if (initializing) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
        <Text style={{ marginTop: 10 }}>Initializing...</Text>
      </View>
    );
  }

  return (
    <NavigationContainer>
      {user ? <AppStack userRole={userRole} /> : <AuthStack />}
    </NavigationContainer>
  );
}