import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCaVc7gopkyhLAFuZPNIFmE4A2oJHzc-4o",
  authDomain: "gakushoku-app.firebaseapp.com",
  projectId: "gakushoku-app",
  storageBucket: "gakushoku-app.firebasestorage.app",
  messagingSenderId: "798671791818",
  appId: "1:798671791818:web:3aa5e1206b0de6b997f633",
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);