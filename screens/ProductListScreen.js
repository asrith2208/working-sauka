import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, Alert, Image } from 'react-native';
import { collection, query, onSnapshot, doc, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useIsFocused } from '@react-navigation/native';

const ProductListScreen = ({ navigation }) => {
  const [products, setProducts] = useState([]);
  const isFocused = useIsFocused();

  useEffect(() => {
    if (isFocused) {
      const q = query(collection(db, 'products'));
      const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const productsData = [];
        querySnapshot.forEach((doc) => {
          productsData.push({ ...doc.data(), id: doc.id });
        });
        setProducts(productsData);
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
    // Note: This does not delete images from Storage. For a production app, you'd add that logic.
    await deleteDoc(doc(db, "products", productId));
    Alert.alert("Success", "Product has been deleted.");
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity 
        style={styles.productItem} 
        onPress={() => navigation.navigate('ProductForm', { product: item })}
        onLongPress={() => handleLongPress(item)}
    >
      <Image source={{ uri: item.imageUrls?.[0] || 'https://via.placeholder.com/80' }} style={styles.productImage} />
      <View style={styles.productInfo}>
        <Text style={styles.productName}>{item.name}</Text>
        <Text style={styles.productDetail}>{item.variants?.length || 0} size(s) available</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={products}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={<Text style={styles.emptyText}>No products found. Add one!</Text>}
      />
    </View>
  );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f8f9fa' },
    productItem: { flexDirection: 'row', alignItems: 'center', padding: 15, borderBottomWidth: 1, borderBottomColor: '#e0e0e0', backgroundColor: '#fff' },
    productImage: { width: 80, height: 80, borderRadius: 8, marginRight: 15 },
    productInfo: { flex: 1 },
    productName: { fontSize: 18, fontWeight: '600' },
    productDetail: { fontSize: 14, color: '#666', marginTop: 4 },
    emptyText: { textAlign: 'center', marginTop: 50, fontSize: 16 }
});

export default ProductListScreen;