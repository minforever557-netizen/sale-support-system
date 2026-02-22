import { db, auth } from "./firebase.js";
import {
  collection,
  query,
  where,
  getDocs
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

import {
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";


console.log("ROLE CHECK START");

// ================= HELPER : WAIT ELEMENT =================
function waitForElement(id, callback) {

  const el = document.getElementById(id);

  if (el) {
    callback();
    return;
  }

  const observer = new MutationObserver(() => {
    const el = document.getElementById(id);
    if (el) {
      observer.disconnect();
      callback();
    }
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
}

document.addEventListener("layoutLoaded", () => {

  onAuthStateChanged(auth, async (user) => {

    if (!user) return;

    try {

      // ✅ ไปอ่าน USER PROFILE จาก database
      const q = query(
        collection(db, "admin"), // ⭐ collection ที่เก็บ user profile
        where("email", "==", user.email)
      );

      const snap = await getDocs(q);

      if (snap.empty) {
        console.warn("User profile not found");
        return;
      }

      const userData = snap.docs[0].data();
      const role = (userData.role || "").toLowerCase();

      console.log("USER ROLE =", role);

      const adminMenu =
        document.getElementById("admin-menu-section");

      // ✅ เช็คจาก FIELD role โดยตรง
      if (role === "admin") {

        console.log("ADMIN MENU SHOW");

        if (adminMenu)
          adminMenu.style.display = "block";

      } else {

        console.log("NORMAL USER");

        if (adminMenu)
          adminMenu.style.display = "none";
      }
      

  // ================= START NOTIFICATION =================
waitForElement("noti-btn", () => {

  console.log("START NOTIFICATION");

  startNotificationSystem(role, user.email);

});

    } catch (err) {
      console.error("ROLE LOAD ERROR:", err);
    }

  });

});

// ==========================================================
// ส่วนที่เพิ่มใหม่: ระบบ Notification (ไม่กระทบ Script เดิม)
// ==========================================================
import { 
    onSnapshot, orderBy, limit 
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

async function startNotificationSystem(role, email) {
    const notiDot = document.getElementById('noti-dot');
    const notiList = document.getElementById('noti-list');
    const notiBtn = document.getElementById('noti-btn');
    const notiDrop = document.getElementById('noti-dropdown');

    if (!notiList) return; // ป้องกัน Error ถ้าหน้านั้นไม่มีปุ่มกระดิ่ง

    // 1. ตั้งค่า Query ตาม Role
    let q;
    if (role === 'admin') {
        // Admin: แจ้งเตือนเมื่อมีใบงานใหม่ (Pending)
        q = query(collection(db, "tickets"), where("status", "==", "Pending"), orderBy("createdAt", "desc"), limit(5));
    } else {
        // User/Sale/Support: แจ้งเตือนเมื่อใบงานตัวเองมีการอัปเดต
        q = query(collection(db, "tickets"), where("ownerEmail", "==", email), orderBy("updatedAt", "desc"), limit(5));
    }

    // 2. Listen แบบ Real-time
    onSnapshot(q, (snapshot) => {
        if (snapshot.empty) {
            notiList.innerHTML = `<div class="p-4 text-center text-slate-400 text-xs">ไม่มีการแจ้งเตือน</div>`;
            if (notiDot) notiDot.classList.add('hidden');
            return;
        }

        let html = "";
        let hasNewChange = false;

        snapshot.docChanges().forEach((change) => {
            const data = change.doc.data();
            
            if (role === 'admin' && change.type === "added") {
                hasNewChange = true;
                html += `
                    <div class="p-4 border-b border-slate-50 hover:bg-emerald-50/50 transition cursor-pointer">
                        <div class="font-bold text-emerald-600">🆕 ใบงานใหม่!</div>
                        <div class="text-slate-600 text-[11px] mt-1 line-clamp-2">คุณ ${data.owner} เปิดใบงาน: ${data.topic}</div>
                    </div>`;
            } 
            else if (role !== 'admin' && change.type === "modified") {
                hasNewChange = true;
                html += `
                    <div class="p-4 border-b border-slate-50 hover:bg-blue-50/50 transition cursor-pointer">
                        <div class="font-bold text-blue-600">🔔 อัปเดตใบงาน!</div>
                        <div class="text-slate-600 text-[11px] mt-1 line-clamp-2">${data.topic} ถูกเปลี่ยนเป็นสถานะ: ${data.status}</div>
                    </div>`;
            }
        });

        if (hasNewChange) {
            notiList.innerHTML = html || notiList.innerHTML; 
            if (notiDot) notiDot.classList.remove('hidden');
        }
    });

    // 3. ระบบเปิด/ปิด Dropdown
    if (notiBtn && notiDrop) {
        notiBtn.onclick = (e) => {
            e.stopPropagation();
            notiDrop.classList.toggle('hidden');
            if (notiDot) notiDot.classList.add('hidden');
        };
        // คลิกข้างนอกแล้วปิด
        window.addEventListener('click', () => notiDrop.classList.add('hidden'));
    }
}

// เชื่อมต่อระบบแจ้งเตือนเข้ากับ Auth ของ Script เดิม
document.addEventListener("layoutLoaded", () => {
    onAuthStateChanged(auth, async (user) => {
        if (!user) return;
        
        // รอให้ Database อ่าน Role เสร็จก่อน (ใช้ Query เหมือน Script เดิมเป๊ะ)
        const q = query(collection(db, "admin"), where("email", "==", user.email));
        const snap = await getDocs(q);
        if (!snap.empty) {
            const userData = snap.docs[0].data();
            const role = (userData.role || "").toLowerCase();
            // เริ่มการแจ้งเตือน
            startNotificationSystem(role, user.email);
        }
    });
});
