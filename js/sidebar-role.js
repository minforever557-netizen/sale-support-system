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

  // ⭐ รอ DOM inject จาก Topbar / Sidebar ให้เสร็จก่อน
  setTimeout(() => {

    onAuthStateChanged(auth, async (user) => {

      if (!user) return;

      try {

        // ✅ อ่าน USER PROFILE
        const q = query(
          collection(db, "admin"),
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

        // =========================
        // SHOW / HIDE ADMIN MENU
        // =========================
        const adminMenu =
          document.getElementById("admin-menu-section");

        if (adminMenu) {
          if (role === "admin") {
            console.log("ADMIN MENU SHOW");
            adminMenu.style.display = "block";
          } else {
            console.log("NORMAL USER");
            adminMenu.style.display = "none";
          }
        }

        // =========================
        // START NOTIFICATION SYSTEM
        // =========================
        startNotificationSystem(role, user.email);

      } catch (err) {
        console.error("ROLE LOAD ERROR:", err);
      }

    });

  }, 300); // ⭐ สำคัญมาก (รอ layout render)
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

    if (!notiList) return; 

    let q;
    if (role === 'admin') {
        q = query(collection(db, "tickets"), orderBy("createdAt", "desc"), limit(10));
    } else {
        q = query(collection(db, "tickets"), where("ownerEmail", "==", email), orderBy("updatedAt", "desc"), limit(10));
    }

    onSnapshot(q, (snapshot) => {
        if (snapshot.empty) {
            if (notiList.innerHTML === "" || notiList.innerText.includes("ไม่มีรายการ")) {
                notiList.innerHTML = `<div class="p-6 text-center text-slate-400 text-xs font-medium">ไม่มีรายการแจ้งเตือน</div>`;
            }
            if (notiDot) notiDot.classList.add('hidden');
            return;
        }

        let html = "";
        let hasNewChange = false;

        snapshot.docChanges().forEach((change) => {
            const data = change.doc.data();
            
            // ✅ ประกาศตัวแปรตรงนี้ เพื่อให้ทั้ง Admin และ User เรียกใช้ได้ไม่พัง
            const internetNo = data.internetNo || data.id_number || '-';
            const topic = data.topic || 'ไม่มีหัวข้อ';

            // --- [ADMIN CASE] ---
            if (role === 'admin' && change.type === "added") {
                hasNewChange = true;
                html += `
                    <div onclick="window.location.href='user-management.html'" 
                         class="p-4 border-b border-slate-50 hover:bg-emerald-50/50 transition cursor-pointer group">
                        <div class="flex items-center gap-2 font-bold text-emerald-600 mb-1">
                            <span class="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
                            <span class="text-[13px]">ใบงานใหม่จาก Sale</span>
                        </div>
                        <div class="text-slate-600 text-[11px] leading-relaxed">
                            <b>Internet No:</b> <span class="text-slate-900">${internetNo}</span><br>
                            <b>ผู้แจ้ง:</b> ${data.owner || 'ไม่ระบุชื่อ'}<br>
                            <b>หัวข้อ:</b> ${topic}
                        </div>
                        <div class="text-[9px] text-slate-400 mt-2 italic text-right group-hover:text-emerald-500 transition-colors">คลิกเพื่อจัดการงาน</div>
                    </div>`;
            } 
            
            // --- [USER CASE] ---
            else if (role !== 'admin' && (change.type === "modified" || (change.type === "added" && data.status !== "Pending"))) {
                hasNewChange = true;
                html += `
                    <div onclick="window.location.href='my-ticket.html'" 
                         class="p-4 border-b border-slate-50 hover:bg-blue-50/50 transition cursor-pointer group">
                        <div class="flex items-center gap-2 font-bold text-blue-600 mb-1">
                            <i class="fas fa-bell text-[10px]"></i>
                            <span class="text-[13px]">อัปเดตสถานะใบงาน</span>
                        </div>
                        <div class="text-slate-600 text-[11px] leading-relaxed">
                            <b>Internet No:</b> <span class="text-slate-900">${internetNo}</span><br>
                            <b>หัวข้อ:</b> ${topic}<br>
                            <b>สถานะล่าสุด:</b> <span class="text-orange-600 font-bold">${data.status}</span>
                        </div>
                        <div class="text-[9px] text-blue-400 mt-2 font-medium italic text-right group-hover:underline">ดูรายละเอียดคลิกที่นี่</div>
                    </div>`;
            }
        });

        if (hasNewChange) {
            if (notiList.innerText.includes("ไม่มีรายการ")) {
                notiList.innerHTML = "";
            }
            notiList.insertAdjacentHTML('afterbegin', html);
            if (notiDot) notiDot.classList.remove('hidden');
        }
    });

    if (notiBtn && notiDrop) {
        notiBtn.onclick = (e) => {
            e.stopPropagation();
            notiDrop.classList.toggle('hidden');
            if (notiDot) notiDot.classList.add('hidden');
        };
        window.addEventListener('click', () => {
            if (!notiDrop.classList.contains('hidden')) {
                notiDrop.classList.add('hidden');
            }
        });
    }
}
