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

// ==========================================================
// ส่วนที่เพิ่มใหม่: ระบบ Notification แบบ Global (แจ้งเตือนทุก Page)
// ==========================================================
import { 
    onSnapshot, orderBy, limit, collection, query, where, getDocs 
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

async function startNotificationSystem(role, email) {
    const notiDot = document.getElementById('notid-dot') || document.getElementById('noti-dot');
    const notiList = document.getElementById('noti-list');
    const notiBtn = document.getElementById('noti-btn');
    const notiDrop = document.getElementById('noti-dropdown');
    const clearBtn = document.getElementById('clear-all-noti');

    if (!notiList) return; 

    let q = (role === 'admin') 
        ? query(collection(db, "tickets"), where("status", "==", "Pending"), orderBy("createdAt", "desc"), limit(5))
        : query(collection(db, "tickets"), where("ownerEmail", "==", email), orderBy("updatedAt", "desc"), limit(5));

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
            const internetNo = data.id_number || data.internetNo || "ไม่ระบุเลข";
            
            if (!snapshot.metadata.fromCache && (change.type === "added" || change.type === "modified")) {
                hasNewChange = true;
            }

            if (role === 'admin' && change.type === "added") {
                html += `
                    <div onclick="window.location.href='admin-management.html'" class="p-4 border-b border-slate-50 hover:bg-emerald-50/50 transition cursor-pointer group">
                        <div class="font-bold text-emerald-600 text-[10px] mb-1">🆕 ใบงานใหม่!</div>
                        <div class="font-bold text-slate-700 text-xs leading-tight">Internet No: ${internetNo}</div>
                        <div class="text-slate-600 text-[11px] mt-1 line-clamp-2">คุณ ${data.owner} เปิดใบงาน: ${data.topic}</div>
                    </div>`;
            } 
            else if (role !== 'admin' && change.type === "modified") {
                html += `
                    <div onclick="window.location.href='dashboard.html'" class="p-4 border-b border-slate-50 hover:bg-blue-50/50 transition cursor-pointer">
                        <div class="font-bold text-blue-600 text-[10px] mb-1">🔔 อัปเดตใบงาน!</div>
                        <div class="text-slate-700 font-bold text-[11px] leading-snug italic">"${data.topic}"</div>
                        <div class="text-slate-600 text-[10px] mt-1">สถานะ: ${data.status} (No: ${internetNo})</div>
                    </div>`;
            }
        });

        if (html) notiList.innerHTML = html;
        if (hasNewChange && notiDot) notiDot.classList.remove('hidden');
    });

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

// ผูกระบบเข้ากับ Auth สถานะเดียว เพื่อให้รันได้ทุก Page
onAuthStateChanged(auth, async (user) => {
    if (!user) return;
    const q = query(collection(db, "admin"), where("email", "==", user.email));
    const snap = await getDocs(q);
    if (!snap.empty) {
        const userData = snap.docs[0].data();
        const role = (userData.role || "").toLowerCase();
        startNotificationSystem(role, user.email);
    }
});
