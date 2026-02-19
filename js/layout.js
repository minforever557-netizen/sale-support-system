console.log("LAYOUT START");

// ==============================
// AUTH GUARD (ใช้ Firebase Login)
// ==============================
function authGuard() {

    const user = localStorage.getItem("user");

    console.log("AUTH CHECK:", user);

    if (!user) {
        window.location.replace("index.html");
    }
}


// ==============================
// LOAD SIDEBAR + TOPBAR
// ==============================
async function loadLayout() {

    try {

        // SIDEBAR
        const sidebarHTML = await fetch("./components/sidebar.html")
            .then(r => r.text());

        document.getElementById("sidebar-container").innerHTML =
            sidebarHTML;

        // TOPBAR
        const topbarHTML = await fetch("./components/topbar.html")
            .then(r => r.text());

        document.getElementById("topbar-container").innerHTML =
            topbarHTML;

        initLogout();
        loadUserToTopbar();
        setActiveMenu();

        console.log("LAYOUT LOADED OK");

    } catch (err) {
        console.error("LAYOUT LOAD ERROR:", err);
    }
}


// ==============================
// USER INFO
// ==============================
function loadUserToTopbar() {

    const user = JSON.parse(localStorage.getItem("user"));
    if (!user) return;

    const fullname = document.getElementById("userFullname");
    const role = document.getElementById("userRole");

    if (fullname)
        fullname.innerText =
            (user.name || "") + " " + (user.lastname || "");

    if (role)
        role.innerText = user.role || "User";
}


// ==============================
// ACTIVE MENU
// ==============================
function setActiveMenu() {

    const page = location.pathname.split("/").pop();

    document.querySelectorAll("[data-page]")
        .forEach(link => {
            if (link.dataset.page === page) {
                link.classList.add("active");
            }
        });
}


// ==============================
// LOGOUT
// ==============================
function initLogout() {

    const btn = document.getElementById("logoutBtn");
    if (!btn) return;

    btn.onclick = () => {
        localStorage.removeItem("user");
        window.location.replace("index.html");
    };
}


// ==============================
// START
// ==============================
authGuard();
loadLayout();
