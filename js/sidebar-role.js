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
  arrayUnion,
  addDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

import {
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

console.log("ROLE CHECK & NOTIFICATION SYSTEM START");
// ฟังก์ชันบันทึก Log กิจกรรม
const createLog = async (userName, userEmail, actionType, details) => {
    try {
        await addDoc(collection(db, "logs"), {
            userName: userName || 'System',
            userEmail: userEmail || 'system@system.com',
            actionType: actionType,
            details: details,
            path: window.location.pathname.split('/').pop() || 'index.html',
            timestamp: serverTimestamp(),
            isError: actionType.includes('ERROR')
        });
    } catch (e) { console.error("Log error:", e); }
};
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
const pageTitle = document.title;
createLog(userData.name || user.email, user.email, 'PAGE_VIEW', `เข้าใช้งานหน้า ${pageTitle}`);

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

    // ✅ ฟังก์ชันอัปเดต Badge (นับจากฟิลด์ readBy ใน Firestore)
    const updateBadge = (currentDocs) => {
        const unreadItems = currentDocs.filter(docSnap => {
            const data = docSnap.data();
            const readBy = data.readBy || []; 
            return !readBy.includes(email); // ถ้าไม่มี email เรา แปลว่ายังไม่อ่าน
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

    // ✅ ฟังก์ชันเมื่อคลิกอ่าน (บันทึกลง Database ทันที)
    window.markAsRead = async function(docId, targetPage) {
    console.log("Marking as read:", docId); // เพิ่ม Log เช็คการทำงาน
    try {
        const ticketRef = doc(db, "tickets", docId);
        await updateDoc(ticketRef, {
            readBy: arrayUnion(email)
        });
    } catch (err) {
        console.error("Error updating read status:", err);
    }
    window.location.href = targetPage;
};

    // การ Query (Admin ดูงานใหม่ / User ดูงานอัปเดต)
    let q;
    if (role === 'admin') {
        q = query(collection(db, "tickets"), orderBy("createdAt", "desc"), limit(15));
    } else {
        q = query(collection(db, "tickets"), where("ownerEmail", "==", email), orderBy("updatedAt", "desc"), limit(15));
    }

    // Listen Real-time
    onSnapshot(q, (snapshot) => {
        let html = "";
        const allDocs = snapshot.docs;

        allDocs.forEach((docSnap) => {
            const data = docSnap.data();
            const docId = docSnap.id;
            const readBy = data.readBy || [];
            const isRead = readBy.includes(email); // เช็คการอ่านจาก Database

            const shouldNotify = (role === 'admin') || (role !== 'admin' && data.status && data.status !== "Pending");
if (!shouldNotify) return;

            const internetNo = data.internetNo || data.id_number || '-';
            const topic = data.topic || 'ไม่มีหัวข้อ';
            const ts = (role === 'admin' ? data.createdAt : data.updatedAt);
            const timeStr = ts ? ts.toDate().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }) + " น." : "";

            const unreadClass = isRead ? "bg-white" : (role === 'admin' ? "bg-emerald-50/60" : "bg-blue-50/60");
            const targetPage = role === 'admin' ? 'admin-manage.html' : 'my-ticket.html';

            html += `
                <div onclick="markAsRead('${docId}', '${targetPage}')" 
         class="p-4 border-b border-slate-50 transition cursor-pointer group ${unreadClass} hover:bg-slate-50 relative">
                    <div class="flex justify-between items-start mb-1">
                        <div class="flex items-center gap-2">
                            ${!isRead ? `<span class="w-2 h-2 ${role === 'admin' ? 'bg-emerald-500' : 'bg-blue-500'} rounded-full animate-pulse"></span>` : ''}
                            <span class="text-[13px] font-bold ${isRead ? 'text-slate-500' : (role === 'admin' ? 'text-emerald-600' : 'text-blue-600')}">
                                ${role === 'admin' ? 'ใบงานใหม่' : 'อัปเดตงาน'} ${internetNo}
                            </span>
                        </div>
                        <span class="text-[9px] text-slate-400 font-medium">${timeStr}</span>
                    </div>
                    <div class="text-[11px] ${isRead ? 'text-slate-400' : 'text-slate-600'} leading-relaxed pl-4">
                        <b>หัวข้อ:</b> ${topic}
                    </div>
                </div>`;
        });

        notiList.innerHTML = html || `<div class="p-6 text-center text-slate-400 text-xs font-medium">ไม่มีรายการแจ้งเตือน</div>`;
        updateBadge(allDocs);
    });

    // ✅ ปุ่ม Clear All (บันทึกทุกลายการลง Database ว่าอ่านแล้ว)
    if (clearAllBtn) {
        clearAllBtn.onclick = async (e) => {
            e.stopPropagation();
            const snap = await getDocs(q);
            const batchPromises = snap.docs.map(docSnap => {
                return updateDoc(doc(db, "tickets", docSnap.id), {
                    readBy: arrayUnion(email)
                });
            });
            await Promise.all(batchPromises);
        };
    }

    // ระบบเปิด-ปิด Dropdown
    if (notiBtn && notiDrop) {
        notiBtn.onclick = (e) => { e.stopPropagation(); notiDrop.classList.toggle('hidden'); };
        window.addEventListener('click', () => { if (!notiDrop.classList.contains('hidden')) notiDrop.classList.add('hidden'); });
    }
}
// ==========================================================
// 4. LOGOUT SYSTEM (เพิ่มใหม่)
// ==========================================================
document.addEventListener("click", async (e) => {
    // ตรวจสอบว่าคลิกที่ปุ่ม logoutBtn หรือ element ข้างในปุ่ม
    const logoutBtn = e.target.closest('#logoutBtn');
    
    if (logoutBtn) {
        e.preventDefault();

        // ใช้ SweetAlert2 แสดงการยืนยัน (นายโหลดไว้ในหน้า HTML แล้ว)
        const result = await Swal.fire({
            title: 'ยืนยันการออกจากระบบ?',
            text: "คุณต้องการออกจากเซสชันปัจจุบันหรือไม่",
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#10b981', // สี emerald-600
            cancelButtonColor: '#64748b', // สี slate-500
            confirmButtonText: 'ใช่, ออกจากระบบ',
            cancelButtonText: 'ยกเลิก',
            reverseButtons: true,
            customClass: {
                popup: 'rounded-[2.5rem]',
                confirmButton: 'rounded-xl px-6 py-3',
                cancelButton: 'rounded-xl px-6 py-3'
            }
        });

        if (result.isConfirmed) {
            try {
                // บันทึก Log ก่อนออก
                const user = auth.currentUser;
                if (user) {
                    await createLog(user.displayName || user.email, user.email, 'LOGOUT', 'ผู้ใช้งานออกจากระบบ');
                }

                // สั่ง Firebase Sign Out
                await auth.signOut();
                
                // เด้งไปหน้า Login
                window.location.replace("login.html");
            } catch (err) {
                console.error("Logout Error:", err);
                Swal.fire('เกิดข้อผิดพลาด', 'ไม่สามารถออกจากระบบได้', 'error');
            }
        }
    }
});
