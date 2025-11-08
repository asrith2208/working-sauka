import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, ActivityIndicator, Alert, SafeAreaView, StatusBar } from 'react-native';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { globalStyles, COLORS, FONTS, SPACING } from '../styles/globalStyles';

const QuantityStepper = ({ value, onIncrement, onDecrement, stock }) => (
  <View style={styles.stepperContainer}>
    <TouchableOpacity onPress={onDecrement} style={styles.stepperButton} disabled={value <= 0}>
      <Text style={styles.stepperButtonText}>-</Text>
    </TouchableOpacity>
    <Text style={styles.stepperValue}>{value}</Text>
    <TouchableOpacity onPress={onIncrement} style={styles.stepperButton} disabled={value >= stock}>
      <Text style={styles.stepperButtonText}>+</Text>
    </TouchableOpacity>
  </View>
);

const ProductDetailScreen = ({ route, navigation }) => {
  const { productId } = route.params;
  const [product, setProduct] = useState(null);
  const [quantities, setQuantities] = useState({});
  
  useEffect(() => {
    const fetchProduct = async () => {
      const docRef = doc(db, 'products', productId);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const productData = docSnap.data();
        setProduct(productData);
        // Initialize quantities
        const initialQuantities = {};
        productData.variants.forEach(v => { initialQuantities[v.size] = 0; });
        setQuantities(initialQuantities);
      }
    };
    fetchProduct();
  }, [productId]);

  const handleQuantityChange = (size, change) => {
    const currentVariant = product.variants.find(v => v.size === size);
    const currentQty = quantities[size] || 0;
    const newQty = currentQty + change;

    if (newQty < 0) return;
    if (newQty > currentVariant.stock) {
        Alert.alert("Stock limit reached", `You can only order up to ${currentVariant.stock} units for size ${size}.`);
        setQuantities({ ...quantities, [size]: currentVariant.stock });
        return;
    }
    setQuantities({ ...quantities, [size]: newQty });
  };

  const handlePlaceOrder = () => {
    const orderItems = product.variants
      .filter(variant => quantities[variant.size] > 0)
      .map(variant => ({
          ...variant,
          quantity: quantities[variant.size],
          totalPrice: quantities[variant.size] * variant.price,
      }));

    if (orderItems.length === 0) {
      Alert.alert("No items selected", "Please add a quantity for at least one product variant.");
      return;
    }

    const orderDetails = {
      product: { id: productId, name: product.name, imageUrl: product.imageUrls[0] },
      items: orderItems,
    };
    navigation.navigate('OrderSummary', { orderDetails });
  };

  const totalItems = Object.values(quantities).reduce((acc, cur) => acc + cur, 0);

  if (!product) {
    return <View style={globalStyles.centered}><ActivityIndicator size="large" color={COLORS.primary} /></View>;
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.white }}>
        <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />
        <ScrollView style={styles.container}>
            <Image source={{ uri: product.imageUrls[0] }} style={styles.image} />
            <View style={styles.detailsContainer}>
                <Text style={globalStyles.h2}>{product.name}</Text>
                <Text style={[globalStyles.body, { marginVertical: SPACING.md }]}>{product.description}</Text>

                <Text style={styles.variantHeader}>Select Variants</Text>
                
                {product.variants.map((variant, index) => {
                    const isOutOfStock = !variant.stock || variant.stock <= 0;
                    return (
                        <View key={index} style={[styles.variantRow, isOutOfStock && styles.disabledRow]}>
                            <View style={styles.variantInfo}>
                                <Text style={styles.variantSize}>{variant.size} ({variant.pieces} pcs)</Text>
                                <Text style={styles.variantPrice}>₹{variant.price.toFixed(2)}</Text>
                            </View>
                            <View style={styles.variantActions}>
                                {isOutOfStock ? (
                                    <Text style={styles.outOfStockText}>Out of Stock</Text>
                                ) : (
                                  <>
                                    <QuantityStepper 
                                      value={quantities[variant.size] || 0}
                                      onIncrement={() => handleQuantityChange(variant.size, 1)}
                                      onDecrement={() => handleQuantityChange(variant.size, -1)}
                                      stock={variant.stock}
                                    />
                                    <Text style={styles.stockText}>{variant.stock} left</Text>
                                  </>
                                )}
                            </View>
                        </View>
                    )
                })}
            </View>
        </ScrollView>
        {totalItems > 0 && (
            <View style={styles.footer}>
                <TouchableOpacity style={globalStyles.buttonPrimary} onPress={handlePlaceOrder}>
                    <Text style={globalStyles.buttonPrimaryText}>Review Order ({totalItems} items)</Text>
                </TouchableOpacity>
            </View>
        )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.white },
  image: { width: '100%', height: 300 },
  detailsContainer: { padding: SPACING.lg },
  variantHeader: { ...FONTS.h3, marginTop: SPACING.lg, paddingBottom: SPACING.sm, borderBottomWidth: 1, borderBottomColor: COLORS.neutralGray2 },
  variantRow: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    paddingVertical: SPACING.md, 
    borderBottomWidth: 1, 
    borderBottomColor: COLORS.neutralGray2 
  },
  variantInfo: { flex: 1 },
  variantSize: { ...FONTS.body, fontWeight: '600', fontSize: 18 },
  variantPrice: { ...FONTS.body, color: COLORS.textSecondary, marginTop: SPACING.xs },
  variantActions: { alignItems: 'flex-end' },
  stockText: { ...FONTS.small, color: COLORS.success, marginTop: SPACING.xs },
  disabledRow: { opacity: 0.5 },
  outOfStockText: { ...FONTS.body, color: COLORS.error, fontWeight: '600' },
  
  // --- Stepper Styles ---
  stepperContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.neutralGray, borderRadius: 20 },
  stepperButton: { 
    width: 40, 
    height: 40, 
    justifyContent: 'center',
    alignItems: 'center', 
  },
  stepperButtonText: { fontSize: 20, fontWeight: 'bold', color: COLORS.primary },
  stepperValue: { fontSize: 18, fontWeight: 'bold', color: COLORS.textPrimary, minWidth: 40, textAlign: 'center' },
  
  // -- Footer Button -- //
  footer: {
    padding: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.neutralGray2,
    backgroundColor: COLORS.white,
  },
});

export default ProductDetailScreen;
