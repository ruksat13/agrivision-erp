import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
    apiKey: "AIzaSyCWAPj11h5NFw4xOuULvqR8F0WzJCrmecY",
    authDomain: "agrivision-erp.firebaseapp.com",
    projectId: "agrivision-erp",
    storageBucket: "agrivision-erp.firebasestorage.app",
    messagingSenderId: "877686770216",
    appId: "1:877686770216:web:2dafa5745f2927a302431d"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export default app;