import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, Image, ActivityIndicator, TextInput, SafeAreaView, StatusBar } from 'react-native';
import { collection, query, where, onSnapshot, getDocs, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import { globalStyles, COLORS, FONTS, SPACING } from '../styles/globalStyles';

const ProductCard = React.memo(({ item, onPress }) => (
    <TouchableOpacity style={styles.productCard} onPress={onPress}>
        <Image source={{ uri: item.imageUrls?.[0] || 'https://via.placeholder.com/150' }} style={styles.productImage} />
        <View style={styles.productInfo}>
            <Text style={styles.productName} numberOfLines={2}>{item.name}</Text>
            <Text style={styles.productDescription} numberOfLines={2}>{item.description || 'No description.'}</Text>
            <View style={styles.productFooter}>
              <Text style={styles.productPrice}>₹{item.variants?.[0]?.price || 'N/A'}</Text>
            </View>
        </View>
    </TouchableOpacity>
));

const UserProductListScreen = ({ navigation }) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('All');

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const categoriesSnapshot = await getDocs(collection(db, "products"));
        const uniqueCategories = [...new Set(categoriesSnapshot.docs.map(doc => doc.data().category).filter(Boolean))];
        setCategories(['All', ...uniqueCategories]);

        const q = query(collection(db, 'products'), where("isActive", "==", true), orderBy('name'));
        const unsubscribe = onSnapshot(q, (querySnapshot) => {
          const productsData = querySnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
          setProducts(productsData);
          setLoading(false);
        });

        return () => unsubscribe && unsubscribe();
      } catch (error) {
        console.error("Error fetching data: ", error);
        setLoading(false);
      }
    };

    const unsubscribe = fetchData();
    return () => { unsubscribe.then(unsub => unsub && unsub()) };
  }, []);

  const filteredProducts = useMemo(() => {
    let filtered = products;
    if (selectedCategory && selectedCategory !== 'All') {
      filtered = filtered.filter(product => product.category === selectedCategory);
    }
    if (searchQuery.trim() !== '') {
      filtered = filtered.filter(product =>
        product.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    return filtered;
  }, [searchQuery, selectedCategory, products]);

  const renderCategory = ({ item }) => (
    <TouchableOpacity 
      style={[styles.categoryButton, selectedCategory === item && styles.selectedCategoryButton]}
      onPress={() => setSelectedCategory(item)}
    >
      <Text style={[styles.categoryButtonText, selectedCategory === item && styles.selectedCategoryButtonText]}>{item}</Text>
    </TouchableOpacity>
  );
  
  if (loading) {
    return <View style={globalStyles.centered}><ActivityIndicator size="large" color={COLORS.primary} /></View>;
  }

  return (
    <SafeAreaView style={globalStyles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.neutralGray} />
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={globalStyles.h1}>Place an Order</Text>
          <View style={styles.searchContainer}>
              <TextInput
                  style={globalStyles.input}
                  placeholder="Search products..."
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  placeholderTextColor={COLORS.textSecondary}
              />
          </View>
        </View>

        <View style={styles.categoryContainer}>
            <FlatList
              data={categories}
              renderItem={renderCategory}
              keyExtractor={(item) => item}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: SPACING.md }}
            />
        </View>

        <FlatList
          data={filteredProducts}
          renderItem={({ item }) => <ProductCard item={item} onPress={() => navigation.navigate('ProductDetail', { productId: item.id })} />}
          keyExtractor={(item) => item.id}
          ListEmptyComponent={<View style={globalStyles.centered}><Text style={globalStyles.body}>No products found.</Text></View>}
          contentContainerStyle={{ paddingHorizontal: SPACING.md, paddingTop: SPACING.sm }}
          numColumns={2}
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.neutralGray },
  header: { 
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.sm,
  },
  searchContainer: { 
    marginTop: SPACING.md,
  },
  categoryContainer: {
    paddingVertical: SPACING.sm,
  },
  categoryButton: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    borderRadius: 20,
    backgroundColor: COLORS.white,
    marginHorizontal: SPACING.xs,
  },
  selectedCategoryButton: {
    backgroundColor: COLORS.primary,
  },
  categoryButtonText: {
    ...FONTS.body,
    color: COLORS.textPrimary,
    fontWeight: '500'
  },
  selectedCategoryButtonText: {
    color: COLORS.white,
  },
  productCard: {
    ...globalStyles.card,
    flex: 1,
    margin: SPACING.xs,
    maxWidth: '48%', 
  },
  productImage: {
    width: '100%',
    height: 120,
    borderRadius: 8,
    backgroundColor: '#eee'
  },
  productInfo: {
    flex: 1,
    padding: SPACING.sm
  },
  productName: {
    ...FONTS.h4,
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },
  productDescription: {
    ...FONTS.small,
    color: COLORS.textSecondary,
    marginBottom: SPACING.sm,
    flexGrow: 1,
  },
  productFooter: {
    marginTop: 'auto',
  },
  productPrice: {
    ...FONTS.body,
    color: COLORS.primary,
    fontWeight: 'bold',
  },
});

export default UserProductListScreen;
