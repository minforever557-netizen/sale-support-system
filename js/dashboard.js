/* ================= IMPORT (ต้องบนสุด) ================= */

import { db, auth } from "./firebase.js";

import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  doc,
  getDoc
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

import {
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";


/* ================= GLOBAL ================= */

let currentTickets = [];


/* ================= WAIT LAYOUT LOAD ================= */

document.addEventListener("layoutLoaded", () => {

  console.log("DASHBOARD READY");

  onAuthStateChanged(auth, (user) => {
    if (!user) {
      window.location.replace("login.html");
      return;
    }

    initTicketListener(user.email);
    initEvents();
  });

});


/* ================= AUTH CHECK ================= */

onAuthStateChanged(auth, (user) => {
  if (!user) {
    window.location.replace("login.html");
    return;
  }

  initTicketListener(user.email);
});

/* ================= LOAD TICKETS ================= */

function initTicketListener(email) {

  const sortVal = document.getElementById("sortOrder").value;
  const [field, direction] = sortVal.split("-");

  const q = query(
    collection(db, "tickets"),
    where("ownerEmail", "==", email),
    orderBy(field, direction)
  );

  onSnapshot(q, (snapshot) => {
    currentTickets = snapshot.docs.map(d => ({
      id: d.id,
      ...d.data()
    }));

    renderTickets(currentTickets);
  });
}

/* ================= RENDER ================= */

function renderTickets(tickets) {

  const list = document.getElementById("ticket-list");
  const searchTerm =
    document.getElementById("searchInput").value.toLowerCase();

  const filtered = tickets.filter(t =>
    t.id_number?.toLowerCase().includes(searchTerm) ||
    t.topic?.toLowerCase().includes(searchTerm)
  );

  if (!filtered.length) {
    list.innerHTML =
      `<tr><td colspan="6" class="p-20 text-center text-slate-400">ไม่พบใบงาน</td></tr>`;
    return;
  }

  list.innerHTML = filtered.map(t => {

    const createDate =
      t.createdAt?.toDate().toLocaleString("th-TH") || "-";

    const updateDate =
      t.updatedAt?.toDate().toLocaleString("th-TH") || "-";

    let statusClass = "bg-slate-100 text-slate-600";
    if (t.status === "Open") statusClass = "bg-blue-100 text-blue-700";
    if (t.status === "On Progress") statusClass = "bg-orange-100 text-orange-700";
    if (t.status === "Success") statusClass = "bg-emerald-100 text-emerald-700";
    if (t.status === "Reject") statusClass = "bg-red-100 text-red-700";

    return `
      <tr class="hover:bg-slate-50">
        <td class="p-6 font-bold">${t.id_number || "-"}</td>
        <td class="p-6">${createDate}</td>
        <td class="p-6">${t.topic}</td>
        <td class="p-6 text-center">
          <span class="status-badge ${statusClass}">
            ${t.status}
          </span>
        </td>
        <td class="p-6">${updateDate}</td>
        <td class="p-6 text-right">
          <button onclick="viewDetail('${t.id}')"
          class="px-4 py-2 border rounded-xl">
            ดูข้อมูล
          </button>
        </td>
      </tr>
    `;
  }).join("");
}

/* ================= DETAIL ================= */

window.viewDetail = async (id) => {

  const docSnap = await getDoc(doc(db, "tickets", id));

  if (!docSnap.exists()) return;

  const t = docSnap.data();

  document.getElementById("det-modal-id").innerText = `ID: ${id}`;
  document.getElementById("det-id-number").innerText = t.id_number || "-";
  document.getElementById("det-create-date").innerText =
    t.createdAt?.toDate().toLocaleString("th-TH") || "-";
  document.getElementById("det-topic").innerText = t.topic;
  document.getElementById("det-detail").innerText = t.detail;

  document.getElementById("detail-modal").classList.remove("hidden");
};

/* ================= EVENTS ================= */

document
  .getElementById("searchInput")
  .addEventListener("input", () => renderTickets(currentTickets));

document
  .getElementById("sortOrder")
  .addEventListener("change", () => {
    const user = auth.currentUser;
    if (user) initTicketListener(user.email);
  });
