import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getFunctions } from "firebase/functions";

const firebaseConfig = {
  apiKey: "AIzaSyCRKhcp_SHx3JhK9voZdLUEYjgDsd8UFS8",
  authDomain: "electro-12753.firebaseapp.com",
  projectId: "electro-12753",
  storageBucket: "electro-12753.appspot.com",
  messagingSenderId: "34147042347",
  appId: "1:34147042347:web:your-app-id" // Replace with actual appId from Firebase console
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const functions = getFunctions(app);
