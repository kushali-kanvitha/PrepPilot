import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyDuy5NNRp7EbcHfRDGNYpvDSmvpv_D6X8k",
  authDomain: "prepilot-fe5ce.firebaseapp.com",
  projectId: "prepilot-fe5ce",
  storageBucket: "prepilot-fe5ce.firebasestorage.app",
  messagingSenderId: "410463284353",
  appId: "1:410463284353:web:1d6a5c6c7dcfe8f405b180"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

