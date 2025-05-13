// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getDatabase, push, ref, set, update } from "firebase/database";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  getFirestore,
  updateDoc,
} from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBRjB62lEsSL8J8eXCPILoPVDTqT2OXuHk",
  authDomain: "imagetoexcel-1.firebaseapp.com",
  projectId: "imagetoexcel-1",
  storageBucket: "imagetoexcel-1.firebasestorage.app",
  messagingSenderId: "809508927736",
  appId: "1:809508927736:web:075cf6c4e1ea3aab76630d",
  measurementId: "G-MWPNSSLCM7"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
// Initialize Firestore
const db = getFirestore(app);
// Initialize Realtime Database
const realtimeDb = getDatabase(app);
// Initialize Firebase Authentication and set persistence
const auth = getAuth(app);

export {
  addDoc,
  auth,
  collection, db, deleteDoc, doc,
  getDoc, getDocs, push, realtimeDb, ref,
  set, update, updateDoc
};
