// ================= FIREBASE IMPORT =================
import { initializeApp } from
"https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";

import {
  getFirestore,
  collection,
  getDocs
} from
"https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";


// ================= FIREBASE CONFIG =================
const firebaseConfig = {
  apiKey: "AIzaSyAa2uSD_tjNqYE2eXnZcn75h_jAVscDG-c",
  authDomain: "salesupportsystemapp.firebaseapp.com",
  projectId: "salesupportsystemapp",
  storageBucket: "salesupportsystemapp.firebasestorage.app",
  messagingSenderId: "840890441207",
  appId: "1:840890441207:web:f3a5076d46e963a90de2f2"
};


// ================= INITIALIZE =================
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);


// ================= EXPORT =================
export {
  db,
  collection,
  getDocs
};
