// =============================
// LOAD USER TO TOPBAR
// =============================

export function loadUserToTopbar() {

    const userData = JSON.parse(localStorage.getItem("user"));

    if (!userData) return;

    const fullname = document.getElementById("userFullname");
    const email = document.getElementById("userEmail");

    if (fullname)
        fullname.innerText =
            (userData.name || "") + " " + (userData.lastname || "");

    if (email)
        email.innerText = userData.email || "";
}
