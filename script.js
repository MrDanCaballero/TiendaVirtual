let products = [];
let cart = [];
let activeCategory = "Todos";
let users = [];
let currentUser = JSON.parse(sessionStorage.getItem("sonoraSession") || "null");
let orders = JSON.parse(localStorage.getItem("sonoraOrders") || "[]");

const productGrid = document.getElementById("productGrid");
const searchInput = document.getElementById("searchInput");
const emptyState = document.getElementById("emptyState");
const cartDrawer = document.getElementById("cartDrawer");
const overlay = document.getElementById("overlay");
const cartItems = document.getElementById("cartItems");
const ordersModal = document.getElementById("ordersModal");

const formatPrice = value => new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  maximumFractionDigits: 0
}).format(value);

function renderProducts() {
  const query = searchInput.value.trim().toLowerCase();
  const filtered = products.filter(product => {
    const matchesCategory = activeCategory === "Todos" || product.category === activeCategory;
    const matchesSearch = product.name.toLowerCase().includes(query) || product.category.toLowerCase().includes(query);
    return matchesCategory && matchesSearch;
  });

  productGrid.innerHTML = filtered.map(product => `
    <article class="product-card">
      <div class="product-card__image">
        <img src="${product.image}" alt="${product.name}" loading="lazy">
        ${product.tag ? `<span class="product-card__tag">${product.tag}</span>` : ""}
        <button class="product-card__add" type="button" data-id="${product.id}" aria-label="Añadir ${product.name} al carrito">+</button>
      </div>
      <div class="product-card__info">
        <div class="product-card__meta">
          <div>
            <h3>${product.name}</h3>
            <span class="product-card__category">${product.category}</span>
          </div>
          <span class="product-card__price">${formatPrice(product.price)}</span>
        </div>
      </div>
    </article>
  `).join("");

  emptyState.hidden = filtered.length !== 0;
}

function openCart() {
  cartDrawer.classList.add("open");
  overlay.classList.add("show");
  cartDrawer.setAttribute("aria-hidden", "false");
}

function closeCart() {
  cartDrawer.classList.remove("open");
  overlay.classList.remove("show");
  cartDrawer.setAttribute("aria-hidden", "true");
}

function addToCart(id) {
  const existing = cart.find(item => item.id === id);
  if (existing) {
    existing.quantity += 1;
  } else {
    const product = products.find(item => item.id === id);
    cart.push({ ...product, quantity: 1 });
  }
  renderCart();
  showToast();
}

function changeQuantity(id, amount) {
  const item = cart.find(product => product.id === id);
  if (!item) return;
  item.quantity += amount;
  if (item.quantity <= 0) cart = cart.filter(product => product.id !== id);
  renderCart();
}

function renderCart() {
  const itemCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  document.getElementById("cartCount").textContent = itemCount;
  document.getElementById("cartTitleCount").textContent = `(${itemCount})`;
  document.getElementById("cartTotal").textContent = formatPrice(total);

  if (!cart.length) {
    cartItems.innerHTML = `<div class="cart-empty"><p>Tu carrito está vacío.<br>¡Agrega algo que te inspire!</p></div>`;
    return;
  }

  cartItems.innerHTML = cart.map(item => `
    <div class="cart-item">
      <img src="${item.image}" alt="${item.name}">
      <div>
        <h3>${item.name}</h3>
        <span class="cart-item__price">${formatPrice(item.price)}</span>
        <div class="quantity">
          <button type="button" data-action="minus" data-id="${item.id}" aria-label="Quitar uno">−</button>
          <span>${item.quantity}</span>
          <button type="button" data-action="plus" data-id="${item.id}" aria-label="Agregar uno">+</button>
        </div>
      </div>
      <button class="remove-item" type="button" data-action="remove" data-id="${item.id}" aria-label="Eliminar ${item.name}">×</button>
    </div>
  `).join("");
}

function showToast() {
  const toast = document.getElementById("toast");
  toast.classList.add("show");
  window.clearTimeout(showToast.timer);
  showToast.timer = window.setTimeout(() => toast.classList.remove("show"), 1800);
}

function openModal(modal) {
  modal.classList.add("open");
  modal.setAttribute("aria-hidden", "false");
  overlay.classList.add("show");
}

function closeModal(modal) {
  modal.classList.remove("open");
  modal.setAttribute("aria-hidden", "true");
  if (!document.querySelector(".modal.open") && !cartDrawer.classList.contains("open")) {
    overlay.classList.remove("show");
  }
}

function showOverlayModal(modal) {
  closeCart();
  openModal(modal);
}

function updateAccountUI() {
  const accountButton = document.getElementById("accountButton");
  const mainNav = document.getElementById("mainNav");

  if (!currentUser) {
    accountButton.innerHTML = `<span class="account-button-label">Ingresar</span>`;
    accountButton.onclick = () => { window.location.href = "login.html"; };
    mainNav.innerHTML = `
      <a class="nav__link active" href="#catalogo">Tienda</a>
      <a class="nav__link" href="#categorias">Categorías</a>
      <a class="nav__link" href="#ofertas">Ofertas</a>
    `;
    return;
  }

  accountButton.innerHTML = `
    <span class="account-button-label">
      ${currentUser.name}
      ${currentUser.role === "admin" ? " · Admin" : ""}
    </span>
  `;
  accountButton.onclick = () => openUserMenu();

  mainNav.innerHTML = `
    <a class="nav__link active" href="#catalogo">Tienda</a>
    <a class="nav__link" href="#categorias">Categorías</a>
    <button class="nav__link nav__button" type="button" id="ordersNavButton">
      ${currentUser.role === "admin" ? "Todas las compras" : "Mis compras"}
    </button>
  `;
  document.getElementById("ordersNavButton").addEventListener("click", renderOrders);
}

