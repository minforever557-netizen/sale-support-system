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

    if (!notiList || !notiDot) return; // ป้องกัน Error null

    // 1. โหลด ID ที่อ่านแล้วจาก LocalStorage
    const storageKey = `read_noti_${email}`;
    let readIds = JSON.parse(localStorage.getItem(storageKey)) || [];

    // ฟังก์ชันอัปเดต Badge ตัวเลขสีแดง (นับจากรายการที่ไม่อยู่ใน readIds)
    const updateBadge = (currentDocs) => {
        // กรองเฉพาะอันที่ยังไม่อ่าน
        const unreadItems = currentDocs.filter(doc => !readIds.includes(doc.id));
        const count = unreadItems.length;

        if (count > 0) {
            notiDot.innerText = count > 9 ? '9+' : count;
            // ปรับ Style ให้เป็นวงกลมสีแดงชัดเจน
            notiDot.className = "absolute -top-1 -right-1 bg-red-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] h-[18px] flex items-center justify-center border-2 border-white shadow-sm";
            notiDot.classList.remove('hidden');
        } else {
            notiDot.classList.add('hidden');
        }
    };

    // ฟังก์ชันกดอ่าน (ย้าย ID เข้า LocalStorage และลบ Highlight)
    window.markAsRead = function(docId, targetPage) {
        if (!readIds.includes(docId)) {
            readIds.push(docId);
            localStorage.setItem(storageKey, JSON.stringify(readIds));
        }
        // เปลี่ยนหน้าไปยัง URL เป้าหมาย
        window.location.href = targetPage;
    };

    // 2. ตั้งค่า Query
    let q;
    if (role === 'admin') {
        q = query(collection(db, "tickets"), orderBy("createdAt", "desc"), limit(15));
    } else {
        q = query(collection(db, "tickets"), where("ownerEmail", "==", email), orderBy("updatedAt", "desc"), limit(15));
    }

    // 3. Listen แบบ Real-time
    onSnapshot(q, (snapshot) => {
        let html = "";
        const allDocs = snapshot.docs;

        allDocs.forEach((doc) => {
            const data = doc.data();
            const docId = doc.id;
            const isRead = readIds.includes(docId);

            // เงื่อนไขการโชว์แจ้งเตือน
            const shouldNotify = (role === 'admin') || (role !== 'admin' && data.status !== "Pending");
            if (!shouldNotify) return;

            const internetNo = data.internetNo || data.id_number || '-';
            const topic = data.topic || 'ไม่มีหัวข้อ';
            const ts = (role === 'admin' ? data.createdAt : data.updatedAt);
            const timeStr = ts ? ts.toDate().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }) + " น." : "";

            // UI: ถ้ายังไม่อ่าน ให้มี Highlight สีฟ้า/เขียว และมีจุด Dot เล็กๆ
            const unreadClass = isRead ? "bg-white" : (role === 'admin' ? "bg-emerald-50/60" : "bg-blue-50/60");
            const targetPage = role === 'admin' ? 'user-management.html' : 'my-ticket.html';

            html += `
                <div onclick="markAsRead('${docId}', '${targetPage}')" 
                     class="p-4 border-b border-slate-50 transition cursor-pointer group ${unreadClass} hover:bg-slate-50">
                    <div class="flex justify-between items-start mb-1">
                        <div class="flex items-center gap-2">
                            ${!isRead ? `<span class="w-2 h-2 ${role === 'admin' ? 'bg-emerald-500' : 'bg-blue-500'} rounded-full"></span>` : ''}
                            <span class="text-[13px] font-bold ${isRead ? 'text-slate-500' : (role === 'admin' ? 'text-emerald-600' : 'text-blue-600')}">
                                ${role === 'admin' ? 'ใบงานใหม่' : 'อัปเดตงาน'} ${internetNo}
                            </span>
                        </div>
                        <span class="text-[9px] text-slate-400">${timeStr}</span>
                    </div>
                    <div class="text-[11px] ${isRead ? 'text-slate-400' : 'text-slate-600'} leading-relaxed">
                        <b>หัวข้อ:</b> ${topic}
                    </div>
                </div>`;
        });

        notiList.innerHTML = html || `<div class="p-6 text-center text-slate-400 text-xs font-medium">ไม่มีรายการแจ้งเตือน</div>`;
        updateBadge(allDocs);
    });

    // 4. ปุ่ม Clear All
    if (clearAllBtn) {
        clearAllBtn.onclick = async (e) => {
            e.stopPropagation();
            const snap = await getDocs(q);
            snap.docs.forEach(doc => {
                if (!readIds.includes(doc.id)) readIds.push(doc.id);
            });
            localStorage.setItem(storageKey, JSON.stringify(readIds));
            // ตัวเลขจะลดและ List จะหาย Highlight อัตโนมัติจาก onSnapshot
        };
    }
}
