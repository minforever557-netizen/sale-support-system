import { db } from './firebase-config.js'; 
import { 
    collection, 
    query, 
    where, 
    onSnapshot, 
    orderBy 
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// ฟังก์ชันหลักในการดึงงานสถานะ Open และ Pending
function fetchAdminTickets() {
    const ticketListContainer = document.getElementById('admin-ticket-list');
    const noDataMsg = document.getElementById('no-data-msg');
    const pendingStat = document.getElementById('stat-pending');
    const progressStat = document.getElementById('stat-progress');
    const closedStat = document.getElementById('stat-closed');

    try {
        // 1. สร้าง Query ดึงงาน (ลดความซับซ้อนเพื่อป้องกันการโหลดค้าง)
        // หมายเหตุ: ใช้ 'status' ให้ตรงกับที่เก็บใน Firestore (Case-sensitive)
        const q = query(
            collection(db, "tickets"), 
            orderBy("createdAt", "desc") // เรียงจากใหม่ไปเก่า
        );

        // 2. ใช้ onSnapshot เพื่อดึงข้อมูลแบบ Real-time
        onSnapshot(q, (querySnapshot) => {
            let ticketsHTML = "";
            let countPending = 0;
            let countProgress = 0;
            let countClosed = 0;

            if (querySnapshot.empty) {
                ticketListContainer.innerHTML = "";
                noDataMsg.classList.remove('hidden');
                updateStats(0, 0, 0);
                return;
            }

            querySnapshot.forEach((doc) => {
                const data = doc.data();
                const status = data.status || 'Open';

                // นับจำนวน Stat สำหรับ Dashboard Admin
                if (status === 'Pending' || status === 'Open') countPending++;
                if (status === 'On Progress') countProgress++;
                if (status === 'Success') countClosed++;

                // เลือกแสดงเฉพาะงานที่ 'Pending' หรือ 'Open' ในตารางงานรอรับเรื่อง
                if (status === 'Pending' || status === 'Open') {
                    ticketsHTML += `
                        <tr class="hover:bg-slate-50 transition-colors border-b border-slate-50">
                            <td class="p-6 text-center">
                                ${data.priority === 'Urgent' ? 
                                    `<span class="relative flex h-3 w-3 mx-auto">
                                        <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                        <span class="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                                    </span>` : `<span class="text-slate-300">-</span>`}
                            </td>
                            <td class="p-6">
                                <div class="font-bold text-slate-800">${data.customerName || 'ไม่ระบุ'}</div>
                                <div class="text-xs text-slate-400">${data.internetNo || '-'}</div>
                            </td>
                            <td class="p-6">
                                <div class="text-sm text-slate-600 font-medium">${data.subject || 'ไม่มีหัวข้อ'}</div>
                                <div class="text-[10px] text-indigo-500 font-black uppercase mt-1">SLA: ${data.slaTime || '24H'}</div>
                            </td>
                            <td class="p-6 text-center">
                                <span class="px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-[10px] font-black uppercase border border-blue-100 shadow-sm">
                                    ${status}
                                </span>
                            </td>
                            <td class="p-6 text-right">
                                <button onclick="window.openAdminModal('${doc.id}')" class="text-indigo-600 hover:text-indigo-900 font-bold text-sm bg-indigo-50 px-4 py-2 rounded-xl transition-all active:scale-95">
                                    จัดการงาน <i class="fa-solid fa-chevron-right ml-1 text-[10px]"></i>
                                </button>
                            </td>
                        </tr>
                    `;
                }
            });

            // 3. อัปเดต UI
            ticketListContainer.innerHTML = ticketsHTML || `<tr><td colspan="5" class="p-20 text-center text-slate-400">ไม่มีงานค้างรอรับเรื่อง</td></tr>`;
            noDataMsg.classList.toggle('hidden', ticketsHTML !== "");
            
            // อัปเดตตัวเลข Stats
            if(pendingStat) pendingStat.innerText = countPending;
            if(progressStat) progressStat.innerText = countProgress;
            if(closedStat) closedStat.innerText = countClosed;

        }, (error) => {
            console.error("Firebase Snapshot Error:", error);
            ticketListContainer.innerHTML = `<tr><td colspan="5" class="p-10 text-center text-red-500">เกิดข้อผิดพลาด: ${error.message}</td></tr>`;
        });

    } catch (err) {
        console.error("Main Function Error:", err);
    }
}

// ผูกฟังก์ชันเข้ากับหน้าต่างเพื่อให้เรียกใช้จาก HTML ได้ (กรณีเรียกจากปุ่ม)
window.fetchAdminTickets = fetchAdminTickets;

document.addEventListener('DOMContentLoaded', () => {
    fetchAdminTickets();
});
