import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
    apiKey: "AIzaSyCsUhBsWjZfQuJo5lgprYt3xikQUyf8iiw",
    authDomain: "sale-support-system.firebaseapp.com",
    projectId: "sale-support-system",
    storageBucket: "sale-support-system.appspot.com",
    messagingSenderId: "640337786680",
    appId: "1:640337786680:web:fd80699ac291b8d7a7b3cd"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
