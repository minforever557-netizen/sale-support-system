// ================= FIREBASE =================
import {
    getFirestore,
    collection,
    getDocs
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

import { app } from "./firebase-config.js";

const db = getFirestore(app);


// ================= LOGIN FUNCTION =================
window.login = async function () {

    const username = document.getElementById("username").value.trim();
    const password = document.getElementById("password").value.trim();

    if (!username || !password) {
        notify("กรุณากรอก Username และ Password", "error");
        return;
    }

    console.log("Login Clicked:", username);

    try {

        // 🔥 อ่าน collection admin
        const querySnapshot = await getDocs(collection(db, "admin"));

        let loginSuccess = false;

        querySnapshot.forEach((doc) => {

            const data = doc.data();   // ✅ FIX ERROR data is not defined

            // ตรวจสอบ username/password
            if (
                data.username === username &&
                data.password === password
            ) {
                loginSuccess = true;

                // ✅ เก็บ user session
                sessionStorage.setItem("user", JSON.stringify({
                    name: data.name,
                    email: data.email,
                    role: data.role,
                    username: data.username
                }));
            }
        });

        // ================= RESULT =================
        if (loginSuccess) {

            notify("Login สำเร็จ");

            setTimeout(() => {
                window.location.href = "dashboard.html";
            }, 800);

        } else {
            notify("Username หรือ Password ไม่ถูกต้อง", "error");
        }

    } catch (error) {
        console.error("LOGIN ERROR:", error);
        notify("ระบบเกิดข้อผิดพลาด", "error");
    }
};
