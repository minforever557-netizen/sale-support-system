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

    } catch (err) {
      console.error("ROLE LOAD ERROR:", err);
    }

  });

});

import { db, auth } from "./firebase.js";
import {
  collection,
  query,
  where,
  getDocs,
  onSnapshot,
  orderBy,
  limit
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

// ==========================================================
// 1. ระบบจัดการ Notification (Real-time)
// ==========================================================
async function startNotificationSystem(role, email) {
    const notiDot = document.getElementById('noti-dot');
    const notiList = document.getElementById('noti-list');
    const notiBtn = document.getElementById('noti-btn');
    const notiDrop = document.getElementById('noti-dropdown');
    const clearBtn = document.getElementById('clear-all-noti');

    // ป้องกัน Error ถ้าหน้านั้นไม่มี Element กระดิ่ง (เช่นหน้า Login)
    if (!notiList) return;

    // ตั้งค่า Query ตาม Role
    const q = (role === 'admin') 
        ? query(collection(db, "tickets"), where("status", "==", "Pending"), orderBy("createdAt", "desc"), limit(5))
        : query(collection(db, "tickets"), where("ownerEmail", "==", email), orderBy("updatedAt", "desc"), limit(5));

    // Listen ข้อมูลใหม่แบบ Real-time
    onSnapshot(q, (snapshot) => {
        if (snapshot.empty) {
            notiList.innerHTML = `<div class="p-4 text-center text-slate-400 text-xs font-medium">ไม่มีการแจ้งเตือน</div>`;
            if (notiDot) notiDot.classList.add('hidden');
            return;
        }

        let html = "";
        let hasNewChange = false;

        snapshot.docChanges().forEach((change) => {
            const data = change.doc.data();
            const internetNo = data.id_number || data.internetNo || "ไม่ระบุเลข";
            const topic = data.topic || "ไม่มีหัวข้อ";

            // แจ้งเตือนเฉพาะเมื่อมีข้อมูลใหม่จริงๆ (ไม่ใช่จาก Cache)
            if (!snapshot.metadata.fromCache && (change.type === "added" || change.type === "modified")) {
                hasNewChange = true;
            }

            if (role === 'admin' && change.type === "added") {
                html += `
                    <div onclick="window.location.href='admin-management.html'" class="p-4 border-b border-slate-50 hover:bg-emerald-50 transition cursor-pointer group">
                        <div class="flex items-center gap-2 mb-1">
                            <span class="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
                            <span class="font-black text-emerald-600 text-[10px] uppercase">ใบงานใหม่เข้ามา</span>
                        </div>
                        <div class="font-bold text-slate-700 text-xs leading-tight">Internet No: ${internetNo}</div>
                        <div class="text-slate-500 text-[11px] mt-1 line-clamp-1">คุณ ${data.owner} เปิดใบงาน: ${topic}</div>
                    </div>`;
            } 
            else if (role !== 'admin' && change.type === "modified") {
                const theme = (data.status === "Success" || data.status === "In Progress") ? "emerald" : "blue";
                html += `
                    <div onclick="window.location.href='dashboard.html'" class="p-4 border-b border-slate-50 hover:bg-${theme}-50 transition cursor-pointer">
                        <div class="font-bold text-${theme}-600 text-[10px] mb-1">🔔 อัปเดตใบงาน!</div>
                        <div class="text-slate-700 font-bold text-[11px] leading-snug italic">"${topic}"</div>
                        <div class="text-slate-500 text-[10px] mt-1 italic">สถานะ: ${data.status} (No: ${internetNo})</div>
                    </div>`;
            }
        });

        if (html) notiList.innerHTML = html;
        if (hasNewChange && notiDot) notiDot.classList.remove('hidden');
    });

    // ระบบปุ่มกด และ Clear All
    if (notiBtn && notiDrop) {
        notiBtn.onclick = (e) => {
            e.stopPropagation();
            notiDrop.classList.toggle('hidden');
            if (notiDot) notiDot.classList.add('hidden');
        };

        if (clearBtn) {
            clearBtn.onclick = (e) => {
                e.stopPropagation();
                notiList.innerHTML = `<div class="p-4 text-center text-slate-400 text-xs italic">ล้างการแจ้งเตือนแล้ว</div>`;
                if (notiDot) notiDot.classList.add('hidden');
            };
        }
        window.addEventListener('click', () => notiDrop.classList.add('hidden'));
    }
}

// ==========================================================
// 2. ระบบ Role Check & เริ่มต้นระบบ (ผูกกับ Auth)
// ==========================================================
document.addEventListener("layoutLoaded", () => {
    onAuthStateChanged(auth, async (user) => {
        if (!user) return;

        try {
            // ดึง Role จากฐานข้อมูล
            const q = query(collection(db, "admin"), where("email", "==", user.email));
            const snap = await getDocs(q);

            if (snap.empty) {
                console.warn("User profile not found");
                return;
            }

            const userData = snap.docs[0].data();
            const role = (userData.role || "").toLowerCase();
            const adminMenu = document.getElementById("admin-menu-section");

            // แสดง/ซ่อน เมนู Admin
            if (adminMenu) {
                adminMenu.style.display = (role === "admin") ? "block" : "none";
            }

            // เริ่มระบบแจ้งเตือน
            startNotificationSystem(role, user.email);

        } catch (err) {
            console.error("SYSTEM LOAD ERROR:", err);
        }
    });
});
