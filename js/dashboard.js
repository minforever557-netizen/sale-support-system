import { initializeApp, getApps } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, doc, getDoc, collection, getDocs, query, where } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

// 1. Firebase Configuration (แทนที่ Config เดิม)
const firebaseConfig = {
    apiKey: "AIzaSyAa2uSD_tjNqYE2eXnZcn75h_jAVscDG-c",
    authDomain: "salesupportsystemapp.firebaseapp.com",
    projectId: "salesupportsystemapp",
    storageBucket: "salesupportsystemapp.firebasestorage.app",
    messagingSenderId: "840890441207",
    appId: "1:840890441207:web:f3a5076d46e963a90de2f2"
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const db = getFirestore(app);
const auth = getAuth(app);

// 2. ฟังก์ชันโหลด Sidebar/Topbar (แทนที่การเขียนชื่อ User แบบเดิม)
async function initGlobalLayout(userData, email) {
    const comps = [
        { id: 'sidebar-placeholder', url: './components/sidebar.html' },
        { id: 'topbar-placeholder', url: './components/topbar.html' }
    ];

    for (const comp of comps) {
        const res = await fetch(comp.url);
        if (res.ok) {
            const el = document.getElementById(comp.id);
            el.innerHTML = await res.text();
            el.classList.remove('hidden');
        }
    }

    // ส่งชื่อ User ไปแสดงที่ Topbar (แทนที่ document.getElementById("loginUser"))
    const checkTopbar = setInterval(() => {
        const nameEl = document.querySelector('#topbar-user-name');
        if (nameEl) {
            nameEl.innerText = userData.name || "User";
            document.querySelector('#topbar-user-email').innerText = email;
            document.querySelector('#topbar-avatar-text').innerText = (userData.name || "U")[0].toUpperCase();
            clearInterval(checkTopbar);
        }
    }, 100);
}

// 3. ตรวจสอบสถานะการเข้าระบบ (แทนที่ Session Check เดิม)
onAuthStateChanged(auth, async (user) => {
    if (user) {
        const adminDoc = await getDoc(doc(db, "admin", user.uid));
        if (adminDoc.exists()) {
            const userData = adminDoc.data();
            await initGlobalLayout(userData, user.email);
            loadDashboardStats(user.email);
        }
    } else {
        window.location.replace("login.html");
    }
});

// 4. โหลดสถิติใบงาน (ส่วน Logic หลักของ Dashboard)
async function loadDashboardStats(userEmail) {
    try {
        const q = query(collection(db, "tickets"), where("ownerEmail", "==", userEmail));
        const snap = await getDocs(q);
        
        let total = 0, progress = 0, closed = 0;
        let slaTasks = [];

        snap.forEach(docSnap => {
            const d = docSnap.data();
            total++;
            if (["In Progress", "Pending"].includes(d.status)) {
                progress++;
                if(d.sla_due) slaTasks.push({id: docSnap.id, ...d});
            }
            if (["Success", "Closed"].some(s => d.status?.includes(s))) closed++;
        });

        // อัปเดตตัวเลขในหน้าจอ
        document.getElementById('stat-total').innerText = total;
        document.getElementById('stat-progress').innerText = progress;
        document.getElementById('stat-closed').innerText = closed;

        // อัปเดต Success Rate Chart
        const rate = total > 0 ? Math.round((closed / total) * 100) : 0;
        const circle = document.getElementById('progress-circle');
        if(circle) {
            document.getElementById('eff-percent').innerText = rate + '%';
            circle.setAttribute('stroke-dasharray', `${rate} 100`);
        }
    } catch (err) { console.error("Stats Error:", err); }
}

// 5. ระบบ Logout Modal (แทนที่ logoutBtn เดิม)
window.toggleLogout = (show) => {
    const modal = document.getElementById('logout-modal');
    if (show) {
        modal.classList.remove('hidden');
        setTimeout(() => {
            document.getElementById('logout-backdrop').classList.add('opacity-100');
            document.getElementById('logout-content').classList.remove('scale-90', 'opacity-0');
        }, 10);
    } else {
        document.getElementById('logout-backdrop').classList.remove('opacity-100');
        document.getElementById('logout-content').classList.add('scale-90', 'opacity-0');
        setTimeout(() => modal.classList.add('hidden'), 300);
    }
};

document.getElementById('close-logout').onclick = () => window.toggleLogout(false);
document.getElementById('confirm-logout').onclick = () => signOut(auth);

// ดักฟังการคลิก Logout จาก Sidebar
document.addEventListener('click', (e) => {
    if (e.target.closest('#main-logout-btn')) window.toggleLogout(true);
});
