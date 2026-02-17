import {
  auth,
  db,
  collection,
  addDoc,
  doc,
  getDocs,
  updateDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
  onSnapshot,
  signOut
} from "./firebase.js";

const content = document.getElementById("content");
const topTitle = document.getElementById("topTitle");
const topTabs = document.getElementById("topTabs");
const modal = document.getElementById("modal");
const modalBody = document.getElementById("modalBody");
const profile = JSON.parse(localStorage.getItem("profile") || "null");

if (!profile) window.location.href = "login.html";

document.getElementById("fullName").textContent = `${profile.firstName} ${profile.lastName}`;
document.getElementById("role").textContent = `${profile.role} • ${profile.department}`;

document.getElementById("menuBtn").onclick = () => {
  document.getElementById("sidebar").classList.toggle("-translate-x-full");
};
document.getElementById("logoutBtn").onclick = async () => {
  await signOut(auth);
  localStorage.removeItem("profile");
  window.location.href = "login.html";
};
document.getElementById("closeModal").onclick = () => modal.classList.add("hidden");

const topicSeed = [
  { name: "ติดตั้งอินเทอร์เน็ต", slaHours: 24, checklist: ["ชื่อผู้ติดต่อ", "เลข Internet No./บัตรประชาชน", "พื้นที่ติดตั้ง"], active: true },
  { name: "อินเทอร์เน็ตใช้งานไม่ได้", slaHours: 4, checklist: ["อาการเสีย", "ไฟ ONU", "เวลาเริ่มเสีย"], active: true },
  { name: "งานเอกสาร", slaHours: 48, checklist: ["เอกสารที่ขาด", "เลขคำขอ"], active: true }
];

async function ensureTopics() {
  const snap = await getDocs(collection(db, "topics"));
  if (!snap.empty) return;
  for (const t of topicSeed) await addDoc(collection(db, "topics"), t);
}

async function getTopics(activeOnly = false) {
  const snap = await getDocs(collection(db, "topics"));
  let items = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  if (activeOnly) items = items.filter((x) => x.active !== false);
  return items;
}

function ticketColor(status) {
  if (status === "Draft") return "bg-gray-100";
  if (status === "On Progress") return "bg-yellow-100";
  if (status === "Resolved") return "bg-green-100";
  if (status === "SLA Breach") return "bg-red-100";
  return "bg-white";
}

async function render(route) {
  await ensureTopics();
  const routes = {
    dashboard: renderDashboard,
    "ticket-new": renderNewTicket,
    "ticket-my": () => renderTicketList("my"),
    "ticket-all": () => renderTicketList("all"),
    "admin-new": () => renderAdminList("new"),
    "admin-my": () => renderAdminList("my"),
    "admin-all": () => renderAdminList("all"),
    "admin-dashboard": renderAdminDashboard,
    users: renderUsers,
    topics: renderTopics
  };
  (routes[route] || routes.dashboard)();
}

async function renderDashboard() {
  topTitle.textContent = "Dashboard";
  topTabs.textContent = "ภาพรวมงานของผู้ใช้";
  const q = query(collection(db, "tickets"), where("ownerId", "==", profile.id));
  const snap = await getDocs(q);
  const tickets = snap.docs.map((d) => d.data());
  const draft = tickets.filter((t) => t.status === "Draft").length;
  const progress = tickets.filter((t) => t.status === "On Progress").length;
  const solved = tickets.filter((t) => t.status === "Resolved").length;

  content.innerHTML = `<div class="grid md:grid-cols-3 gap-4">
    <div class="bg-white rounded-xl p-5 shadow"><p class="text-sm">Draft</p><p class="text-3xl font-bold">${draft}</p></div>
    <div class="bg-white rounded-xl p-5 shadow"><p class="text-sm">On Progress</p><p class="text-3xl font-bold text-orange-500">${progress}</p></div>
    <div class="bg-white rounded-xl p-5 shadow"><p class="text-sm">Resolved</p><p class="text-3xl font-bold text-green-600">${solved}</p></div>
  </div>`;
}

