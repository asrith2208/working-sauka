import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

import DistributorDashboard from '../screens/DistributorDashboard';
import DistributorStoresScreen from '../screens/DistributorStoresScreen';
import UserProductList from '../screens/UserProductList';
import OrderList from '../screens/OrderList';
import ProfileScreen from '../screens/ProfileScreen';
import { COLORS } from '../styles/globalStyles';

const Tab = createBottomTabNavigator();

const DistributorTabNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'Home') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Stores') {
            iconName = focused ? 'storefront' : 'storefront-outline';
          } else if (route.name === 'New Order') {
            iconName = focused ? 'add-circle' : 'add-circle-outline';
          } else if (route.name === 'Orders') {
            iconName = focused ? 'receipt' : 'receipt-outline';
          } else if (route.name === 'Profile') {
            iconName = focused ? 'person-circle' : 'person-circle-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: 'gray',
        headerShown: false, // We will use headers from individual screens
      })}
    >
      <Tab.Screen name="Home" component={DistributorDashboard} />
      <Tab.Screen name="Stores" component={DistributorStoresScreen} />
      <Tab.Screen name="New Order" component={UserProductList} />
      <Tab.Screen 
        name="Orders" 
        component={OrderList} 
        initialParams={{ role: 'distributor' }} 
      />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
};

export default DistributorTabNavigator;
