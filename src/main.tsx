import { createRoot } from 'react-dom/client'
import { initializeApp } from 'firebase/app'
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore'
import { getAuth, connectAuthEmulator } from 'firebase/auth'
import App from './App.tsx'
import './index.css'

console.log('Starting Firebase initialization...');

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDk27T1Nj6chXTNuG3K6zpUrl0Bvg6J-FE",
  authDomain: "non-profit-web-platform.firebaseapp.com",
  projectId: "non-profit-web-platform",
  storageBucket: "non-profit-web-platform.firebasestorage.app",
  messagingSenderId: "866086096595",
  appId: "1:866086096595:web:ee5482157e9a0600ff8e26",
  measurementId: "G-TPSQJ2T3NK"
};

console.log('Firebase config loaded:', { projectId: firebaseConfig.projectId });

let db;
let auth;

try {
  // Initialize Firebase
  console.log('Initializing Firebase app...');
  const app = initializeApp(firebaseConfig);
  console.log('Firebase app initialized successfully');
  
  console.log('Initializing Firestore...');
  db = getFirestore(app);
  console.log('Firestore initialized successfully');

  console.log('Initializing Firebase Auth...');
  auth = getAuth(app);
  console.log('Firebase Auth initialized successfully');

  // If we're in development, try to make a test query
  if (process.env.NODE_ENV === 'development') {
    console.log('Running in development mode');
    // We'll leave the actual test query to the components to avoid
    // making unnecessary queries at startup
  }
} catch (error) {
  console.error('Error during Firebase initialization:', error);
  throw error;
}

export { db, auth };

createRoot(document.getElementById("root")!).render(<App />);
