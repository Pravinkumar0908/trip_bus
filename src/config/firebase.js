// src/config/firebase.js
import { initializeApp } from "firebase/app";
import { getFirestore, doc, getDoc, collection, query, where, getDocs } from "firebase/firestore";
import { getAuth, RecaptchaVerifier, onAuthStateChanged, signOut } from "firebase/auth";
import { getStorage } from "firebase/storage";
import { getAnalytics } from "firebase/analytics";

// Your Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBxklh7cfRqRZ76ih1ohi1RlKrE_rwKgAE",
  authDomain: "tripeasy-1.firebaseapp.com",
  projectId: "tripeasy-1",
  storageBucket: "tripeasy-1.firebasestorage.app",
  messagingSenderId: "1095117404925",
  appId: "1:1095117404925:web:dcf46c058d0451ef0e5c94",
  measurementId: "G-VVWJ90DPRM"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize services
export const COLLECTIONS = {
  buses: 'buses',
  bookings: 'bookings',
  passengers: 'passengers',
  operators: 'operators',
  routes: 'routes',
  payments: 'payments',
  users: 'users' // Added users collection
};

export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);
export const analytics = getAnalytics(app);

// Export Firebase Auth functions
export { onAuthStateChanged, signOut, RecaptchaVerifier };

// Export Firestore functions
export { doc, getDoc, collection, query, where, getDocs };

export default app;
