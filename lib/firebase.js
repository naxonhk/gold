// lib/firebase.js
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyDTAQgCvZO7Q9Y9A2rSWf0HL1uyA0iJwj4",
  authDomain: "gold-6b24b.firebaseapp.com",
  projectId: "gold-6b24b",
  storageBucket: "gold-6b24b.firebasestorage.app",
  messagingSenderId: "1095159481868",
  appId: "1:1095159481868:web:af30df2ff4cc0427e05029"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