async function renderNewTicket() {
  topTitle.textContent = "New Ticket";
  topTabs.textContent = "กรอกข้อมูลปัญหาและส่งงาน";
  const topics = await getTopics(true);
  content.innerHTML = `<form id="newTicketForm" class="bg-white rounded-xl shadow p-4 space-y-3">
    <select id="topicId" class="w-full border rounded p-2" required>
      <option value="">เลือกหัวข้อปัญหา</option>
      ${topics.map((t) => `<option value="${t.id}">${t.name} (SLA ${t.slaHours}h)</option>`).join("")}
    </select>
    <input id="refNo" class="w-full border rounded p-2" placeholder="Internet No. หรือ บัตรประชาชน" required />
    <textarea id="description" class="w-full border rounded p-2" placeholder="รายละเอียดปัญหา" required></textarea>
    <div id="checklist" class="bg-green-50 p-3 rounded"></div>
    <p id="slaInfo" class="text-sm text-orange-600"></p>
    <button data-status="Draft" class="bg-gray-500 text-white px-4 py-2 rounded">Save Draft</button>
    <button data-status="On Progress" class="bg-green-600 text-white px-4 py-2 rounded ml-2">Send</button>
  </form>`;

  const topicEl = document.getElementById("topicId");
  const updateChecklist = () => {
    const t = topics.find((x) => x.id === topicEl.value);
    document.getElementById("checklist").innerHTML = t ? `<p class='font-semibold mb-1'>Checklist</p>${t.checklist.map((i) => `<label class='block'><input type='checkbox' class='mr-2'/>${i}</label>`).join("")}` : "";
    document.getElementById("slaInfo").textContent = t ? `SLA: ${t.slaHours} ชั่วโมง` : "";
  };
  topicEl.addEventListener("change", updateChecklist);

  document.querySelectorAll("#newTicketForm button").forEach((btn) => btn.addEventListener("click", async (e) => {
    e.preventDefault();
    const t = topics.find((x) => x.id === topicEl.value);
    if (!t) return alert("กรุณาเลือกหัวข้อ");
    const now = new Date();
    const dueAt = new Date(now.getTime() + t.slaHours * 60 * 60 * 1000).toISOString();
    const status = e.target.dataset.status;
    await addDoc(collection(db, "tickets"), {
      topicId: t.id,
      topicName: t.name,
      slaHours: t.slaHours,
      refNo: document.getElementById("refNo").value.trim(),
      description: document.getElementById("description").value.trim(),
      status,
      ownerId: profile.id,
      ownerName: `${profile.firstName} ${profile.lastName}`,
      createdByRole: profile.role,
      adminOwnerId: null,
      dueAt,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    await createNotification("สร้าง Ticket สำเร็จ", `หัวข้อ ${t.name} • ${status}`);
    alert("บันทึกสำเร็จ");
  }));
}

async function renderTicketList(type) {
  topTitle.textContent = type === "my" ? "My Ticket" : "All Ticket";
  topTabs.textContent = "Filter / Sort / Modal Detail";
  let snap;
  if (type === "my") {
    snap = await getDocs(query(collection(db, "tickets"), where("ownerId", "==", profile.id)));
  } else {
    snap = await getDocs(collection(db, "tickets"));
  }
  let tickets = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  tickets = applySLABreach(tickets);
  renderListTemplate(tickets, type.startsWith("a") ? "admin" : "user");
}

function renderListTemplate(tickets, mode) {
  content.innerHTML = `<div class="bg-white rounded-xl p-4 shadow space-y-3">
      <div class="flex flex-col md:flex-row gap-2">
        <input id="filterRef" class="border rounded p-2 flex-1" placeholder="Filter Internet No./บัตรประชาชน" />
        <select id="sortBy" class="border rounded p-2"><option value="created">Sort: วันเวลา</option><option value="status">Sort: Status</option></select>
      </div>
      <div id="table" class="space-y-2"></div>
    </div>`;

  const draw = () => {
    const term = document.getElementById("filterRef").value.trim();
    const sortBy = document.getElementById("sortBy").value;
    let data = tickets.filter((t) => !term || (t.refNo || "").includes(term));
    data.sort((a, b) => (sortBy === "status" ? (a.status || "").localeCompare(b.status || "") : (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0)));

    document.getElementById("table").innerHTML = data.map((t) => `<div class="p-3 rounded ${ticketColor(t.status)} flex justify-between gap-2">
      <div>
        <p class="font-semibold">${t.topicName}</p>
        <p class="text-sm">Ref: ${t.refNo} • Status: ${t.status}</p>
      </div>
      <div class="flex gap-2">
        <button class="border px-2 rounded detail" data-id="${t.id}">Detail</button>
        ${mode === "admin" ? `<button class="bg-orange-500 text-white px-2 rounded accept" data-id="${t.id}">Accept</button><button class="bg-green-600 text-white px-2 rounded resolve" data-id="${t.id}">Resolve</button>` : ""}
      </div>
    </div>`).join("");

    document.querySelectorAll(".detail").forEach((b) => b.onclick = () => openTicket(data.find((t) => t.id === b.dataset.id)));
    document.querySelectorAll(".accept").forEach((b) => b.onclick = () => acceptTicket(b.dataset.id));
    document.querySelectorAll(".resolve").forEach((b) => b.onclick = () => resolveTicket(b.dataset.id));
  };

  draw();
  document.getElementById("filterRef").oninput = draw;
  document.getElementById("sortBy").onchange = draw;
}

function openTicket(ticket) {
  modalBody.textContent = JSON.stringify(ticket, null, 2);
  modal.classList.remove("hidden");
  modal.classList.add("flex");
}

function applySLABreach(tickets) {
  const now = Date.now();
  return tickets.map((t) => {
    if (t.status === "Resolved") return t;
    const due = new Date(t.dueAt || Date.now()).getTime();
    if (now > due) return { ...t, status: "SLA Breach" };
    return t;
  });
}

async function renderAdminList(type) {
  topTitle.textContent = `Ticket Admin - ${type}`;
  topTabs.textContent = "จัดการเคส / Accept / Close พร้อม Comment";
  const snap = await getDocs(collection(db, "tickets"));
  let tickets = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  tickets = applySLABreach(tickets);

  if (type === "new") tickets = tickets.filter((t) => !t.adminOwnerId && t.status !== "Resolved");
  if (type === "my") tickets = tickets.filter((t) => t.adminOwnerId === profile.id);

  tickets.sort((a, b) => new Date(a.dueAt) - new Date(b.dueAt));
  renderListTemplate(tickets, "admin");
}

async function acceptTicket(id) {
  await updateDoc(doc(db, "tickets", id), { adminOwnerId: profile.id, adminOwnerName: `${profile.firstName} ${profile.lastName}`, updatedAt: serverTimestamp() });
  await createNotification("Admin Accept Ticket", `Ticket ${id.slice(0, 6)} ถูกรับงานแล้ว`);
  alert("Accept สำเร็จ");
  render(location.hash.slice(1));
}

async function resolveTicket(id) {
  const comment = prompt("ระบุ comment ปิดเคส");
  if (!comment) return;
  await updateDoc(doc(db, "tickets", id), { status: "Resolved", closeComment: comment, updatedAt: serverTimestamp() });
  await createNotification("ปิดเคสสำเร็จ", `Ticket ${id.slice(0, 6)} ปิดงานแล้ว`);
  render(location.hash.slice(1));
}

async function renderAdminDashboard() {
  topTitle.textContent = "Admin Dashboard";
  topTabs.textContent = "ภาพรวมทุกทีม (เหมาะกับนำเสนอผู้บริหาร)";
  const snap = await getDocs(collection(db, "tickets"));
  const tickets = snap.docs.map((d) => d.data());
  const byStatus = ["Draft", "On Progress", "SLA Breach", "Resolved"].map((s) => ({ s, c: tickets.filter((t) => t.status === s).length }));
  content.innerHTML = `<div class="grid md:grid-cols-2 gap-4">
    <div class="bg-white rounded-xl p-4 shadow"><h3 class="font-semibold mb-3">Tickets by Status</h3>${byStatus.map((x) => `<div class='flex justify-between border-b py-1'><span>${x.s}</span><span class='font-bold'>${x.c}</span></div>`).join("")}</div>
    <div class="bg-white rounded-xl p-4 shadow"><h3 class="font-semibold mb-3">Summary</h3><p>รวมทั้งหมด: <b>${tickets.length}</b></p><p>ปิดแล้ว: <b class='text-green-600'>${tickets.filter((t) => t.status === "Resolved").length}</b></p></div>
  </div>`;
}

async function renderUsers() {
  topTitle.textContent = "User Management";
  topTabs.textContent = "แก้ไข Profile และกำหนด Role User/Admin";
  const snap = await getDocs(collection(db, "users"));
  const users = snap.docs.map((d) => ({ id: d.id, ...d.data() }));

  content.innerHTML = `<div class="bg-white rounded-xl p-4 shadow overflow-auto"><table class="w-full text-sm"><thead><tr class="text-left border-b"><th>ชื่อ</th><th>Email</th><th>Phone</th><th>Role</th><th></th></tr></thead><tbody>
    ${users.map((u) => `<tr class='border-b'><td>${u.firstName} ${u.lastName}</td><td>${u.email}</td><td><input value='${u.phone || ""}' data-id='${u.id}' data-field='phone' class='border p-1 rounded w-32' /></td><td><select data-id='${u.id}' data-field='role' class='border p-1 rounded'><option ${u.role === "User" ? "selected" : ""}>User</option><option ${u.role === "Admin" ? "selected" : ""}>Admin</option></select></td><td><button class='saveUser bg-green-600 text-white px-2 py-1 rounded' data-id='${u.id}'>Save</button></td></tr>`).join("")}
  </tbody></table></div>`;

  document.querySelectorAll(".saveUser").forEach((btn) => btn.onclick = async () => {
    const id = btn.dataset.id;
    const row = [...document.querySelectorAll(`[data-id='${id}']`)];
    const payload = Object.fromEntries(row.map((e) => [e.dataset.field, e.value]));
    await updateDoc(doc(db, "users", id), payload);
    alert("บันทึกแล้ว");
  });
}

async function renderTopics() {
  topTitle.textContent = "Topic Management";
  topTabs.textContent = "เพิ่ม/แก้ไข Topic, SLA, Checklist และ Active/Inactive";
  const topics = await getTopics(false);
  content.innerHTML = `<div class="bg-white rounded-xl p-4 shadow space-y-4">
    <form id='topicForm' class='grid md:grid-cols-4 gap-2'>
      <input id='name' placeholder='Topic' class='border rounded p-2' required />
      <input id='slaHours' type='number' min='1' placeholder='SLA (ชั่วโมง)' class='border rounded p-2' required />
      <input id='checklist' placeholder='Checklist คั่นด้วย ,' class='border rounded p-2 md:col-span-2' required />
      <button class='bg-orange-500 text-white rounded p-2'>เพิ่ม Topic</button>
    </form>
    <div class='space-y-2'>${topics.map((t) => `<div class='border rounded p-2 flex justify-between'><div><b>${t.name}</b> • SLA ${t.slaHours}h <p class='text-xs text-gray-600'>${(t.checklist || []).join(", ")}</p></div><button class='toggleTopic px-2 py-1 rounded ${t.active === false ? "bg-gray-500" : "bg-green-600"} text-white' data-id='${t.id}' data-active='${t.active === false ? "0" : "1"}'>${t.active === false ? "Inactive" : "Active"}</button></div>`).join("")}</div>
  </div>`;

  document.getElementById("topicForm").onsubmit = async (e) => {
    e.preventDefault();
    await addDoc(collection(db, "topics"), {
      name: document.getElementById("name").value,
      slaHours: Number(document.getElementById("slaHours").value),
      checklist: document.getElementById("checklist").value.split(",").map((x) => x.trim()).filter(Boolean),
      active: true
    });
    render("topics");
  };

  document.querySelectorAll(".toggleTopic").forEach((btn) => btn.onclick = async () => {
    const active = btn.dataset.active === "1";
    await updateDoc(doc(db, "topics", btn.dataset.id), { active: !active });
    render("topics");
  });
}

async function createNotification(title, detail) {
  await addDoc(collection(db, "notifications"), {
    title,
    detail,
    userId: profile.id,
    read: false,
    createdAt: serverTimestamp()
  });
}

function initNotifications() {
  const q = query(collection(db, "notifications"), orderBy("createdAt", "desc"));
  onSnapshot(q, (snap) => {
    const items = snap.docs.map((d) => ({ id: d.id, ...d.data() })).slice(0, 20);
    document.getElementById("notiCount").textContent = String(items.filter((i) => !i.read).length);
    document.getElementById("notiList").innerHTML = items.map((n) => `<div class='border rounded p-2 ${n.read ? "bg-white" : "bg-green-50"}'><p class='font-medium'>${n.title}</p><p class='text-xs text-gray-600'>${n.detail || ""}</p></div>`).join("");
  });
  document.getElementById("notificationBtn").onclick = () => {
    document.getElementById("notiPanel").classList.toggle("hidden");
  };
}

window.addEventListener("hashchange", () => render(location.hash.slice(1)));
initNotifications();
render(location.hash.slice(1) || "dashboard");
