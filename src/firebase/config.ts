import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getAnalytics } from 'firebase/analytics';

// Configuración de Firebase desde tu google-services.json
const firebaseConfig = {
  apiKey: "AIzaSyCqXtYV8C8z8Z24V58NLW-d7ZrbE_eRYQ0",
  authDomain: "ap-labs-55bce.firebaseapp.com",
  projectId: "ap-labs-55bce",
  storageBucket: "ap-labs-55bce.firebasestorage.app",
  messagingSenderId: "430493169677",
  appId: "1:430493169677:web:b9152a73a5b322df387d44",
  measurementId: "G-XXXXXXXXXX" // Opcional si usas Analytics
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);

// Exportar servicios
export const auth = getAuth(app);
export const db = getFirestore(app);
export const analytics = typeof window !== 'undefined' ? getAnalytics(app) : null;

export default app;
