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
        initSidebarToggle();

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

    const fullname = document.getElementById("topbar-user-name");
    const role = document.getElementById("topbar-role");
    const email = document.getElementById("topbar-user-email");

    if (fullname)
        fullname.innerText =
            (user.name || "") + " " + (user.lastname || "");

    if (role)
        role.innerText = user.role || "User";

    if (email)
        email.innerText = user.email || "-";
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
// SIDEBAR TOGGLE
// ==============================
function initSidebarToggle() {

    const btn = document.getElementById("sidebar-toggle");
    const sidebar = document.getElementById("sidebar-wrapper");
    const icon = document.getElementById("toggle-icon");

    if (!btn || !sidebar) return;

    btn.addEventListener("click", () => {

        sidebar.classList.toggle("sidebar-collapsed");

        // สลับลูกศร
        if (sidebar.classList.contains("sidebar-collapsed")) {
            icon.classList.remove("fa-chevron-left");
            icon.classList.add("fa-chevron-right");
        } else {
            icon.classList.remove("fa-chevron-right");
            icon.classList.add("fa-chevron-left");
        }

    });
}


// ==============================
// CLOCK
// ==============================
function startClock() {

    function updateClock() {

        const now = new Date();

        const time = now.toLocaleTimeString("th-TH", {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit"
        });

        const date = now.toLocaleDateString("th-TH", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric"
        });

        const timeEl = document.getElementById("topbar-time");
        const dateEl = document.getElementById("topbar-date");

        if (timeEl) timeEl.innerText = time;
        if (dateEl) dateEl.innerText = date;
    }

    updateClock();
    setInterval(updateClock, 1000);
}


// ==============================
// START
// ==============================
authGuard();
loadLayout();
startClock();
