import { auth, sendPasswordResetEmail } from "./firebase.js";

const form = document.getElementById("forgotForm");
const message = document.getElementById("message");

form?.addEventListener("submit", async (e) => {
  e.preventDefault();
  const email = document.getElementById("email").value.trim();
  try {
    await sendPasswordResetEmail(auth, email);
    message.textContent = "ส่งลิงก์รีเซ็ตเรียบร้อยแล้ว";
    message.className = "text-green-700 text-sm mt-4";
  } catch (error) {
    message.textContent = "ไม่สำเร็จ: " + error.message;
    message.className = "text-red-600 text-sm mt-4";
  }
});
