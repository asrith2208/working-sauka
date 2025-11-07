import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
// NEW IMPORTS FOR PERSISTENT AUTH
import { initializeAuth, getReactNativePersistence } from 'firebase/auth';
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';

const firebaseConfig = {
  apiKey: "AIzaSyBsA-Cx67ASCsH8GNlwkWYf2gi5w2taqKk",
  authDomain: "saflo-6e13a.firebaseapp.com",
  projectId: "saflo-6e13a",
  storageBucket: "saflo-6e13a.firebasestorage.app",
  messagingSenderId: "1093559246055",
  appId: "1:1093559246055:web:d59da92e4cb23f11705642",
  measurementId: "G-S4VTJZQ5V1"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Initialize Firebase Auth with persistence
const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(ReactNativeAsyncStorage)
});
const storage = getStorage(app); // ADD THIS

export { auth, db, storage }

