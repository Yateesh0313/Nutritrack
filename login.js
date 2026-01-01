// SIMPLE LOGIN SYSTEM USING LOCALSTORAGE

document.getElementById("loginBtn").addEventListener("click", () => {
  let savedEmail = localStorage.getItem("savedEmail");
  let savedPass = localStorage.getItem("savedPassword");

  let email = document.getElementById("email").value.trim();
  let password = document.getElementById("password").value;

  if (!email || !password) {
    alert("Please enter both email and password.");
    return;
  }

  if (email === savedEmail && password === savedPass) {
    localStorage.setItem("isLoggedIn", "true");
    alert("Login successful!");
    window.location.href = "index.html";
  } 
  else {
    alert("Invalid email or password!");
  }
});
