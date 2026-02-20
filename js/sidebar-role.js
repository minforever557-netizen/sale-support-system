// ================= SIDEBAR ROLE CONTROL =================

document.addEventListener("DOMContentLoaded", () => {

    const role = localStorage.getItem("userRole");

    const adminMenu = document.getElementById("admin-menu-section");

    // ถ้าไม่มี sidebar (บางหน้าอาจไม่มี)
    if (!adminMenu) return;

    // แสดงเฉพาะ admin
    if (role === "admin") {
        adminMenu.style.display = "block";
    } else {
        adminMenu.style.display = "none";
    }

});
