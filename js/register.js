import {
  auth,
  db,
  createUserWithEmailAndPassword,
  doc,
  setDoc
} from "./firebase.js";

const teamByDept = {
  "FBB Dealer Sale": ["FBB Dealer Sale 1-1"],
  "FBB Direct Sale": ["FBB Direct Sale 1-10"],
  "FBB Telesale": ["FBB Telesale"]
};

const teamSelect = document.getElementById("team");
const message = document.getElementById("message");

document.querySelectorAll("input[name='department']").forEach((r) => {
  r.addEventListener("change", () => {
    const teams = teamByDept[r.value] || [];
    teamSelect.innerHTML = '<option value="">เลือกทีม</option>' + teams.map((t) => `<option value="${t}">${t}</option>`).join("");
  });
});

document.getElementById("registerForm")?.addEventListener("submit", async (e) => {
  e.preventDefault();
  const payload = {
    username: document.getElementById("username").value.trim(),
    password: document.getElementById("password").value,
    firstName: document.getElementById("firstName").value.trim(),
    lastName: document.getElementById("lastName").value.trim(),
    email: document.getElementById("email").value.trim(),
    phone: document.getElementById("phone").value.trim(),
    department: document.querySelector("input[name='department']:checked")?.value,
    team: document.getElementById("team").value,
    role: "User",
    active: true,
    createdAt: new Date().toISOString()
  };

  if (payload.password.length < 4) {
    message.textContent = "Password ต้องมีอย่างน้อย 4 ตัว";
    message.className = "text-red-600";
    return;
  }

  try {
    const cred = await createUserWithEmailAndPassword(auth, payload.email, payload.password);
    await setDoc(doc(db, "users", cred.user.uid), payload);
    message.textContent = "สมัครสมาชิกสำเร็จ กลับไป Login ได้เลย";
    message.className = "text-green-700";
  } catch (error) {
    message.textContent = "สมัครสมาชิกไม่สำเร็จ: " + error.message;
    message.className = "text-red-600";
  }
});