function openUserMenu() {
  const action = window.confirm("¿Deseas ver el historial correspondiente a tu cuenta?");
  if (action) renderOrders();
}

function logout() {
  currentUser = null;
  sessionStorage.removeItem("sonoraSession");
  updateAccountUI();
  document.getElementById("toast").textContent = "Sesión cerrada";
  showToast();
}

function renderOrders() {
  const visibleOrders = currentUser.role === "admin"
    ? orders
    : orders.filter(order => order.userId === currentUser.id);

  document.getElementById("ordersEyebrow").textContent = currentUser.role === "admin" ? "Panel de administración" : "Mis compras";
  document.getElementById("ordersTitle").textContent = currentUser.role === "admin" ? "Todas las compras" : "Historial";

  const ordersList = document.getElementById("ordersList");
  if (!visibleOrders.length) {
    ordersList.innerHTML = `<div class="order-empty">No hay compras registradas.</div>`;
  } else {
    ordersList.innerHTML = visibleOrders.map(order => `
      <article class="order-card">
        <div class="order-card__header">
          <strong>${order.id}</strong>
          <span>${order.date}</span>
        </div>
        <div><strong>${order.userName}</strong> · ${formatPrice(order.total)}</div>
        <ul>
          ${order.items.map(item => `<li>${item.quantity} × ${item.name}</li>`).join("")}
        </ul>
      </article>
    `).join("");
  }

  showOverlayModal(ordersModal);
}

function completePurchase() {
  if (!cart.length) {
    document.getElementById("toast").textContent = "Tu carrito está vacío";
    showToast();
    return;
  }

  if (!currentUser) {
    document.getElementById("toast").textContent = "Inicia sesión para finalizar la compra";
    showToast();
    window.setTimeout(() => { window.location.href = "login.html"; }, 600);
    return;
  }

  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const order = {
    id: `SON-${Date.now().toString().slice(-8)}`,
    userId: currentUser.id,
    userName: currentUser.name,
    date: new Intl.DateTimeFormat("es-AR", { dateStyle: "medium", timeStyle: "short" }).format(new Date()),
    total,
    items: cart.map(item => ({ name: item.name, quantity: item.quantity, price: item.price }))
  };

  orders.unshift(order);
  localStorage.setItem("sonoraOrders", JSON.stringify(orders));
  cart = [];
  renderCart();
  closeCart();
  document.getElementById("toast").textContent = "Compra registrada correctamente";
  showToast();
}

productGrid.addEventListener("click", event => {
  const button = event.target.closest(".product-card__add");
  if (button) addToCart(Number(button.dataset.id));
});

cartItems.addEventListener("click", event => {
  const button = event.target.closest("button[data-action]");
  if (!button) return;
  const id = Number(button.dataset.id);
  if (button.dataset.action === "plus") changeQuantity(id, 1);
  if (button.dataset.action === "minus") changeQuantity(id, -1);
  if (button.dataset.action === "remove") {
    cart = cart.filter(item => item.id !== id);
    renderCart();
  }
});

document.querySelectorAll(".filter").forEach(button => {
  button.addEventListener("click", () => {
    document.querySelectorAll(".filter").forEach(item => item.classList.remove("active"));
    button.classList.add("active");
    activeCategory = button.dataset.filter;
    document.querySelectorAll(".category-card").forEach(card => card.classList.toggle("active", card.dataset.category === activeCategory));
    renderProducts();
  });
});

document.querySelectorAll(".category-card").forEach(card => {
  card.addEventListener("click", () => {
    activeCategory = card.dataset.category;
    document.querySelectorAll(".category-card").forEach(item => item.classList.remove("active"));
    card.classList.add("active");
    document.querySelectorAll(".filter").forEach(item => item.classList.toggle("active", item.dataset.filter === activeCategory));
    renderProducts();
    document.getElementById("catalogo").scrollIntoView({ behavior: "smooth" });
  });
});

searchInput.addEventListener("input", renderProducts);
document.getElementById("searchToggle").addEventListener("click", () => {
  document.getElementById("catalogo").scrollIntoView({ behavior: "smooth" });
  setTimeout(() => searchInput.focus(), 500);
});
document.getElementById("cartToggle").addEventListener("click", openCart);
document.getElementById("cartClose").addEventListener("click", closeCart);
document.getElementById("checkoutButton").addEventListener("click", completePurchase);

overlay.addEventListener("click", () => {
  closeCart();
  closeModal(ordersModal);
});

document.addEventListener("keydown", event => {
  if (event.key === "Escape") {
    closeCart();
    closeModal(ordersModal);
  }
});

async function loadProducts() {
  try {
    const response = await fetch("db.json");
    if (!response.ok) throw new Error("No se pudo cargar db.json");
    const database = await response.json();
    products = database.products;
    users = database.users;
    renderProducts();
    updateAccountUI();
  } catch (error) {
    console.error(error);
    emptyState.hidden = false;
    emptyState.textContent = "No se pudo cargar el catálogo de productos.";
  }
}

renderCart();
loadProducts();
