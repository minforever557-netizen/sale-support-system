// ==============================
// PAGE GUARD
// ==============================
function authGuard() {

    const user = localStorage.getItem("user");
    console.log("AUTH CHECK:", user);

    if (!user) {
        window.location.href = "index.html";
        return false;
    }

    return true;
}


// ==============================
// LOAD SIDEBAR + TOPBAR
// ==============================
async function loadLayout() {

    console.log("loading layout...");

    // ---------- SIDEBAR ----------
    const sidebarHTML = await fetch("./components/sidebar.html")
        .then(res => res.text());

    const sidebarEl =
        document.getElementById("sidebar-placeholder");

    if (sidebarEl) {
        sidebarEl.innerHTML = sidebarHTML;
    }

    // ---------- TOPBAR ----------
    const topbarHTML = await fetch("./components/topbar.html")
        .then(res => res.text());

    const topbarEl =
        document.getElementById("topbar-placeholder");

    if (topbarEl) {
        topbarEl.innerHTML = topbarHTML;
    }

    // INIT AFTER LOAD
    initLogout();
    loadUserToTopbar();
    setActiveMenu();

    console.log("layout loaded ✅");
}


// ==============================
// LOAD USER TO TOPBAR
// ==============================
function loadUserToTopbar() {

    const user = JSON.parse(localStorage.getItem("user"));
    if (!user) return;

    const role = document.getElementById("userRole");
    const fullname = document.getElementById("userFullname");
    const email = document.getElementById("userEmail");

    if (role) role.innerText = user.role || "User";
    if (fullname)
        fullname.innerText =
            (user.name || "") + " " + (user.lastname || "");
    if (email) email.innerText = user.email || "-";
}


// ==============================
// ACTIVE MENU
// ==============================
function setActiveMenu() {

    const currentPage =
        location.pathname.split("/").pop();

    document
        .querySelectorAll(".nav-link-modern")
        .forEach(link => {

            if (link.dataset.page === currentPage) {
                link.classList.add("active");
            }
        });
}


// ==============================
// LOGOUT
// ==============================
function initLogout() {

    const btn =
        document.getElementById("logoutBtn") ||
        document.getElementById("main-logout-btn");

    if (!btn) return;

    btn.addEventListener("click", () => {
        localStorage.removeItem("user");
        window.location.href = "index.html";
    });
}


// ==============================
// START APP
// ==============================
if (authGuard()) {
    loadLayout();
}
