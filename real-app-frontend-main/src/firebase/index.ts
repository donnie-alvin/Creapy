// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: "mern-real-estate-26a4e.firebaseapp.com",
  projectId: "mern-real-estate-26a4e",
  storageBucket: "mern-real-estate-26a4e.firebasestorage.app",
  messagingSenderId: "108972766412",
  appId: "1:108972766412:web:c75dc26378696a3ac8be69",
  measurementId: "G-M089PX98LK",
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);
