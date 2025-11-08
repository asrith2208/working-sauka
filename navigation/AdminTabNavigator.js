import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

import AdminDashboard from '../screens/AdminDashboard';
import ProductList from '../screens/ProductList';
import OrderList from '../screens/OrderList';
import ProfileScreen from '../screens/ProfileScreen';
import { COLORS } from '../styles/globalStyles';

const Tab = createBottomTabNavigator();

const AdminTabNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'Home') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Products') {
            iconName = focused ? 'list-circle' : 'list-circle-outline';
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
      <Tab.Screen name="Home" component={AdminDashboard} />
      <Tab.Screen name="Products" component={ProductList} />
      <Tab.Screen 
        name="Orders" 
        component={OrderList} 
        initialParams={{ role: 'admin' }} 
      />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
};

export default AdminTabNavigator;
