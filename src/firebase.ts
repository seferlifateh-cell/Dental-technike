/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signInWithRedirect, 
  signOut,
  onAuthStateChanged,
  User as FirebaseUser
} from 'firebase/auth';
import { 
  getFirestore, 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  deleteDoc, 
  updateDoc,
  writeBatch
} from 'firebase/firestore';

// Read config from Vite env variables or use non-crashing dummy keys
const metaEnv = (import.meta as any).env || {};
const firebaseConfig = {
  apiKey: metaEnv.VITE_FIREBASE_API_KEY || "",
  authDomain: metaEnv.VITE_FIREBASE_AUTH_DOMAIN || "",
  projectId: metaEnv.VITE_FIREBASE_PROJECT_ID || "",
  storageBucket: metaEnv.VITE_FIREBASE_STORAGE_BUCKET || "",
  messagingSenderId: metaEnv.VITE_FIREBASE_MESSAGING_SENDER_ID || "",
  appId: metaEnv.VITE_FIREBASE_APP_ID || ""
};

// Check if credentials are fully configured
export const isFirebaseConfigured = !!(
  firebaseConfig.apiKey &&
  firebaseConfig.projectId &&
  !firebaseConfig.apiKey.includes("dummy")
);

// Initialize Firebase App
const app = (getApps().length === 0 && isFirebaseConfigured)
  ? initializeApp(firebaseConfig)
  : (getApps().length > 0 ? getApp() : null);

export const auth = app ? getAuth(app) : null;
export const db = app ? getFirestore(app) : null;
export const googleProvider = new GoogleAuthProvider();

// Sign In with Google
export const signInWithGoogle = async () => {
  if (!auth) {
    throw new Error("Firebase is not fully configured yet. Please setup using the AI Studio sidebar!");
  }
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error: any) {
    console.warn("Popup blocked or failed, falling back to Google redirect...", error);
    try {
      await signInWithRedirect(auth, googleProvider);
    } catch (redirectError) {
      console.error("Firebase Authentication Error: ", redirectError);
      throw redirectError;
    }
  }
};

// Sign Out
export const logoutFirebase = async () => {
  if (auth) {
    await signOut(auth);
  }
};
