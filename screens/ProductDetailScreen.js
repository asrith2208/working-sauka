import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TextInput, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';

const ProductDetailScreen = ({ route, navigation }) => {
  const { productId } = route.params;
  const [product, setProduct] = useState(null);
  const [quantities, setQuantities] = useState({}); // e.g., { 'XL': 5, 'XXL': 0 }

  useEffect(() => {
    const fetchProduct = async () => {
      const docRef = doc(db, 'products', productId);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setProduct(docSnap.data());
      }
    };
    fetchProduct();
  }, [productId]);

  // Updated handleQuantityChange to include stock validation
  const handleQuantityChange = (size, quantity, availableStock) => {
    const numQuantity = parseInt(quantity, 10) || 0;
    
    // Validate against available stock
    if (numQuantity > availableStock) {
        Alert.alert("Stock limit exceeded", `You can only order up to ${availableStock} units for size ${size}.`);
        // We update the state with the max available stock instead of the user's input
        setQuantities({ ...quantities, [size]: availableStock }); 
        return;
    }
    
    setQuantities({ ...quantities, [size]: numQuantity });
  };

  const handlePlaceOrder = () => {
    const orderItems = product.variants
      .filter(variant => quantities[variant.size] && quantities[variant.size] > 0)
      .map(variant => {
        // Final check to ensure order quantity doesn't exceed stock
        if (quantities[variant.size] > variant.stock) {
            Alert.alert("Error", `Stock for size ${variant.size} has changed. Please review your order.`);
            return null; // This will be filtered out
        }
        return {
          ...variant,
          quantity: quantities[variant.size],
          totalPrice: quantities[variant.size] * variant.price,
        }
      })
      .filter(item => item !== null); // Remove any items that failed the final stock check

    if (orderItems.length === 0) {
      Alert.alert("No items selected", "Please enter a valid quantity for at least one variant.");
      return;
    }

    const orderDetails = {
      product: {
        id: productId,
        name: product.name,
        imageUrl: product.imageUrls[0],
      },
      items: orderItems,
    };
    navigation.navigate('OrderSummary', { orderDetails });
  };

  if (!product) {
    return <ActivityIndicator size="large" style={{ flex: 1, justifyContent: 'center' }} />;
  }

  return (
    <ScrollView style={styles.container}>
      <Image source={{ uri: product.imageUrls[0] }} style={styles.image} />
      <View style={styles.detailsContainer}>
        <Text style={styles.name}>{product.name}</Text>
        <Text style={styles.description}>{product.description}</Text>
        <Text style={styles.variantHeader}>Select Quantities</Text>
        
        {/* Updated variant mapping to show stock and disable out-of-stock items */}
        {product.variants.map((variant, index) => {
            const isOutOfStock = !variant.stock || variant.stock <= 0;
            return (
                <View key={index} style={[styles.variantRow, isOutOfStock && styles.disabledRow]}>
                    <View style={{flex: 1}}>
                        <Text style={styles.variantText}>{variant.size} ({variant.pieces} pcs)</Text>
                        {!isOutOfStock && <Text style={styles.stockText}>{variant.stock} units available</Text>}
                    </View>
                    <Text style={styles.variantText}>₹{variant.price.toFixed(2)}</Text>
                    {isOutOfStock ? (
                        <Text style={styles.outOfStockText}>Out of Stock</Text>
                    ) : (
                        <TextInput
                            style={styles.quantityInput}
                            keyboardType="number-pad"
                            placeholder="0"
                            // Use the state value for the text input to ensure it updates correctly on validation
                            value={quantities[variant.size] ? String(quantities[variant.size]) : ''}
                            onChangeText={(text) => handleQuantityChange(variant.size, text, variant.stock)}
                        />
                    )}
                </View>
            )
        })}
      </View>
      <TouchableOpacity style={styles.button} onPress={handlePlaceOrder}>
        <Text style={styles.buttonText}>Review Order</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#fff' },
    image: { width: '100%', height: 250 },
    detailsContainer: { padding: 20 },
    name: { fontSize: 24, fontWeight: 'bold', marginBottom: 10 },
    description: { fontSize: 16, color: '#666', lineHeight: 24, marginBottom: 20 },
    variantHeader: { fontSize: 18, fontWeight: 'bold', marginBottom: 10, borderTopWidth: 1, borderTopColor: '#eee', paddingTop: 15 },
    variantRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#eee' },
    variantText: { fontSize: 16, flex: 1 },
    quantityInput: { borderWidth: 1, borderColor: '#ccc', borderRadius: 5, width: 60, height: 40, textAlign: 'center', fontSize: 16 },
    button: { margin: 20, height: 50, backgroundColor: '#40916c', justifyContent: 'center', alignItems: 'center', borderRadius: 8 },
    buttonText: { color: '#ffffff', fontSize: 18, fontWeight: 'bold' },
    // New styles for stock management
    disabledRow: { backgroundColor: '#f8f9fa', opacity: 0.6 },
    stockText: { fontSize: 12, color: 'green', marginTop: 2 },
    outOfStockText: { color: 'red', fontWeight: 'bold', width: 80, textAlign: 'center' },
});

export default ProductDetailScreen;