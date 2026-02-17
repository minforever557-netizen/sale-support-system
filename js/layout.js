async function loadLayout() {

  // ===== SIDEBAR =====
  const sidebar = await fetch("components/sidebar.html");
  document.getElementById("sidebar").innerHTML =
      await sidebar.text();

  // ===== TOPBAR =====
  const topbar = await fetch("components/topbar.html");
  document.getElementById("topbar").innerHTML =
      await topbar.text();

  startClock();
}

// ===== CLOCK =====
function startClock() {
  setInterval(() => {
    const now = new Date();
    document.getElementById("dateTime").innerText =
      now.toLocaleString("th-TH");
  }, 1000);
}

loadLayout();
loadUserProfile();
