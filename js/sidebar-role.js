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
    const clearAllBtn = document.getElementById('clear-all-noti');

    if (!notiList) return;

    // 1. โหลดข้อมูล "รายการที่ลบไปแล้ว" หรือ "อ่านแล้ว" จาก LocalStorage
    // key จะแยกตาม email เพื่อไม่ให้ปนกันถ้าสลับ ID เครื่องเดียวกัน
    const storageKey = `read_noti_${email}`;
    let readIds = JSON.parse(localStorage.getItem(storageKey)) || [];

    const updateBadge = () => {
        if (!notiDot) return;
        // นับจำนวน div ที่มี class 'is-unread' จริงๆ ในหน้าจอ
        const unreadItems = notiList.querySelectorAll('.is-unread').length;
        if (unreadItems > 0) {
            notiDot.innerText = unreadItems > 9 ? '9+' : unreadItems;
            notiDot.classList.remove('hidden');
        } else {
            notiDot.classList.add('hidden');
        }
    };

    // ฟังก์ชันสำหรับบันทึกว่า "อ่าน/ลบ" แล้ว
    window.markAsRead = function(docId, element) {
        if (!readIds.includes(docId)) {
            readIds.push(docId);
            localStorage.setItem(storageKey, JSON.stringify(readIds));
        }
        if (element) {
            element.remove(); // ลบออกจาก List ทันทีเมื่อกด
            updateBadge();
            if (notiList.children.length === 0) {
                notiList.innerHTML = `<div class="p-6 text-center text-slate-400 text-xs font-medium">ไม่มีรายการแจ้งเตือน</div>`;
            }
        }
    };

    // 2. Query ข้อมูล
    let q;
    if (role === 'admin') {
        q = query(collection(db, "tickets"), orderBy("createdAt", "desc"), limit(15));
    } else {
        q = query(collection(db, "tickets"), where("ownerEmail", "==", email), orderBy("updatedAt", "desc"), limit(15));
    }

    // 3. Listen แบบ Real-time
    onSnapshot(q, (snapshot) => {
        let html = "";
        let hasNewData = false;

        snapshot.docs.forEach((doc) => {
            const data = doc.data();
            const docId = doc.id;

            // 🛑 ถ้า ID นี้ถูก Mark ว่าอ่าน/ลบไปแล้ว ไม่ต้องแสดงผล
            if (readIds.includes(docId)) return;

            const internetNo = data.internetNo || data.id_number || '-';
            const topic = data.topic || 'ไม่มีหัวข้อ';
            const ts = (role === 'admin' ? data.createdAt : data.updatedAt);
            const timeStr = ts ? ts.toDate().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }) + " น." : "เมื่อสักครู่";

            const shouldNotify = (role === 'admin') || (role !== 'admin' && data.status !== "Pending");

            if (shouldNotify) {
                hasNewData = true;
                const bgColor = role === 'admin' ? 'bg-emerald-50/80' : 'bg-blue-50/80';
                const targetPage = role === 'admin' ? 'user-management.html' : 'my-ticket.html';

                html += `
                    <div onclick="markAsRead('${docId}', this); window.location.href='${targetPage}'" 
                         class="p-4 border-b border-slate-50 transition cursor-pointer group is-unread ${bgColor} hover:bg-white">
                        <div class="flex justify-between items-start mb-1">
                            <div class="flex items-center gap-2 font-bold ${role === 'admin' ? 'text-emerald-600' : 'text-blue-600'}">
                                <span class="w-2 h-2 ${role === 'admin' ? 'bg-emerald-500' : 'bg-blue-500'} rounded-full animate-pulse"></span>
                                <span class="text-[13px]">${role === 'admin' ? 'ใบงานใหม่' : 'อัปเดตใบงาน'} ${internetNo}</span>
                            </div>
                            <span class="text-[9px] text-slate-400 font-medium">${timeStr}</span>
                        </div>
                        <div class="text-slate-600 text-[11px] leading-relaxed">
                            <b>หัวข้อ:</b> ${topic} ${role !== 'admin' ? `<br><b>สถานะ:</b> ${data.status}` : ''}
                        </div>
                    </div>`;
            }
        });

        notiList.innerHTML = html || `<div class="p-6 text-center text-slate-400 text-xs font-medium">ไม่มีรายการแจ้งเตือน</div>`;
        updateBadge();
    });

    // 4. ปุ่ม Clear All (เก็บ ID ทั้งหมดลง LocalStorage)
    if (clearAllBtn) {
        clearAllBtn.onclick = (e) => {
            e.stopPropagation();
            const allItems = snapshotQuery; // ใช้ snapshot ล่าสุด
            getDocs(q).then((snap) => {
                snap.docs.forEach(doc => {
                    if (!readIds.includes(doc.id)) readIds.push(doc.id);
                });
                localStorage.setItem(storageKey, JSON.stringify(readIds));
                notiList.innerHTML = `<div class="p-6 text-center text-slate-400 text-xs font-medium">ไม่มีรายการแจ้งเตือน</div>`;
                unreadCount = 0;
                updateBadge();
            });
        };
    }

    // 5. ระบบ Dropdown
    if (notiBtn && notiDrop) {
        notiBtn.onclick = (e) => { e.stopPropagation(); notiDrop.classList.toggle('hidden'); };
        window.addEventListener('click', () => notiDrop.classList.add('hidden'));
    }
}
