import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, setPersistence, browserLocalPersistence } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

let persistenceReady: Promise<void> | null = null;

function getFirebaseApp() {
  if (getApps().length === 0) {
    return initializeApp(firebaseConfig);
  }
  return getApp();
}

export const app = typeof window !== "undefined" ? getFirebaseApp() : null;
export const auth = typeof window !== "undefined" ? getAuth(getFirebaseApp()) : null;
export const db = typeof window !== "undefined" ? getFirestore(getFirebaseApp()) : null;
export const storage = typeof window !== "undefined" ? getStorage(getFirebaseApp()) : null;

export function getClientAuth() {
  if (!auth) throw new Error("Auth not initialized");
  if (!persistenceReady) {
    persistenceReady = setPersistence(auth, browserLocalPersistence).catch(() => {
      // Fallback: Firebase may already use local persistence by default
    });
  }
  return auth;
}

export async function ensureAuthPersistence(): Promise<void> {
  getClientAuth();
  if (persistenceReady) await persistenceReady;
}

export function getClientDb() {
  if (!db) throw new Error("Firestore not initialized");
  return db;
}

export function getClientStorage() {
  if (!storage) throw new Error("Storage not initialized");
  return storage;
}
