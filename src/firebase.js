import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Firebase web config is public by design (security comes from Firestore Rules,
// not from hiding these). Env vars are used when set, with a literal fallback so
// the app still boots if the host has no env vars configured.
const firebaseConfig = {
    apiKey: process.env.REACT_APP_FIREBASE_API_KEY || "AIzaSyCWAPj11h5NFw4xOuULvqR8F0WzJCrmecY",
    authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN || "agrivision-erp.firebaseapp.com",
    projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID || "agrivision-erp",
    storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET || "agrivision-erp.firebasestorage.app",
    messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID || "877686770216",
    appId: process.env.REACT_APP_FIREBASE_APP_ID || "1:877686770216:web:2dafa5745f2927a302431d"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export default app;