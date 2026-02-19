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

// 2. Authentication Monitor & Role Check
onAuthStateChanged(auth, async (user) => {
    if (user) {
        try {
            const userDoc = await getDoc(doc(db, "admin", user.uid));
            if (userDoc.exists()) {
                const userData = userDoc.data();
                const userRole = (userData.role || "").toLowerCase();

                if (['admin', 'user', 'staff'].includes(userRole)) {
                    // เรียกโหลดโครงสร้างหน้าเว็บ
                    await initGlobalLayout(userData, user.email);
                    
                    if (typeof loadDashboardStats === 'function') {
                        loadDashboardStats(user.email);
                    }
                } else {
                    alert("สิทธิ์การใช้งานของคุณไม่ถูกต้อง");
                    await signOut(auth);
                    window.location.replace("login.html");
                }
            } else {
                alert("ไม่พบข้อมูลผู้ใช้งานในระบบ");
                await signOut(auth);
                window.location.replace("login.html");
            }
        } catch (error) {
            console.error("Auth Change Error:", error);
        }
    } else {
        if (!window.location.pathname.includes("login.html")) {
            window.location.replace("login.html");
        }
    }
});

// 3. ฟังก์ชันโหลด Sidebar และ Topbar
async function initGlobalLayout(userData, email) {
    const components = [
        { id: 'sidebar-placeholder', url: './components/sidebar.html' },
        { id: 'topbar-placeholder', url: './components/topbar.html' }
    ];

    // โหลดไฟล์ HTML
    for (const comp of components) {
        try {
            const response = await fetch(comp.url);
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            const html = await response.text();
            const container = document.getElementById(comp.id);
            if (container) {
                container.innerHTML = html;
                console.log(`✅ Loaded: ${comp.id}`);
            }
        } catch (error) {
            console.error(`❌ Error loading ${comp.id}:`, error);
        }
    }

    // ฟังก์ชันฉีดข้อมูลเข้า UI (รอจนกว่า Element จะเกิด)
    const renderUserData = (attempts = 0) => {
        const nameEl = document.getElementById('tp-fullname');
        const userEl = document.getElementById('tp-username');
        const emailEl = document.getElementById('tp-email');
        const avatarEl = document.getElementById('tp-avatar-circle');

        if (nameEl) {
            nameEl.innerText = userData.name || "user 02";
            if (userEl) userEl.innerText = `@${userData.username || "user02"}`;
            if (emailEl) emailEl.innerText = email || userData.email;
            if (avatarEl && (userData.name || userData.username)) {
                const firstChar = (userData.name || userData.username).charAt(0).toUpperCase();
                avatarEl.innerText = firstChar;
            }
            console.log("🚀 Topbar UI Updated!");
            initLiveClock();
        } else if (attempts < 50) {
            setTimeout(() => renderUserData(attempts + 1), 20);
        }
    };

    renderUserData();
    initSidebarBehavior(userData);
}

// ระบบนาฬิกา
function initLiveClock() {
    const clockEl = document.getElementById('tp-clock');
    const dateEl = document.getElementById('tp-date');
    if (clockEl && dateEl) {
        const update = () => {
            const now = new Date();
            clockEl.innerText = now.toLocaleTimeString('th-TH', { hour12: false });
            dateEl.innerText = now.toLocaleDateString('th-TH', { 
                weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' 
            });
        };
        update();
        setInterval(update, 1000);
    }
}

// 4. ระบบควบคุม Sidebar
function initSidebarBehavior(userData) {
    const sidebar = document.getElementById('sidebar-placeholder');
    const toggleBtn = document.getElementById('sidebar-toggle');
    const toggleIcon = document.getElementById('toggle-icon');
    const currentPath = window.location.pathname.split("/").pop() || "dashboard.html";

    // จัดการเมนู Admin
    const adminSection = document.getElementById('admin-menu-section');
    if (adminSection) {
        if (userData && userData.role && userData.role.toLowerCase() === 'admin') {
            adminSection.classList.remove('hidden');
        } else {
            adminSection.remove(); 
        }
    }

    // Active Link
    document.querySelectorAll('.nav-link-modern').forEach(link => {
        if (link.getAttribute('data-page') === currentPath) {
            link.classList.add('active');
        }
    });

    // Desktop Toggle
    if (toggleBtn) {
        toggleBtn.onclick = () => {
            if (sidebar) sidebar.classList.toggle('mini');
            if (toggleIcon) {
                const isMini = sidebar.classList.contains('mini');
                toggleIcon.classList.toggle('fa-chevron-left', !isMini);
                toggleIcon.classList.toggle('fa-chevron-right', isMini);
            }
        };
    }
}

// 5. ฟังก์ชันดึงสถิติ Dashboard
async function loadDashboardStats(userEmail) {
    try {
        const q = query(collection(db, "tickets"), where("ownerEmail", "==", userEmail));
        const snap = await getDocs(q);
        
        let total = 0, progress = 0, closed = 0;
        snap.forEach(docSnap => {
            const data = docSnap.data();
            total++;
            if (["In Progress", "Pending", "กำลังดำเนินการ"].includes(data.status)) progress++;
            if (["Success", "Closed", "ปิดงานแล้ว"].includes(data.status)) closed++;
        });

        const setVal = (id, val) => { if(document.getElementById(id)) document.getElementById(id).innerText = val; };
        setVal('stat-total', total);
        setVal('stat-progress', progress);
        setVal('stat-closed', closed);

        if (total > 0) {
            const percent = Math.round((closed / total) * 100);
            setVal('eff-percent', percent + "%");
            const circle = document.getElementById('progress-circle');
            if (circle) circle.style.strokeDasharray = `${percent} 100`;
        }
    } catch (err) {
        console.error("Stats Error:", err);
    }
}

// 6. ระบบ Logout
document.addEventListener('click', (e) => {
    if (e.target.closest('#main-logout-btn')) {
        const modal = document.getElementById('logout-modal');
        if(modal) {
            modal.classList.remove('hidden');
            setTimeout(() => {
                document.getElementById('logout-backdrop').classList.add('opacity-100');
                document.getElementById('logout-content').classList.remove('scale-90', 'opacity-0');
            }, 10);
        }
    }
    if (e.target.id === 'close-logout') {
        document.getElementById('logout-backdrop').classList.remove('opacity-100');
        document.getElementById('logout-content').classList.add('scale-90', 'opacity-0');
        setTimeout(() => document.getElementById('logout-modal').classList.add('hidden'), 300);
    }
    if (e.target.id === 'confirm-logout') {
        signOut(auth).then(() => window.location.replace("login.html"));
    }
});
