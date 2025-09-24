// lib/firebase.ts - FIXED VERSION

import { initializeApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getFunctions } from "firebase/functions"; // ADD THIS

// 🚨 CRITICAL FIX: Validate environment variables before using them
const requiredEnvVars = {
  NEXT_PUBLIC_FIREBASE_API_KEY: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  NEXT_PUBLIC_FIREBASE_PROJECT_ID: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  NEXT_PUBLIC_FIREBASE_APP_ID: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Check for missing environment variables
const missingVars = Object.entries(requiredEnvVars)
  .filter(([key, value]) => !value)
  .map(([key]) => key);

if (missingVars.length > 0) {
  const errorMessage = `Missing required Firebase environment variables: ${missingVars.join(', ')}`;
  console.error('🔥 Firebase Configuration Error:', errorMessage);
  
  if (typeof window !== 'undefined') {
    // Client-side: Show user-friendly error
    alert('Application configuration error. Please contact support.');
  }
  
  throw new Error(errorMessage);
}

// Now safely create the config object
const firebaseConfig = {
  apiKey: requiredEnvVars.NEXT_PUBLIC_FIREBASE_API_KEY!,
  authDomain: requiredEnvVars.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN!,
  projectId: requiredEnvVars.NEXT_PUBLIC_FIREBASE_PROJECT_ID!,
  storageBucket: requiredEnvVars.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET!,
  messagingSenderId: requiredEnvVars.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID!,
  appId: requiredEnvVars.NEXT_PUBLIC_FIREBASE_APP_ID!,
};

// Initialize Firebase
const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const functions = getFunctions(app); // ADD THIS EXPORT

// Export config for debugging (only in development)
if (process.env.NODE_ENV === 'development') {
  console.log('🔥 Firebase initialized successfully:', {
    projectId: firebaseConfig.projectId,
    authDomain: firebaseConfig.authDomain,
  });
}