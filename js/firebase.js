// Firebase SDK (ESM VERSION)
import { initializeApp } from
"https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";

import { getAuth }
from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

import { getFirestore }
from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyAa2uSD_tjNqYE2eXnZcn75h_jAVscDG-c",
  authDomain: "salesupportsystemapp.firebaseapp.com",
  projectId: "salesupportsystemapp",
  storageBucket: "salesupportsystemapp.firebasestorage.app",
  messagingSenderId: "840890441207",
  appId: "1:840890441207:web:f3a5076d46e963a90de2f2"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
