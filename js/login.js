import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, setPersistence, browserLocalPersistence } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore, collection, query, where, getDocs } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// Firebase Config
const firebaseConfig = {
    apiKey: "AIzaSyAa2uSD_tjNqYE2eXnZcn75h_jAVscDG-c",
    authDomain: "salesupportsystemapp.firebaseapp.com",
    projectId: "salesupportsystemapp",
    storageBucket: "salesupportsystemapp.firebasestorage.app",
    messagingSenderId: "840890441207",
    appId: "1:840890441207:web:f3a5076d46e963a90de2f2"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const loginForm = document.getElementById('loginForm');
const loginBtn = document.getElementById('loginBtn');

loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const usernameInput = document.getElementById('username').value.trim();
    const passwordInput = document.getElementById('password').value;

    loginBtn.disabled = true;
    loginBtn.innerHTML = "กำลังตรวจสอบ...";

    try {
        // 1. ล้างข้อมูลระบบเก่า (localStorage) เพื่อป้องกันการขัดแย้ง
        localStorage.clear();

        // 2. ค้นหา Email จาก Username ใน Firestore
        const adminRef = collection(db, "admin");
        const q = query(adminRef, where("username", "==", usernameInput));
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
            alert("ไม่พบชื่อผู้ใช้งานนี้ในระบบ");
            resetBtn();
            return;
        }

        let userEmail = "";
        querySnapshot.forEach((doc) => {
            userEmail = doc.data().email;
        });

        // 3. ตั้งค่า Persistence ให้คงสถานะ Login ไว้แม้ปิด Browser (ช่วยแก้ปัญหาเด้ง)
        await setPersistence(auth, browserLocalPersistence);

        // 4. ล็อกอินด้วย Email
        await signInWithEmailAndPassword(auth, userEmail, passwordInput);
        
        // 5. ย้ายหน้าโดยใช้ replace (เพื่อไม่ให้กด Back กลับมาหน้า login ได้)
        window.location.replace("dashboard.html");

    } catch (error) {
        console.error("Login Error:", error);
        let message = "รหัสผ่านไม่ถูกต้อง หรือเกิดข้อผิดพลาด";
        if (error.code === 'auth/wrong-password') message = "รหัสผ่านไม่ถูกต้อง";
        if (error.code === 'auth/user-not-found') message = "ไม่พบผู้ใช้งานนี้";
        alert(message);
        resetBtn();
    }
});

function resetBtn() {
    loginBtn.disabled = false;
    loginBtn.innerHTML = "<span>เข้าสู่ระบบ</span>";
}
