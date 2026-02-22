import { db, auth } from "./firebase.js";

import {
  collection,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  getDocs
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

import {
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";


console.log("🔔 Notification Engine Loaded");


// ================= WAIT ELEMENT (GLOBAL SAFE) =================
function waitElement(id) {
  return new Promise(resolve => {

    const el = document.getElementById(id);
    if (el) return resolve(el);

    const obs = new MutationObserver(() => {
      const el = document.getElementById(id);
      if (el) {
        obs.disconnect();
        resolve(el);
      }
    });

    obs.observe(document.body, { childList:true, subtree:true });
  });
}


// ================= MAIN START =================
async function startNotification(role, email) {

  console.log("🔔 START NOTIFICATION:", role);

  const notiBtn  = await waitElement("noti-btn");
  const notiList = await waitElement("noti-list");
  const notiDot  = await waitElement("noti-dot");
  const notiDrop = await waitElement("noti-dropdown");

  // ป้องกัน listener ซ้อนเวลาเปลี่ยนหน้า
  if (window.__notiUnsub) window.__notiUnsub();

  // ================= QUERY =================
  let q;

  if (role === "admin") {

    // ADMIN เห็นทุกใบงาน
    q = query(
      collection(db,"tickets"),
      orderBy("createdAt","desc"),
      limit(10)
    );

  } else {

    // USER เห็นเฉพาะของตัวเอง
    q = query(
      collection(db,"tickets"),
      where("ownerEmail","==",email),
      orderBy("updatedAt","desc"),
      limit(10)
    );
  }


  // ================= REALTIME =================
  window.__notiUnsub = onSnapshot(q,(snap)=>{

    let html = "";
    let hasNew = false;

    snap.docChanges().forEach(change=>{

      const d = change.doc.data();

      // ADMIN → ticket ใหม่
      if(role==="admin" && change.type==="added"){
        hasNew = true;
        html += `
        <div class="p-4 border-b hover:bg-emerald-50">
          <div class="font-bold text-emerald-600">🆕 ใบงานใหม่</div>
          <div class="text-[11px] text-slate-600">
            ${d.owner} เปิดใบงาน : ${d.topic}
          </div>
        </div>`;
      }

      // USER → update ticket
      if(role!=="admin" && change.type==="modified"){
        hasNew = true;
        html += `
        <div class="p-4 border-b hover:bg-blue-50">
          <div class="font-bold text-blue-600">🔔 อัปเดตใบงาน</div>
          <div class="text-[11px] text-slate-600">
            ${d.topic} → ${d.status}
          </div>
        </div>`;
      }

    });

    if(hasNew){
      notiList.innerHTML = html + notiList.innerHTML;
      notiDot.classList.remove("hidden");
    }

  });


  // ================= UI =================
  notiBtn.onclick = (e)=>{
    e.stopPropagation();
    notiDrop.classList.toggle("hidden");
    notiDot.classList.add("hidden");
  };

  window.addEventListener("click",()=>{
    notiDrop.classList.add("hidden");
  });
}



// ================= AUTO BOOT =================
window.addEventListener("layoutLoaded",()=>{

  onAuthStateChanged(auth, async(user)=>{

    if(!user) return;

    const q = query(
      collection(db,"admin"),
      where("email","==",user.email)
    );

    const snap = await getDocs(q);
    if(snap.empty) return;

    const role =
      (snap.docs[0].data().role || "").toLowerCase();

    startNotification(role, user.email);

  });

});
