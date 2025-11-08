import React from 'react';
import { View, Text, SafeAreaView } from 'react-native';
import { globalStyles } from '../styles/globalStyles';

const DistributorStoresScreen = () => {
  return (
    <SafeAreaView style={globalStyles.safeArea}>
      <View style={globalStyles.container}>
        <Text>Distributor Stores Screen</Text>
      </View>
    </SafeAreaView>
  );
};

export default DistributorStoresScreen;
