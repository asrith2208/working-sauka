import React, { useState, useEffect } from 'react';
import { TouchableOpacity, Text } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from './firebase';

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

// Order History Screens (NEW IMPORTS)
import OrderListScreen from './screens/OrderListScreen';
import OrderDetailScreen from './screens/OrderDetailScreen';


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
    // If the role isn't determined yet, don't render anything to avoid flashes of wrong content
    return null;
  }

  // Define the shared screens for viewing order history, used by ALL roles
  const orderHistoryScreens = (
    <>
      <Stack.Screen name="OrderList" component={OrderListScreen} options={{ title: 'Orders' }} />
      <Stack.Screen name="OrderDetail" component={OrderDetailScreen} options={{ title: 'Order Details' }} />
    </>
  );
  
  // Define the shared screens for placing new orders, used by Distributor and Medical Store
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
          <Stack.Screen name="AdminDashboard" component={AdminDashboard} options={{ title: 'Admin Home' }} />
          <Stack.Screen name="AddDistributor" component={AddDistributorScreen} options={{ title: 'Add Distributor' }} />
          <Stack.Screen 
            name="ProductList" 
            component={ProductListScreen} 
            options={({ navigation }) => ({ 
              title: 'Products',
              headerRight: () => (
                <TouchableOpacity onPress={() => navigation.navigate('ProductForm')}>
                  <Text style={{ color: '#007AFF', fontSize: 18, marginRight: 10 }}>Add</Text>
                </TouchableOpacity>
              ),
            })} 
          />
          <Stack.Screen 
            name="ProductForm" 
            component={ProductFormScreen} 
            options={({ route }) => ({ 
              title: route.params?.product ? 'Edit Product' : 'Add Product' 
            })} 
          />
          {orderHistoryScreens}
        </>
      )}

      {userRole === 'distributor' && (
        <>
          <Stack.Screen name="DistributorDashboard" component={DistributorDashboard} options={{ title: 'Distributor Home' }} />
          <Stack.Screen name="AddMedicalStore" component={AddMedicalStoreScreen} options={{ title: 'Add Medical Store' }} />
          {placeOrderScreens}
          {orderHistoryScreens}
        </>
      )}

      {userRole === 'medical_store' && (
        <>
          <Stack.Screen name="MedicalStoreDashboard" component={MedicalStoreDashboard} options={{ title: 'Store Home' }} />
          {placeOrderScreens}
          {orderHistoryScreens}
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
          console.error("No user document found in Firestore for this user!");
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
    return null;
  }

  return (
    <NavigationContainer>
      {user ? <AppStack userRole={userRole} /> : <AuthStack />}
    </NavigationContainer>
  );
}