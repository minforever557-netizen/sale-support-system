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
    const notiDot = document.getElementById('noti-dot'); // ตัวเลขสีแดง
    const notiList = document.getElementById('noti-list');
    const notiBtn = document.getElementById('noti-btn');
    const notiDrop = document.getElementById('noti-dropdown');
    const clearAllBtn = document.getElementById('clear-all-noti'); // สมมติว่าปุ่ม Clear All มี ID นี้

    if (!notiList) return;

    let unreadCount = 0;

    // ฟังก์ชันอัปเดตตัวเลขแจ้งเตือน
    const updateBadge = () => {
        if (!notiDot) return;
        if (unreadCount > 0) {
            notiDot.innerText = unreadCount > 9 ? '9+' : unreadCount;
            notiDot.classList.remove('hidden');
        } else {
            notiDot.classList.add('hidden');
        }
    };

    // ฟังก์ชันตรวจสอบกล่องว่าง
    const checkEmpty = () => {
        if (notiList.children.length === 0) {
            notiList.innerHTML = `<div class="p-6 text-center text-slate-400 text-xs font-medium">ไม่มีรายการแจ้งเตือน</div>`;
        }
    };

    // ฟังก์ชันจัดการเมื่อกดอ่าน
    window.markAsRead = function(element) {
        if (element.classList.contains('is-unread')) {
            element.classList.remove('is-unread', 'bg-blue-50/80', 'bg-emerald-50/80');
            unreadCount = Math.max(0, unreadCount - 1);
            updateBadge();
        }
    };

    // 1. ตั้งค่า Query
    let q;
    if (role === 'admin') {
        q = query(collection(db, "tickets"), orderBy("createdAt", "desc"), limit(10));
    } else {
        q = query(collection(db, "tickets"), where("ownerEmail", "==", email), orderBy("updatedAt", "desc"), limit(10));
    }

    // 2. Listen แบบ Real-time
    onSnapshot(q, (snapshot) => {
        let html = "";
        let hasNewChange = false;

        snapshot.docChanges().forEach((change) => {
            const data = change.doc.data();
            const internetNo = data.internetNo || data.id_number || '-';
            const topic = data.topic || 'ไม่มีหัวข้อ';
            
            // แปลงเวลา
            const ts = (role === 'admin' ? data.createdAt : data.updatedAt);
            const timeStr = ts ? ts.toDate().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }) + " น." : "เมื่อสักครู่";

            if (change.type === "added") {
                // เช็คว่าต้องแจ้งเตือนไหม (Admin ทุกอันที่เพิ่ม / User เฉพาะที่ไม่อยู่ในสถานะ Pending)
                const shouldNotify = (role === 'admin') || (role !== 'admin' && data.status !== "Pending");

                if (shouldNotify) {
                    hasNewChange = true;
                    unreadCount++;
                    
                    const bgColor = role === 'admin' ? 'bg-emerald-50/80' : 'bg-blue-50/80';
                    const textColor = role === 'admin' ? 'text-emerald-600' : 'text-blue-600';
                    const targetPage = role === 'admin' ? 'user-management.html' : 'my-ticket.html';

                    html += `
                        <div onclick="markAsRead(this); window.location.href='${targetPage}'" 
                             class="p-4 border-b border-slate-50 transition cursor-pointer group is-unread ${bgColor} hover:bg-white">
                            <div class="flex justify-between items-start mb-1">
                                <div class="flex items-center gap-2 font-bold ${textColor}">
                                    <span class="w-2 h-2 ${role === 'admin' ? 'bg-emerald-500' : 'bg-blue-500'} rounded-full animate-pulse"></span>
                                    <span class="text-[13px]">${role === 'admin' ? 'ใบงานใหม่จาก Sale' : 'อัปเดตสถานะใบงาน'}</span>
                                </div>
                                <span class="text-[9px] text-slate-400 font-medium">${timeStr}</span>
                            </div>
                            <div class="text-slate-600 text-[11px] leading-relaxed">
                                <b>Internet No:</b> <span class="text-slate-900">${internetNo}</span><br>
                                ${role === 'admin' ? `<b>ผู้แจ้ง:</b> ${data.owner || 'ไม่ระบุชื่อ'}<br>` : ''}
                                <b>หัวข้อ:</b> ${topic}<br>
                                ${role !== 'admin' ? `<b>สถานะ:</b> <span class="text-orange-600 font-bold">${data.status}</span>` : ''}
                            </div>
                        </div>`;
                }
            }
        });

        if (hasNewChange) {
            if (notiList.innerText.includes("ไม่มีรายการ")) notiList.innerHTML = "";
            notiList.insertAdjacentHTML('afterbegin', html);
            updateBadge();
        }
    });

    // 3. ปุ่ม Clear All
    if (clearAllBtn) {
        clearAllBtn.onclick = (e) => {
            e.stopPropagation();
            notiList.innerHTML = "";
            unreadCount = 0;
            updateBadge();
            checkEmpty();
        };
    }

    // 4. ระบบเปิด/ปิด Dropdown
    if (notiBtn && notiDrop) {
        notiBtn.onclick = (e) => {
            e.stopPropagation();
            notiDrop.classList.toggle('hidden');
        };
        window.addEventListener('click', () => notiDrop.classList.add('hidden'));
    }
}
