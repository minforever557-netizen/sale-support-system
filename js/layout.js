// ===============================
// LOAD SHARED LAYOUT
// ===============================

async function loadComponent(id, file) {
    try {
        const res = await fetch(file);

        if (!res.ok) {
            throw new Error("Load failed : " + file);
        }

        const html = await res.text();
        document.getElementById(id).innerHTML = html;

    } catch (err) {
        console.error(err);
    }
}

// โหลด sidebar + topbar
loadComponent(
  "sidebar-container",
  "/Sale-Support-System/components/sidebar.html"
);

loadComponent(
  "topbar-container",
  "/Sale-Support-System/components/topbar.html"
);
