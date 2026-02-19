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

// Initialize Firebase
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const db = getFirestore(app);
const auth = getAuth(app);

// 2. Authentication Monitor & Role Check
onAuthStateChanged(auth, async (user) => {
    if (user) {
        console.log("Firebase User Found:", user.uid);
        
        try {
            // ดึงข้อมูลจากคอลเลกชัน admin โดยใช้ UID เป็น Document ID
            const adminDoc = await getDoc(doc(db, "admin", user.uid));
            
            if (adminDoc.exists()) {
                const userData = adminDoc.data();
                console.log("Admin Data Found:", userData);

                // เริ่มโหลดส่วนประกอบหน้าเว็บ (Sidebar, Topbar)
                await initGlobalLayout(userData, user.email);
                
                // โหลดตัวเลขสถิติบน Dashboard
                loadDashboardStats(user.email);

            } else {
                console.error("Critical: User UID not found in 'admin' collection!");
                alert("คุณไม่มีสิทธิ์เข้าถึงระบบนี้");
                await signOut(auth);
                window.location.replace("login.html");
            }
        } catch (error) {
            console.error("Firestore Error:", error);
        }
    } else {
        console.log("No User Found. Redirecting to Login...");
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

    for (const comp of components) {
        try {
            const response = await fetch(comp.url);
            if (!response.ok) throw new Error(`Could not load ${comp.url}`);
            const html = await response.text();
            const container = document.getElementById(comp.id);
            if (container) {
                container.innerHTML = html;
                // ลบคลาสที่อาจทำให้ Sidebar ซ่อนอยู่
                if (comp.id === 'sidebar-placeholder') container.classList.remove('hidden');
            }
        } catch (error) {
            console.warn(`Layout Error: ${error.message}`);
        }
    }

    // อัปเดตข้อมูลบนหน้าจอ (รอให้ HTML โหลดเสร็จก่อน)
    const updateUI = () => {
        const nameEl = document.querySelector('#topbar-user-name');
        const emailEl = document.querySelector('#topbar-user-email');
        if (nameEl) nameEl.innerText = userData.name || "User";
        if (emailEl) emailEl.innerText = email;
    };
    
    setTimeout(updateUI, 100);

    // เริ่มทำงานระบบควบคุม Sidebar
    initSidebarBehavior(userData);
}

// 4. ระบบควบคุม Sidebar (Toggle, Active Link, Admin Control)
function initSidebarBehavior(userData) {
    const sidebar = document.getElementById('sidebar-placeholder');
    const toggleBtn = document.getElementById('sidebar-toggle');
    const toggleIcon = document.getElementById('toggle-icon');
    const currentPath = window.location.pathname.split("/").pop() || "dashboard.html";

    // A. ตรวจสอบสิทธิ์เพื่อแสดง Admin Menu (ตามโครงสร้าง html ของคุณ)
    const adminSection = document.getElementById('admin-menu-section');
    if (adminSection && userData.role === 'Admin') {
        adminSection.classList.remove('hidden', 'hidden-secure');
    }

    // B. ตั้งค่า Active State ให้เมนู
    document.querySelectorAll('.nav-link-modern').forEach(link => {
        if (link.getAttribute('data-page') === currentPath) {
            link.classList.add('active');
        }
    });

    // C. ระบบพับ Sidebar (Desktop)
    if (toggleBtn) {
        toggleBtn.onclick = () => {
            sidebar.classList.toggle('mini');
            if (toggleIcon) {
                if (sidebar.classList.contains('mini')) {
                    toggleIcon.classList.replace('fa-chevron-left', 'fa-chevron-right');
                } else {
                    toggleIcon.classList.replace('fa-chevron-right', 'fa-chevron-left');
                }
            }
        };
    }

    // D. ระบบ Mobile Hamburger (ปุ่ม Bars)
    const mobileBtn = document.getElementById('mobile-menu-btn');
    if (mobileBtn) {
        mobileBtn.onclick = () => {
            sidebar.classList.toggle('active');
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

        // อัปเดตตัวเลขการ์ด
        const setVal = (id, val) => { if(document.getElementById(id)) document.getElementById(id).innerText = val; };
        setVal('stat-total', total);
        setVal('stat-progress', progress);
        setVal('stat-closed', closed);

        // คำนวณความสำเร็จ (%)
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

// 6. ระบบ Logout (ใช้ Event Delegation)
document.addEventListener('click', (e) => {
    // เปิด Modal
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
    // ยกเลิก Logout
    if (e.target.id === 'close-logout') {
        document.getElementById('logout-backdrop').classList.remove('opacity-100');
        document.getElementById('logout-content').classList.add('scale-90', 'opacity-0');
        setTimeout(() => document.getElementById('logout-modal').classList.add('hidden'), 300);
    }
    // ยืนยัน Logout
    if (e.target.id === 'confirm-logout') {
        signOut(auth).then(() => window.location.replace("login.html"));
    }
});
