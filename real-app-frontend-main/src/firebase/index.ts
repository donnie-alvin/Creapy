// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: "real-app-storage.firebaseapp.com",
  projectId: "real-app-storage",
  storageBucket: "real-app-storage.firebasestorage.app",
  messagingSenderId: "737656282141",
  appId: "1:737656282141:web:3fd0cea5c7f1a4a765baf4",
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);
