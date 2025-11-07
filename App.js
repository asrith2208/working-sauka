import React, { useState, useEffect } from 'react';
import { TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from './firebase';
import { Ionicons } from '@expo/vector-icons';

// --- Import All Screens ---

// Core Authentication and Dashboards
import LoginScreen from './screens/LoginScreen';
import AdminDashboard from './screens/AdminDashboard';
import DistributorDashboard from './screens/DistributorDashboard';
import MedicalStoreDashboard from './screens/MedicalStoreDashboard';

// User Management Screens
import AddDistributorScreen from './screens/AddDistributorScreen';
import AddMedicalStoreScreen from './screens/AddMedicalStoreScreen';

// Admin Product Management Screens
import ProductListScreen from './screens/ProductListScreen';
import ProductFormScreen from './screens/ProductFormScreen';

// User Order Placement Screens
import UserProductListScreen from './screens/UserProductListScreen';
import ProductDetailScreen from './screens/ProductDetailScreen';
import OrderSummaryScreen from './screens/OrderSummaryScreen';

// Order History Screens
import OrderListScreen from './screens/OrderListScreen';
import OrderDetailScreen from './screens/OrderDetailScreen';

// Performance Reporting Screens
import AdminDistributorListScreen from './screens/AdminDistributorListScreen';
import DistributorDetailScreen from './screens/DistributorDetailScreen';
import MedicalStoreDetailScreen from './screens/MedicalStoreDetailScreen';
import DistributorStoreListScreen from './screens/DistributorStoreListScreen';

// Profile Management Screens
import ProfileScreen from './screens/ProfileScreen';
import EditProfileScreen from './screens/EditProfileScreen';
import ChangePasswordScreen from './screens/ChangePasswordScreen';


const Stack = createNativeStackNavigator();

// --- Navigators ---

// Navigator for users who are NOT logged in
function AuthStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
    </Stack.Navigator>
  );
}

// Navigator for users who ARE logged in
function AppStack({ userRole }) {
  if (!userRole) {
    // We can show a loading spinner here if we want
    return null;
  }

  // Helper function to create the header profile icon
  const ProfileIcon = (navigation) => (
    <TouchableOpacity onPress={() => navigation.navigate('Profile')} style={{ marginRight: 15 }}>
      <Ionicons name="person-circle-outline" size={28} color="#007AFF" />
    </TouchableOpacity>
  );

  // Define shared screen groups to avoid repetition
  const commonScreens = (
    <>
      <Stack.Screen name="Profile" component={ProfileScreen} />
      <Stack.Screen name="EditProfile" component={EditProfileScreen} options={{ title: 'Edit Profile' }} />
      <Stack.Screen name="ChangePassword" component={ChangePasswordScreen} options={{ title: 'Change Password' }} />
    </>
  );

  const orderHistoryScreens = (
    <>
      <Stack.Screen name="OrderList" component={OrderListScreen} options={{ title: 'Orders' }} />
      <Stack.Screen name="OrderDetail" component={OrderDetailScreen} options={{ title: 'Order Details' }} />
    </>
  );
  
  const placeOrderScreens = (
     <>
      <Stack.Screen name="UserProductList" component={UserProductListScreen} options={{ title: 'Place an Order' }} />
      <Stack.Screen name="ProductDetail" component={ProductDetailScreen} options={{ title: 'Product Details' }} />
      <Stack.Screen name="OrderSummary" component={OrderSummaryScreen} options={{ title: 'Order Summary' }} />
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
          <Stack.Screen 
            name="ProductList" 
            component={ProductListScreen} 
            options={({ navigation }) => ({ 
              title: 'Products',
              headerRight: () => (
                <TouchableOpacity onPress={() => navigation.navigate('ProductForm')}>
                  <Text style={styles.headerButton}>Add</Text>
                </TouchableOpacity>
              ),
            })} 
          />
          <Stack.Screen name="ProductForm" component={ProductFormScreen} options={({ route }) => ({ title: route.params?.product ? 'Edit Product' : 'Add Product' })} />
          {orderHistoryScreens}
          {commonScreens}
        </>
      )}

      {userRole === 'distributor' && (
        <>
          <Stack.Screen name="DistributorDashboard" component={DistributorDashboard} options={({ navigation }) => ({ title: 'Distributor Home', headerRight: () => ProfileIcon(navigation) })} />
          <Stack.Screen name="DistributorStoreList" component={DistributorStoreListScreen} options={{ title: 'My Medical Stores' }} />
          <Stack.Screen name="AddMedicalStore" component={AddMedicalStoreScreen} options={{ title: 'Add Medical Store' }} />
          {placeOrderScreens}
          {orderHistoryScreens}
          {commonScreens}
        </>
      )}

      {userRole === 'medical_store' && (
        <>
          <Stack.Screen name="MedicalStoreDashboard" component={MedicalStoreDashboard} options={({ navigation }) => ({ title: 'Store Home', headerRight: () => ProfileIcon(navigation) })} />
          {placeOrderScreens}
          {orderHistoryScreens}
          {commonScreens}
        </>
      )}
    </Stack.Navigator>
  );
}


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
    // Optional: Render a loading indicator for the initial auth check
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

const styles = StyleSheet.create({
    headerButton: {
        color: '#007AFF',
        fontSize: 18,
    }
});