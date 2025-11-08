import React from 'react';
import { View, TouchableOpacity, Text, SafeAreaView, StyleSheet } from 'react-native';
import { auth } from '../firebase';
import { globalStyles, COLORS, SPACING } from '../styles/globalStyles';

const ProfileScreen = () => {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.neutralGray }}>
      <View style={styles.container}>
        <TouchableOpacity 
          style={[globalStyles.buttonPrimary, { backgroundColor: COLORS.error, marginTop: SPACING.xl }]} 
          onPress={() => auth.signOut()}
        >
          <Text style={globalStyles.buttonPrimaryText}>Logout</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: SPACING.lg,
        justifyContent: 'flex-end',
        paddingBottom: SPACING.xl * 2
    }
})

export default ProfileScreen;
