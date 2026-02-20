document.addEventListener("layoutLoaded", () => {

  console.log("ROLE CHECK START");

  const user = window.currentUser;

  if (!user) {
    console.warn("currentUser not found");
    return;
  }

  const role = (user.role || "").toLowerCase();

  console.log("USER ROLE =", role);

  const adminSection =
    document.getElementById("admin-menu-section");

  if (!adminSection) {
    console.warn("admin-menu-section missing");
    return;
  }

  // ✅ รองรับ Admin / admin / ADMIN
  if (role === "admin") {
    adminSection.style.display = "block";
    console.log("ADMIN MENU SHOW");
  } else {
    adminSection.style.display = "none";
  }

});
