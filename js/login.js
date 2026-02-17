// ================= LOGIN =================
import {
  getFirestore,
  collection,
  getDocs
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

import {
  getAuth,
  signOut
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

import { app } from "./firebase-config.js";

const db = getFirestore(app);
const auth = getAuth(app);

// ===== LOGIN BUTTON =====
window.login = async function () {

  const username = document.getElementById("username").value;
  const password = document.getElementById("password").value;

  console.log("Login Clicked:", username);

  const querySnapshot = await getDocs(collection(db, "admin"));

  let loginSuccess = false;

  querySnapshot.forEach((doc) => {

    const data = doc.data();   // ✅ สำคัญมาก

    if (
      data.username === username &&
      data.password === password
    ) {

      loginSuccess = true;

      // ✅ save session
      localStorage.setItem("user", JSON.stringify(data));

      window.location.href = "dashboard.html";
    }
  });

  if (!loginSuccess) {
    alert("Username หรือ Password ไม่ถูกต้อง");
  }
};
