import { initializeApp, getApps } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, doc, getDoc, collection, getDocs, query, where } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

// 1. Firebase Configuration
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

// 2. ฟังก์ชันตรวจสอบสิทธิ์ (หัวใจสำคัญที่แก้ปัญหาเด้ง)
onAuthStateChanged(auth, async (user) => {
    if (user) {
        // พบ User: พยายามดึงข้อมูลจาก Collection "admin"
        try {
            const adminDoc = await getDoc(doc(db, "admin", user.uid));
            if (adminDoc.exists()) {
                const userData = adminDoc.data();
                // ล้าง localStorage เก่าทิ้งเพื่อป้องกันการตีกัน
                localStorage.removeItem("user"); 
                
                // เริ่มโหลด Layout และข้อมูล
                await initGlobalLayout(userData, user.email);
                loadDashboardStats(user.email);
            } else {
                // หาก Login ผ่านแต่ไม่มีชื่อในระบบ admin ให้เตะออก
                console.error("No admin record found");
                await signOut(auth);
                window.location.replace("login.html");
            }
        } catch (error) {
            console.error("Error fetching admin data:", error);
            window.location.replace("login.html");
        }
    } else {
        // ไม่พบ User: ให้กลับไปหน้า Login
        // เช็คก่อนว่าเราไม่ได้อยู่ที่หน้า login.html อยู่แล้วเพื่อป้องกัน Loop
        if (!window.location.pathname.includes("login.html")) {
            window.location.replace("login.html");
        }
    }
});

// --- ฟังก์ชันเสริม (เหมือนเดิม) ---
async function initGlobalLayout(userData, email) {
    const comps = [
        { id: 'sidebar-placeholder', url: './components/sidebar.html' },
        { id: 'topbar-placeholder', url: './components/topbar.html' }
    ];

    for (const comp of comps) {
        const res = await fetch(comp.url);
        if (res.ok) {
            const el = document.getElementById(comp.id);
            if (el) {
                el.innerHTML = await res.text();
                el.classList.remove('hidden');
            }
        }
    }

    const checkTopbar = setInterval(() => {
        const nameEl = document.querySelector('#topbar-user-name');
        if (nameEl) {
            nameEl.innerText = userData.name || "User";
            const emailEl = document.querySelector('#topbar-user-email');
            const avatarEl = document.querySelector('#topbar-avatar-text');
            if (emailEl) emailEl.innerText = email;
            if (avatarEl) avatarEl.innerText = (userData.name || "U")[0].toUpperCase();
            clearInterval(checkTopbar);
        }
    }, 100);
}

async function loadDashboardStats(userEmail) {
    try {
        const q = query(collection(db, "tickets"), where("ownerEmail", "==", userEmail));
        const snap = await getDocs(q);
        let total = 0, progress = 0, closed = 0;
        snap.forEach(docSnap => {
            const d = docSnap.data();
            total++;
            if (["In Progress", "Pending"].includes(d.status)) progress++;
            if (["Success", "Closed"].some(s => d.status?.includes(s))) closed++;
        });
        document.getElementById('stat-total').innerText = total;
        document.getElementById('stat-progress').innerText = progress;
        document.getElementById('stat-closed').innerText = closed;
    } catch (err) { console.error("Stats Error:", err); }
}

// ระบบ Modal Logout
window.toggleLogout = (show) => {
    const modal = document.getElementById('logout-modal');
    if (!modal) return;
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

document.addEventListener('click', (e) => {
    if (e.target.closest('#main-logout-btn')) window.toggleLogout(true);
    if (e.target.id === 'close-logout') window.toggleLogout(false);
    if (e.target.id === 'confirm-logout') signOut(auth).then(() => window.location.replace("login.html"));
});
