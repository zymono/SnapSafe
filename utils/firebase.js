// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from 'firebase/firestore';
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDf2koiT_FLztT6f7-WhIlTkRNzWzrDudY",
  authDomain: "snapsafe-f3e5f.firebaseapp.com",
  projectId: "snapsafe-f3e5f",
  storageBucket: "snapsafe-f3e5f.firebasestorage.app",
  messagingSenderId: "211492511876",
  appId: "1:211492511876:web:a69454ae852943c68f62d1"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

const auth = getAuth(app);
const db = getFirestore(app);
export { auth, db }