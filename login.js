document.querySelectorAll("[data-email]").forEach(button => {
  button.addEventListener("click", () => {
    document.getElementById("loginEmail").value = button.dataset.email;
    document.getElementById("loginPassword").value = button.dataset.password;
  });
});

async function login(event) {
  event.preventDefault();
  const email = document.getElementById("loginEmail").value.trim().toLowerCase();
  const password = document.getElementById("loginPassword").value;
  const error = document.getElementById("loginError");

  try {
    const response = await fetch("db.json");
    if (!response.ok) throw new Error("No se pudo cargar las cuentas demo.");

    const database = await response.json();
    const user = database.users.find(account =>
      account.email === email && account.password ===password
    );

    if (!user) {
      error.textContent = "Correo o contraseña incorrectos.";
      return;
    }

    sessionStorage.setItem("sonoraSession", JSON.stringify({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role
    }));

    window.location.href = "index.html";
  } catch (loginError) {
    error.textContent = loginError.message;
  }
}

document.getElementById("loginForm").addEventListener("submit", login);
