import {
  auth,
  db,
  signInWithEmailAndPassword,
  collection,
  query,
  where,
  getDocs
} from "./firebase.js";

window.login = async function () {

  const username = document.getElementById("username").value;
  const password = document.getElementById("password").value;

  if(password.length < 4){
    alert("Password ต้องอย่างน้อย 4 ตัว");
    return;
  }

  try {

    // หา email จาก username
    const q = query(
      collection(db, "users"),
      where("username", "==", username)
    );

    const snapshot = await getDocs(q);

    if(snapshot.empty){
      alert("ไม่พบ Username");
      return;
    }

    const userData = snapshot.docs[0].data();
    const email = userData.email;

    // login firebase
    await signInWithEmailAndPassword(auth, email, password);

    alert("Login Success");

    window.location.href = "index.html";

  } catch (err) {
    alert("Login ไม่สำเร็จ");
    console.log(err);
  }
};
