import React, { useState, useEffect } from 'react';
import { View, Platform, TouchableOpacity, Text, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from './firebase';
import { Ionicons } from '@expo/vector-icons';
import 'react-native-get-random-values';

// --- PUSH NOTIFICATION & DEVICE IMPORTS ---
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';

// --- IMPORT ALL SCREENS ---
import LoginScreen from './screens/LoginScreen';
import AdminDashboard from './screens/AdminDashboard';
import DistributorDashboard from './screens/DistributorDashboard';
import MedicalStoreDashboard from './screens/MedicalStoreDashboard';
import AddDistributorScreen from './screens/AddDistributorScreen';
import AddMedicalStoreScreen from './screens/AddMedicalStoreScreen';
import AdminDistributorListScreen from './screens/AdminDistributorListScreen';
import DistributorDetailScreen from './screens/DistributorDetailScreen';
import MedicalStoreDetailScreen from './screens/MedicalStoreDetailScreen';
import DistributorStoreListScreen from './screens/DistributorStoreListScreen';
import ProfileScreen from './screens/ProfileScreen';
import EditProfileScreen from './screens/EditProfileScreen';
import ChangePasswordScreen from './screens/ChangePasswordScreen';
import ProductListScreen from './screens/ProductListScreen';
import ProductFormScreen from './screens/ProductFormScreen';
import UserProductListScreen from './screens/UserProductListScreen';
import ProductDetailScreen from './screens/ProductDetailScreen';
import OrderSummaryScreen from './screens/OrderSummaryScreen';
import OrderListScreen from './screens/OrderListScreen';
import OrderDetailScreen from './screens/OrderDetailScreen';

const Stack = createNativeStackNavigator();

// --- PUSH NOTIFICATION SETUP WITH DETAILED LOGGING ---
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

async function registerForPushNotificationsAsync(userId) {
  console.log("1. Starting push notification registration process...");
  
  if (!Device.isDevice) {
    console.log("2. FAILED: Not a physical device. Stopping.");
    return;
  }
  
  console.log("2. SUCCESS: Running on a physical device.");

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  
  console.log(`3. Current permission status is: ${existingStatus}`);

  if (existingStatus !== 'granted') {
    console.log("4. Permission is not granted, requesting it now...");
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
    console.log(`5. User responded to permission request. New status is: ${finalStatus}`);
  }
  
  if (finalStatus !== 'granted') {
    console.log("6. FAILED: User did not grant permission. Stopping.");
    return;
  }

  console.log("6. SUCCESS: Permission is granted.");

  try {
    const token = (await Notifications.getExpoPushTokenAsync()).data;
    console.log("7. SUCCESS: Got Expo Push Token:", token);

    if (Platform.OS === 'android') {
      Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
      });
    }
    
    if (token && userId) {
      const userDocRef = doc(db, 'users', userId);
      await updateDoc(userDocRef, { expoPushToken: token });
      console.log('8. SUCCESS: Push token saved to Firestore.');
    }
  } catch (e) {
    console.error("7. FAILED: An error occurred while getting the push token.", e);
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
  const ProfileIcon = (navigation) => (
    <TouchableOpacity onPress={() => navigation.navigate('Profile')} style={{ marginRight: 15 }}>
      <Ionicons name="person-circle-outline" size={28} color="#007AFF" />
    </TouchableOpacity>
  );

  const commonScreens = (
    <>
      <Stack.Screen name="Profile" component={ProfileScreen} />
      <Stack.Screen name="EditProfile" component={EditProfileScreen} options={{ title: 'Edit Profile' }} />
      <Stack.Screen name="ChangePassword" component={ChangePasswordScreen} options={{ title: 'Change Password' }} />
    </>
  );

  const userPlacingOrderScreens = (
    <>
      <Stack.Screen name="UserProductList" component={UserProductListScreen} options={{ title: 'Products' }} />
      <Stack.Screen name="ProductDetail" component={ProductDetailScreen} options={{ title: 'Product Details' }} />
      <Stack.Screen name="OrderSummary" component={OrderSummaryScreen} options={{ title: 'Order Summary' }} />
    </>
  );

  const userOrderScreens = (
    <>
      <Stack.Screen name="OrderList" component={OrderListScreen} options={{ title: 'Orders' }} />
      <Stack.Screen name="OrderDetail" component={OrderDetailScreen} options={{ title: 'Order Details' }} />
    </>
  );

  return (
    <Stack.Navigator>
      {userRole === 'admin' && (
        <>
          <Stack.Screen name="AdminDashboard" component={AdminDashboard} options={({ navigation }) => ({ title: 'Admin Home', headerRight: () => ProfileIcon(navigation) })} />
          <Stack.Screen name="AdminDistributorList" component={AdminDistributorListScreen} options={{ title: 'Distributor Performance' }} />
          <Stack.Screen name="DistributorDetail" component={DistributorDetailScreen} options={({ route }) => ({ title: route.params.distributor.name })} />
          <Stack.Screen name="MedicalStoreDetail" component={MedicalStoreDetailScreen} options={({ route }) => ({ title: route.params.medicalStore.name })} />
          <Stack.Screen name="AddDistributor" component={AddDistributorScreen} options={{ title: 'Add Distributor' }} />
          <Stack.Screen name="ProductList" component={ProductListScreen} options={({ navigation }) => ({ title: 'Manage Products', headerRight: () => (<TouchableOpacity onPress={() => navigation.navigate('ProductForm')}><Text style={{ color: '#007AFF', fontSize: 18 }}>Add</Text></TouchableOpacity>) })} />
          <Stack.Screen name="ProductForm" component={ProductFormScreen} options={({ route }) => ({ title: route.params?.product ? 'Edit Product' : 'Add Product' })} />
          {userOrderScreens}
          {commonScreens}
        </>
      )}
      {userRole === 'distributor' && (
        <>
          <Stack.Screen name="DistributorDashboard" component={DistributorDashboard} options={({ navigation }) => ({ title: 'Distributor Home', headerRight: () => ProfileIcon(navigation) })} />
          <Stack.Screen name="DistributorStoreList" component={DistributorStoreListScreen} options={{ title: 'My Medical Stores' }} />
          <Stack.Screen name="AddMedicalStore" component={AddMedicalStoreScreen} options={{ title: 'Add Medical Store' }} />
          {userPlacingOrderScreens}
          {userOrderScreens}
          {commonScreens}
        </>
      )}
      {userRole === 'medical_store' && (
        <>
          <Stack.Screen name="MedicalStoreDashboard" component={MedicalStoreDashboard} options={({ navigation }) => ({ title: 'Store Home', headerRight: () => ProfileIcon(navigation) })} />
          {userPlacingOrderScreens}
          {userOrderScreens}
          {commonScreens}
        </>
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
            console.error("No user document found for this user! Logging out.");
            auth.signOut();
          }
        } else {
          setUser(null);
          setUserRole(null);
        }
      } catch (error) {
        console.error("Error during authentication check:", error);
      } finally {
        if (initializing) {
          setInitializing(false);
        }
      }
    });

    return unsubscribe;
  }, []);

  if (initializing) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f8f9fa' }}>
        <ActivityIndicator size="large" color="#40916c" />
        <Text style={{ marginTop: 10, color: '#666' }}>Initializing App...</Text>
      </View>
    );
  }

  return (
    <NavigationContainer>
      {user ? <AppStack userRole={userRole} /> : <AuthStack />}
    </NavigationContainer>
  );
}