console.log("LAYOUT START");

// ==============================
// AUTH GUARD (ใช้ Firebase Login)
// ==============================
function authGuard() {

    const userStr = localStorage.getItem("user");

    console.log("AUTH CHECK:", userStr);

    if (!userStr) {
        window.location.replace("index.html");
        return;
    }

    // ⭐ แปลง string → object
    const userData = JSON.parse(userStr);

    // ⭐ ส่งให้ sidebar-role ใช้
    window.currentUser = userData;
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
        // รอ DOM render จริงก่อนยิง event
setTimeout(() => {
    document.dispatchEvent(new Event("layoutLoaded"));
}, 0);
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

        Swal.fire({
            title: "ออกจากระบบ ?",
            text: "คุณต้องการออกจากระบบใช่หรือไม่",
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#10b981",
            cancelButtonColor: "#ef4444",
            confirmButtonText: "ใช่, ออกจากระบบ",
            cancelButtonText: "ยกเลิก",
            reverseButtons: true,
            backdrop: true,
            allowOutsideClick: false,
            showClass: {
                popup: "animate__animated animate__fadeInDown"
            },
            hideClass: {
                popup: "animate__animated animate__fadeOutUp"
            }

        }).then((result) => {

            if (result.isConfirmed) {

                // animation ก่อนออก
                document.body.classList.add("opacity-0","transition","duration-300");

                setTimeout(() => {
                    localStorage.removeItem("user");
                    window.location.replace("index.html");
                }, 300);
            }

        });
    };
}




// ==============================
// SIDEBAR TOGGLE
// ==============================
function initSidebarToggle() {

    const btn = document.getElementById("sidebar-toggle");
    const sidebar = document.getElementById("sidebar-container");

    if (!btn || !sidebar) {
        console.log("TOGGLE NOT FOUND");
        return;
    }

    btn.onclick = () => {
        sidebar.classList.toggle("sidebar-collapsed");
    };
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
