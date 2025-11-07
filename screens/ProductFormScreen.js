import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet, ScrollView, TouchableOpacity, Image, Alert, Platform, KeyboardAvoidingView, Switch } from 'react-native';
import { doc, setDoc, serverTimestamp, collection } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../firebase';
import * as ImagePicker from 'expo-image-picker';
import 'react-native-get-random-values'; // Ensures uuid works reliably
import { v4 as uuidv4 } from 'uuid';

const ProductFormScreen = ({ route, navigation }) => {
    const isEditing = route.params?.product;

    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [images, setImages] = useState([]); 
    // --- CHANGE #1: Added 'stock' to the variant structure ---
    const [variants, setVariants] = useState([{ size: '', pieces: '', price: '', stock: '' }]);
    const [isActive, setIsActive] = useState(true);
    const [uploading, setUploading] = useState(false);

    useEffect(() => {
        if (isEditing) {
            const product = route.params.product;
            setName(product.name);
            setDescription(product.description);
            setImages(product.imageUrls || []);
            setIsActive(product.isActive !== undefined ? product.isActive : true);
            
            // --- CHANGE #2: Ensure all variant fields are converted to strings for inputs ---
            if (product.variants && product.variants.length > 0) {
                setVariants(product.variants.map(v => ({
                    size: v.size || '',
                    pieces: v.pieces?.toString() || '',
                    price: v.price?.toString() || '',
                    stock: v.stock?.toString() || '' // Convert stock to string
                })));
            } else {
                 setVariants([{ size: '', pieces: '', price: '', stock: '' }]);
            }
        }
    }, [isEditing]);
    
    const pickImage = async () => {
        if (images.length >= 4) {
            Alert.alert("Maximum images reached", "You can only upload up to 4 images.");
            return;
        }
        let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [4, 3],
            quality: 0.5,
        });

        if (!result.canceled) {
            setImages([...images, result.assets[0].uri]);
        }
    };

    const handleVariantChange = (index, field, value) => {
        const newVariants = [...variants];
        newVariants[index][field] = value;
        setVariants(newVariants);
    };

    const addVariant = () => {
        // --- CHANGE #3: Add 'stock' to new variants ---
        setVariants([...variants, { size: '', pieces: '', price: '', stock: '' }]);
    };
    
    const removeVariant = (index) => {
        const newVariants = [...variants];
        newVariants.splice(index, 1);
        setVariants(newVariants);
    };

    const uploadImage = async (uri) => {
        const response = await fetch(uri);
        const blob = await response.blob();
        const filename = `products/${uuidv4()}`; 
        const storageRef = ref(storage, filename);
        await uploadBytes(storageRef, blob);
        return await getDownloadURL(storageRef);
    };

    const handleSaveProduct = async () => {
        // --- CHANGE #4: Added 'stock' to the validation ---
        if (!name || !description || variants.some(v => !v.size || !v.pieces || !v.price || !v.stock)) {
            Alert.alert("Error", "Please fill in product name, description, and ALL variant fields (Size, Pieces, Price, Stock).");
            return;
        }
        if (images.length === 0) {
            Alert.alert("Error", "Please add at least one image.");
            return;
        }

        setUploading(true);
        try {
            const imageUrls = await Promise.all(
                images.map(imageUri => {
                    if (imageUri.startsWith('http')) return imageUri;
                    return uploadImage(imageUri);
                })
            );

            const productId = isEditing ? isEditing.id : doc(collection(db, 'products')).id;
            
            await setDoc(doc(db, "products", productId), {
                name,
                description,
                imageUrls,
                // --- CHANGE #5: Save 'stock' as a number ---
                variants: variants.map(v => ({
                    size: v.size,
                    pieces: parseInt(v.pieces, 10),
                    price: parseFloat(v.price),
                    stock: parseInt(v.stock, 10) // Save stock as an integer
                })),
                isActive,
                updatedAt: serverTimestamp(),
                ...( !isEditing && { createdAt: serverTimestamp() } )
            }, { merge: true });

            Alert.alert("Success", `Product has been ${isEditing ? 'updated' : 'created'}.`);
            navigation.goBack();

        } catch (error) {
            console.error("Error saving product:", error);
            Alert.alert("Error", "There was an issue saving the product.");
        } finally {
            setUploading(false);
        }
    };

    return (
        <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            keyboardVerticalOffset={Platform.OS === "ios" ? 64 : 0}
        >
            <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 50 }}>
                <Text style={styles.label}>Product Name</Text>
                <TextInput style={styles.input} value={name} onChangeText={setName} />

                <Text style={styles.label}>Description</Text>
                <TextInput style={[styles.input, styles.textArea]} value={description} onChangeText={setDescription} multiline />

                <Text style={styles.label}>Product Images (up to 4)</Text>
                <View style={styles.imageContainer}>
                    {images.map((uri, index) => (
                        <Image key={index} source={{ uri }} style={styles.imagePreview} />
                    ))}
                </View>
                <TouchableOpacity style={styles.imagePickerButton} onPress={pickImage}>
                    <Text style={styles.imagePickerText}>Add Image</Text>
                </TouchableOpacity>

                <Text style={styles.subHeader}>Variants</Text>
                {variants.map((variant, index) => (
                    // --- CHANGE #6: Added the TextInput for Stock ---
                    <View key={index} style={styles.variantContainer}>
                        <TextInput style={styles.variantInput} placeholder="Size" value={variant.size} onChangeText={(text) => handleVariantChange(index, 'size', text)} />
                        <TextInput style={styles.variantInput} placeholder="Pieces" value={variant.pieces} onChangeText={(text) => handleVariantChange(index, 'pieces', text)} keyboardType="number-pad" />
                        <TextInput style={styles.variantInput} placeholder="Price (₹)" value={variant.price} onChangeText={(text) => handleVariantChange(index, 'price', text)} keyboardType="numeric" />
                        <TextInput style={styles.variantInput} placeholder="Stock" value={variant.stock} onChangeText={(text) => handleVariantChange(index, 'stock', text)} keyboardType="number-pad" />
                        {variants.length > 1 && <TouchableOpacity onPress={() => removeVariant(index)}><Text style={styles.removeText}>Remove</Text></TouchableOpacity>}
                    </View>
                ))}
                <TouchableOpacity style={styles.addButton} onPress={addVariant}>
                    <Text style={styles.addButtonText}>+ Add Another Variant</Text>
                </TouchableOpacity>
                
                <View style={styles.switchContainer}>
                    <Text style={styles.label}>Product is Active</Text>
                    <Switch value={isActive} onValueChange={setIsActive} trackColor={{ false: "#767577", true: "#40916c" }} thumbColor={"#f4f3f4"}/>
                </View>

                <TouchableOpacity style={styles.button} onPress={handleSaveProduct} disabled={uploading}>
                    <Text style={styles.buttonText}>{uploading ? "Saving..." : "Save Product"}</Text>
                </TouchableOpacity>
            </ScrollView>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
   container: { flex: 1, padding: 20, backgroundColor: '#fff' },
    label: { fontSize: 16, color: '#333', marginBottom: 5, marginTop: 10 },
    subHeader: { fontSize: 18, fontWeight: 'bold', color: '#2d6a4f', marginTop: 20, marginBottom: 10, borderTopWidth: 1, borderTopColor: '#eee', paddingTop: 20 },
    input: { backgroundColor: '#f0f4f7', padding: 10, borderRadius: 8, marginBottom: 15, fontSize: 16 },
    textArea: { height: 100, textAlignVertical: 'top' },
    button: { height: 50, backgroundColor: '#40916c', justifyContent: 'center', alignItems: 'center', borderRadius: 8, marginTop: 20, marginBottom: 50 },
    buttonText: { color: '#ffffff', fontSize: 18, fontWeight: 'bold' },
    imageContainer: { flexDirection: 'row', flexWrap: 'wrap' },
    imagePreview: { width: 80, height: 80, borderRadius: 8, marginRight: 10, marginBottom: 10, borderWidth: 1, borderColor: '#ddd' },
    imagePickerButton: { padding: 10, backgroundColor: '#e9ecef', borderRadius: 8, alignSelf: 'flex-start' },
    imagePickerText: { color: '#495057' },
    // --- CHANGE #7: Adjusted variantContainer and variantInput for the new field ---
    variantContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
    variantInput: { flex: 1, height: 40, borderColor: '#ccc', borderWidth: 1, borderRadius: 5, paddingHorizontal: 8, marginRight: 5, fontSize: 12 },
    removeText: { color: 'red', marginLeft: 5 },
    addButton: { padding: 10 },
    addButtonText: { color: '#007AFF', fontWeight: 'bold' },
    switchContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginVertical: 20, padding: 10, backgroundColor: '#f0f4f7', borderRadius: 8 },
});

export default ProductFormScreen;