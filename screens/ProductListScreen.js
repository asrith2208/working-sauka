import React, { useState, useEffect, useLayoutEffect } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, Alert, Image, SafeAreaView, ActivityIndicator } from 'react-native';
import { collection, query, onSnapshot, doc, deleteDoc, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import { useIsFocused } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { globalStyles, COLORS, SPACING, FONTS } from '../styles/globalStyles';

const ProductListScreen = ({ navigation }) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const isFocused = useIsFocused();

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity onPress={() => navigation.navigate('ProductForm')} style={{ marginRight: SPACING.sm }}>
          <Ionicons name="add-circle-outline" size={28} color={COLORS.primary} />
        </TouchableOpacity>
      ),
    });
  }, [navigation]);

  useEffect(() => {
    if (isFocused) {
      const q = query(collection(db, 'products'), orderBy('name'));
      const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const productsData = [];
        querySnapshot.forEach((doc) => {
          productsData.push({ ...doc.data(), id: doc.id });
        });
        setProducts(productsData);
        setLoading(false);
      });
      return () => unsubscribe();
    }
  }, [isFocused]);

  const handleLongPress = (product) => {
    Alert.alert( "Delete Product", `Are you sure you want to delete ${product.name}?`,
      [{ text: "Cancel", style: "cancel" }, { text: "Delete", style: "destructive", onPress: () => deleteProduct(product.id) }]
    );
  };

  const deleteProduct = async (productId) => {
    try {
      await deleteDoc(doc(db, "products", productId));
      Alert.alert("Success", "Product has been deleted.");
    } catch (error) {
      Alert.alert("Error", "Failed to delete product. Please try again.");
      console.error("Error deleting product: ", error);
    }
  };

  const renderItem = ({ item }) => {
    const stockInfo = item.variants?.map(v => `${v.size}: ${v.stock || 0}`).join(' | ') || 'No stock info';

    return (
        <TouchableOpacity 
            style={styles.productItem}
            onPress={() => navigation.navigate('ProductForm', { product: item })}
            onLongPress={() => handleLongPress(item)}
        >
            <Image 
                source={{ uri: item.imageUrls?.[0] || 'https://via.placeholder.com/100' }} 
                style={styles.productImage} 
            />
            <View style={styles.productInfo}>
                <Text style={styles.productName}>{item.name}</Text>
                <Text style={styles.productStock} numberOfLines={1}>{stockInfo}</Text>
            </View>
             <View style={styles.productActions}>
                <Ionicons name="chevron-forward" size={24} color={COLORS.textSecondary} />
            </View>
        </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={globalStyles.centered}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={globalStyles.safeArea}>
      <View style={styles.container}>
        <FlatList
          data={products}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingBottom: SPACING.md }}
          ListEmptyComponent={
            <View style={globalStyles.centered}>
                <Text style={styles.emptyText}>No products found. Tap the '+' to add one!</Text>
            </View>
          }
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.neutralGray,
    },
    productItem: {
        ...globalStyles.card,
        flexDirection: 'row',
        alignItems: 'center',
        padding: SPACING.sm,
        marginHorizontal: SPACING.md,
        marginVertical: SPACING.xs,
    },
    productImage: {
        width: 70,
        height: 70,
        borderRadius: 8,
        marginRight: SPACING.md,
        backgroundColor: '#eee',
    },
    productInfo: {
        flex: 1,
    },
    productName: {
        ...FONTS.h3,
        color: COLORS.textPrimary,
    },
    productStock: {
        ...FONTS.body,
        color: COLORS.textSecondary,
        marginTop: SPACING.xs,
    },
    productActions: {
      paddingHorizontal: SPACING.sm
    },
    emptyText: {
        ...FONTS.body,
        color: COLORS.textSecondary,
    }
});

export default ProductListScreen;
