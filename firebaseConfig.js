import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { initializeAuth, getReactNativePersistence } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';

const firebaseConfig = {
  apiKey: "EXPO_PUBLIC_FIREBASE_API_KEY",
  authDomain: "closetly-f0b7c.firebaseapp.com",
  projectId: "closetly-f0b7c",
  storageBucket: "closetly-f0b7c.firebasestorage.app",
  messagingSenderId: "515510680815",
  appId: "1:515510680815:web:6942abca2992b171b72f1a"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const storage = getStorage(app);

// BU KISIM ÇOK ÖNEMLİ:
export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage)
});