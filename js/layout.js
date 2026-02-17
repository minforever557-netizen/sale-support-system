// ===============================
// LAYOUT MANAGER (GLOBAL)
// Load Sidebar + Topbar
// Auth Guard
// Load User Info
// ===============================

import { loadUserToTopbar } from "./user.js";


// ===============================
// LOAD HTML COMPONENT
// ===============================
async function loadComponent(elementId, filePath) {

    const el = document.getElementById(elementId);
    if (!el) return;

    try {
        const response = await fetch(filePath);
        const html = await response.text();
        el.innerHTML = html;
    } catch (err) {
        console.error("Load component error:", filePath, err);
    }
}


// ===============================
// AUTH GUARD
// ===============================
function checkAuth() {

    const user = localStorage.getItem("user");

    // ถ้าไม่ได้ login → กลับ login page
    if (!user) {
        window.location.href = "/login.html";
        return false;
    }

    return true;
}


// ===============================
// LOGOUT SYSTEM
// ===============================
function setupLogout() {

    const logoutBtn = document.getElementById("logoutBtn");
    if (!logoutBtn) return;

    logoutBtn.addEventListener("click", () => {

        localStorage.removeItem("user");

        // redirect
        window.location.href = "/login.html";
    });
}


// ===============================
// CLOCK (TOPBAR TIME)
// ===============================
function startClock() {

    const timeEl = document.getElementById("dateTime");
    if (!timeEl) return;

    function updateTime() {

        const now = new Date();

        const formatted =
            now.toLocaleDateString("th-TH") +
            " " +
            now.toLocaleTimeString("th-TH");

        timeEl.innerText = formatted;
    }

    updateTime();
    setInterval(updateTime, 1000);
}


// ===============================
// INIT LAYOUT
// ===============================
async function initLayout() {

    // ✅ ตรวจ login ก่อน
    if (!checkAuth()) return;

    // ✅ Load Layout
    await loadComponent("sidebar", "../components/sidebar.html");
    await loadComponent("topbar", "../components/topbar.html");

    // ✅ Load User Info
    loadUserToTopbar();

    // ✅ Activate Logout
    setupLogout();

    // ✅ Start Clock
    startClock();
}


// RUN
initLayout();
