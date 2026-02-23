// ==========================================================
// 1. IMPORT (รวมไว้ที่เดียว ป้องกันการเรียกซ้ำซ้อน)
// ==========================================================
import { db, auth } from "./firebase.js";
import {
  collection,
  query,
  where,
  getDocs,
  onSnapshot,
  orderBy,
  limit,
  doc,
  updateDoc,
  arrayUnion
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

import {
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

console.log("ROLE CHECK & NOTIFICATION SYSTEM START");

// ==========================================================
// 2. MAIN CONTROL (จัดการเรื่อง Role และการเรียก Notification)
// ==========================================================
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

        // SHOW / HIDE ADMIN MENU
        const adminMenu = document.getElementById("admin-menu-section");
        if (adminMenu) {
          adminMenu.style.display = (role === "admin") ? "block" : "none";
        }

        // START NOTIFICATION SYSTEM (ส่ง email ไปด้วยเพื่อเช็คการอ่าน)
        startNotificationSystem(role, user.email);

      } catch (err) {
        console.error("ROLE LOAD ERROR:", err);
      }
    });
  }, 300); 
});

// ==========================================================
// 3. NOTIFICATION SYSTEM (Logic ใหม่: บันทึกการอ่านลง Database)
// ==========================================================
async function startNotificationSystem(role, email) {
    const notiDot = document.getElementById('noti-dot');
    const notiList = document.getElementById('noti-list');
    const notiBtn = document.getElementById('noti-btn');
    const notiDrop = document.getElementById('noti-dropdown');
    const clearAllBtn = document.getElementById('clear-all-noti');

    if (!notiList || !notiDot) return; 

    // ✅ 1. ฟังก์ชันนับ Badge (อ่านจาก Firestore เท่านั้น)
    const updateBadge = (currentDocs) => {
        const unreadItems = currentDocs.filter(docSnap => {
            const data = docSnap.data();
            const readBy = data.readBy || []; // ถ้าไม่มีฟิลด์นี้ ให้เป็น Array ว่าง
            return !readBy.includes(email);   // ถ้าไม่มี Email เรา = ยังไม่อ่าน
        });
        const count = unreadItems.length;

        if (count > 0) {
            notiDot.innerText = count > 9 ? '9+' : count;
            notiDot.className = "absolute -top-1 -right-1 bg-red-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] h-[18px] flex items-center justify-center border-2 border-white shadow-sm";
            notiDot.classList.remove('hidden');
        } else {
            notiDot.classList.add('hidden');
        }
    };

    // ✅ 2. ฟังก์ชันคลิกอ่าน (บันทึก Email ลง Database)
    window.markAsRead = async (docId, targetPage) => {
        try {
            const ticketRef = doc(db, "tickets", docId);
            await updateDoc(ticketRef, {
                readBy: arrayUnion(email) // Rules ใหม่ 'if true' จะยอมให้เขียนทันที
            });
        } catch (err) {
            console.error("Update Error:", err);
        }
        window.location.href = targetPage;
    };

    // 3. Query (เหมือนเดิม)
    let q = (role === 'admin') 
        ? query(collection(db, "tickets"), orderBy("createdAt", "desc"), limit(15))
        : query(collection(db, "tickets"), where("ownerEmail", "==", email), orderBy("updatedAt", "desc"), limit(15));

    // 4. Real-time Listen
    onSnapshot(q, (snapshot) => {
        let html = "";
        snapshot.docs.forEach((docSnap) => {
            const data = docSnap.data();
            const readBy = data.readBy || [];
            const isRead = readBy.includes(email); // เช็คจาก DB

            if (role !== 'admin' && data.status === "Pending") return;

            const internetNo = data.internetNo || data.id_number || '-';
            const unreadClass = isRead ? "bg-white" : (role === 'admin' ? "bg-emerald-50/60" : "bg-blue-50/60");
            const targetPage = role === 'admin' ? 'user-management.html' : 'my-ticket.html';

            html += `
                <div onclick="markAsRead('${docSnap.id}', '${targetPage}')" 
                     class="p-4 border-b border-slate-50 transition cursor-pointer ${unreadClass} hover:bg-slate-50 relative">
                    <div class="flex justify-between items-start mb-1">
                        <div class="flex items-center gap-2">
                            ${!isRead ? `<span class="w-2 h-2 ${role === 'admin' ? 'bg-emerald-500' : 'bg-blue-500'} rounded-full animate-pulse"></span>` : ''}
                            <span class="text-[13px] font-bold ${isRead ? 'text-slate-500' : (role === 'admin' ? 'text-emerald-600' : 'text-blue-600')}">
                                ${role === 'admin' ? 'ใบงานใหม่' : 'อัปเดตงาน'} ${internetNo}
                            </span>
                        </div>
                    </div>
                    <div class="text-[11px] text-slate-500">หัวข้อ: ${data.topic || 'ไม่มีหัวข้อ'}</div>
                </div>`;
        });
        notiList.innerHTML = html || `<div class="p-6 text-center text-slate-400 text-xs">ไม่มีรายการ</div>`;
        updateBadge(snapshot.docs);
    });

    // ✅ 5. ปุ่ม Clear All (เขียน Email ลงทุกใบงานใน Database)
    if (clearAllBtn) {
        clearAllBtn.onclick = async (e) => {
            e.stopPropagation();
            const snap = await getDocs(q);
            const promises = snap.docs.map(d => updateDoc(doc(db, "tickets", d.id), { readBy: arrayUnion(email) }));
            await Promise.all(promises);
        };
    }
}
