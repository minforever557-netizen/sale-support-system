import {
  auth,
  db,
  collection,
  getDocs,
  query,
  where,
  signInWithEmailAndPassword
} from "./firebase.js";

const form = document.getElementById("loginForm");
const message = document.getElementById("message");

form?.addEventListener("submit", async (e) => {
  e.preventDefault();
  const username = document.getElementById("username").value.trim();
  const password = document.getElementById("password").value;

  if (password.length < 4) {
    message.textContent = "Password ต้องมีอย่างน้อย 4 ตัว";
    message.className = "text-red-600 text-sm mt-4";
    return;
  }

  try {
    const userQ = query(collection(db, "users"), where("username", "==", username));
    const snap = await getDocs(userQ);
    if (snap.empty) throw new Error("ไม่พบ username");

    const userData = snap.docs[0].data();
    await signInWithEmailAndPassword(auth, userData.email, password);
    localStorage.setItem("profile", JSON.stringify({ id: snap.docs[0].id, ...userData }));
    window.location.href = "app.html";
  } catch (error) {
    message.textContent = "เข้าสู่ระบบไม่สำเร็จ: " + error.message;
    message.className = "text-red-600 text-sm mt-4";
  }
});
