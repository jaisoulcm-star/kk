import { initializeApp } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  signOut,
} from "firebase/auth";
import {
  initializeFirestore,
  getFirestore,
  doc,
  getDocFromServer,
  persistentLocalCache,
  persistentMultipleTabManager,
  memoryLocalCache,
} from "firebase/firestore";
import firebaseConfigJson from "../firebase-applet-config.json";

// Dynamic configuration matching both local development and Netlify environment variables
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || firebaseConfigJson.apiKey,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || firebaseConfigJson.authDomain,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || firebaseConfigJson.projectId,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || firebaseConfigJson.storageBucket,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || firebaseConfigJson.messagingSenderId,
  appId: import.meta.env.VITE_FIREBASE_APP_ID || firebaseConfigJson.appId,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || firebaseConfigJson.measurementId || "",
  firestoreDatabaseId: import.meta.env.VITE_FIREBASE_DATABASE_ID || firebaseConfigJson.firestoreDatabaseId || "",
};

const app = initializeApp(firebaseConfig);

// Initialize Firestore with robust fallbacks to handle blocked third-party storage/IndexedDB in sandboxed environments
let firestoreDb;
try {
  firestoreDb = initializeFirestore(app, {
    localCache: persistentLocalCache({
      tabManager: persistentMultipleTabManager(),
    }),
    experimentalForceLongPolling: true,
  }, firebaseConfig.firestoreDatabaseId);
} catch (error) {
  console.warn("Firestore persistent local cache failed to initialize (often caused by sandboxed iframe tracking protection). Falling back to memory cache.", error);
  try {
    firestoreDb = initializeFirestore(app, {
      localCache: memoryLocalCache(),
      experimentalForceLongPolling: true,
    }, firebaseConfig.firestoreDatabaseId);
  } catch (fallbackError) {
    console.error("Firestore custom initialization failed completely. Falling back to default getFirestore.", fallbackError);
    firestoreDb = getFirestore(app, firebaseConfig.firestoreDatabaseId);
  }
}

export const db = firestoreDb;

export const auth = getAuth(app);

// Dedicated Google Auth Provider without intrusive scopes by default
export const createGoogleProvider = (withSheets: boolean = false) => {
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: "select_account" });
  if (withSheets) {
    provider.addScope("https://www.googleapis.com/auth/spreadsheets");
  }
  return provider;
};

export const googleProvider = createGoogleProvider(false);

export const signInWithGoogle = async (requestSheetsScope: boolean = false) => {
  try {
    const provider = createGoogleProvider(requestSheetsScope);
    const result = await signInWithPopup(auth, provider);
    return result;
  } catch (error: any) {
    if (error.code === "auth/popup-closed-by-user") {
      console.log("User closed the login popup.");
      return null;
    }
    console.error("Google Sign-In Error:", error);
    throw error;
  }
};

export const signInWithEmail = async (email: string, password: string) => {
  return await signInWithEmailAndPassword(auth, email.trim(), password);
};

export const signUpWithEmail = async (
  email: string,
  password: string,
  displayName?: string
) => {
  const userCredential = await createUserWithEmailAndPassword(auth, email.trim(), password);
  if (displayName && userCredential.user) {
    try {
      await updateProfile(userCredential.user, { displayName: displayName.trim() });
    } catch (e) {
      console.warn("Could not update user display name:", e);
    }
  }
  return userCredential;
};

export const logout = () => signOut(auth);

// CRITICAL CONSTRAINT: Test connection on boot
const testConnection = async () => {
  try {
    await getDocFromServer(doc(db, "test", "connection"));
  } catch (error) {
    if (
      error instanceof Error &&
      error.message.includes("the client is offline")
    ) {
      console.warn("Firebase client is operating in offline mode. Local cached store will be used as a robust fallback.");
    }
  }
};
testConnection();
