import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyDxBpf7We41Wf6Z0FVtLo9d1deHKJbU98o",
  authDomain: "xqboost.firebaseapp.com",
  projectId: "xqboost",
  storageBucket: "xqboost.firebasestorage.app",
  messagingSenderId: "1057795600078",
  appId: "1:1057795600078:web:51904afb7f3a9a9249ea9f",
  measurementId: "G-XW4X9T9PRZ"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
