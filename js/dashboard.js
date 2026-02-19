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
// 2. Authentication Monitor & Role Check
onAuthStateChanged(auth, async (user) => {
    if (user) {
        console.log("Firebase User Found:", user.uid);
        
        try {
            // ดึงข้อมูลจากคอลเลกชัน 'admin' (ตรวจสอบตาม UID)
            const userDoc = await getDoc(doc(db, "admin", user.uid));
            
            if (userDoc.exists()) {
                const userData = userDoc.data();
                
                // --- จุดแก้ไขสำคัญ: ใช้ .toLowerCase() เพื่อป้องกันปัญหาตัวพิมพ์เล็ก-ใหญ่ ---
                const rawRole = userData.role || "";
                const userRole = rawRole.toLowerCase(); 
                console.log("User Role identified as:", userRole);

                // ตรวจสอบ Role โดยใช้ตัวพิมพ์เล็กทั้งหมด
                if (userRole === 'admin' || userRole === 'user' || userRole === 'staff') {
                    // ถ้ามี Role ที่ถูกต้อง ให้เข้าใช้งานได้
                    console.log("Access Granted for role:", userRole);
                    await initGlobalLayout(userData, user.email);
                    loadDashboardStats(user.email);
                } else {
                    // กรณีมีฟิลด์ role แต่ค่าข้างในไม่ได้รับอนุญาต
                    console.error("Access Denied: Invalid Role Value ->", rawRole);
                    alert(`สิทธิ์การใช้งานของคุณไม่ถูกต้อง (Role: ${rawRole})`);
                    await signOut(auth);
                    window.location.replace("login.html");
                }

            } else {
                // กรณีไม่พบ UID นี้ในคอลเลกชัน 'admin'
                console.error("Critical: User ID not found in database!");
                alert("ไม่พบข้อมูลผู้ใช้งานในระบบ");
                await signOut(auth);
                window.location.replace("login.html");
            }
        } catch (error) {
            console.error("Firestore Error:", error);
            alert("เกิดข้อผิดพลาดในการเชื่อมต่อฐานข้อมูล");
        }
    } else {
        // ถ้าไม่ได้ Login ให้กลับไปหน้า Login
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

    // 1. โหลด HTML Components
    for (const comp of components) {
        try {
            const response = await fetch(comp.url);
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            const html = await response.text();
            const container = document.getElementById(comp.id);
            if (container) {
                container.innerHTML = html;
                if (comp.id === 'sidebar-placeholder') container.classList.remove('hidden');
            }
        } catch (error) {
            console.error(`Error loading ${comp.id}:`, error);
        }
    }

    // 2. ฟังก์ชันอัปเดตข้อมูล Topbar (ใช้ ID ตามไฟล์ topbar.html ล่าสุดของคุณ)
    const updateTopbarUI = () => {
        // อ้างอิง ID จากโครงสร้างใหม่ที่คุณส่งมา
        const nameEl = document.getElementById('tp-fullname');
        const userEl = document.getElementById('tp-username');
        const emailEl = document.getElementById('tp-email');
        const avatarEl = document.getElementById('tp-avatar-circle');
        const clockEl = document.getElementById('tp-clock');
        const dateEl = document.getElementById('tp-date');

        // ใส่ข้อมูลจาก Firestore
        if (nameEl) nameEl.innerText = userData.name || "ผู้ใช้งานระบบ";
        if (userEl) userEl.innerText = `@${userData.username || email.split('@')[0]}`;
        if (emailEl) emailEl.innerText = email;
        
        // อัปเดตตัวอักษรแรกในวงกลม Avatar
        if (avatarEl && userData.name) {
            avatarEl.innerText = userData.name.charAt(0).toUpperCase();
            // ปรับสี Gradient ให้เป็นโทนเขียวตาม Theme ใหม่ (ถ้าต้องการ)
            avatarEl.className = "w-12 h-12 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-2xl flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-emerald-100 ring-2 ring-white";
        }

        // ระบบนาฬิกา Real-time
        if (clockEl && dateEl) {
            const timer = () => {
                const now = new Date();
                clockEl.innerText = now.toLocaleTimeString('th-TH', { hour12: false });
                dateEl.innerText = now.toLocaleDateString('th-TH', { 
                    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' 
                });
            };
            timer();
            setInterval(timer, 1000);
        }
    };

    // รอให้ไฟล์ HTML โหลดเข้า DOM เรียบร้อยก่อน 150ms
    setTimeout(updateTopbarUI, 150);

    // เริ่มทำงานระบบ Sidebar (ลูกศรย่อขยาย)
    initSidebarBehavior(userData);
}
// 4. ระบบควบคุม Sidebar (Toggle, Active Link, Admin Control)
function initSidebarBehavior(userData) {
    const sidebar = document.getElementById('sidebar-placeholder');
    const toggleBtn = document.getElementById('sidebar-toggle'); // ลูกศร Desktop
    const toggleIcon = document.getElementById('toggle-icon');
    const currentPath = window.location.pathname.split("/").pop() || "dashboard.html";

    // --- 1. ตรวจสอบสิทธิ์จากฟิลด์ role เท่านั้น ---
    const adminSection = document.getElementById('admin-menu-section');
    if (adminSection) {
        // เช็คจากค่าในฟิลด์ role ที่ดึงมาจาก Firestore
        if (userData && userData.role === 'Admin') {
            adminSection.classList.remove('hidden', 'hidden-secure');
            console.log("Admin access granted to menu");
        } else {
            // หากไม่ใช่ Admin ให้ลบทิ้งเพื่อความปลอดภัย ไม่ให้เห็นแม้แต่โครงสร้าง
            adminSection.remove(); 
        }
    }

    // --- 2. ตั้งค่า Active State (ไฮไลท์เมนูที่เลือก) ---
    document.querySelectorAll('.nav-link-modern').forEach(link => {
        // ลบ active เก่าออกก่อนเพื่อความชัวร์
        link.classList.remove('active');
        if (link.getAttribute('data-page') === currentPath) {
            link.classList.add('active');
        }
    });

    // --- 3. ระบบพับ Sidebar สำหรับ Desktop (ลูกศรข้าง Sidebar) ---
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

    // --- 4. ระบบ Mobile Hamburger (ปุ่ม Bars ที่อาจจะมีในหน้าจอเล็ก) ---
    const mobileBtn = document.getElementById('mobile-menu-btn');
    if (mobileBtn) {
        mobileBtn.onclick = () => {
            // ใช้ class 'active' หรือ 'translate-x-0' ขึ้นอยู่กับ CSS ของคุณ
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
