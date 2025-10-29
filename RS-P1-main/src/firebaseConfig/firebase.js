import { initializeApp } from "firebase/app";

import { getFirestore } from '@firebase/firestore'

const firebaseConfig = {
  apiKey: "AIzaSyCkdYNF1gtSINZ_jeng6UY3LjPC3DWu184",
  authDomain: "rs-p1-e0c68.firebaseapp.com",
  projectId: "rs-p1-e0c68",
  storageBucket: "rs-p1-e0c68.appspot.com",
  messagingSenderId: "832715682663",
  appId: "1:832715682663:web:f16047eca812b23b7135c2"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export default app;

export const db = getFirestore(app);
