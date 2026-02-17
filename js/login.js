import {
  db,
  collection,
  getDocs
} from "./firebase.js";

const btn = document.getElementById("loginBtn");

btn.addEventListener("click", async () => {

  const usernameInput =
    document.getElementById("username");

  const passwordInput =
    document.getElementById("password");

  if (!usernameInput || !passwordInput) {
    console.error("Input not found");
    return;
  }

  const username = usernameInput.value.trim().toLowerCase();
  const password = passwordInput.value.trim();

  console.log("Login Clicked:", username);

  try {

    const querySnapshot =
      await getDocs(collection(db, "admin"));

    let loginSuccess = false;

    querySnapshot.forEach((doc) => {

      const user = doc.data();

      const dbUser =
        user.username.trim().toLowerCase();

      const dbPass =
        user.password.trim();

      if (dbUser === username &&
          dbPass === password) {

        loginSuccess = true;

        notify("Login Success", "success");

        // ✅ จำ session
     localStorage.setItem("user", JSON.stringify({
    name: data.name,
    lastname: data.lastname,
    email: data.email,
    role: data.role
        }));
    
        setTimeout(() => {
          window.location.href = "dashboard.html";
        }, 800);
      }
    });

    if (!loginSuccess) {
      notify("Username หรือ Password ไม่ถูกต้อง", "error");
    }

  } catch (err) {
    console.error(err);
    notify("System Error", "error");
  }

});
// =============================
// SAVE USER SESSION
// =============================
localStorage.setItem("user", JSON.stringify({
    name: userData.name,
    lastname: userData.lastname || "",
    email: userData.email,
    role: userData.role
}));

