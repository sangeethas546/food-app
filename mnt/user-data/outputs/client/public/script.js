const products = [
  {
    id: 1,
    name: "Margherita Melt",
    price: 12.9,
    category: "Pizza",
    description: "Fresh mozzarella, basil, and herb-infused marinara on a crispy crust.",
    image: "https://images.unsplash.com/photo-1601924582975-4ea67829c32c?auto=format&fit=crop&w=900&q=80",
  },
  {
    id: 2,
    name: "Smoky BBQ Burger",
    price: 14.5,
    category: "Burgers",
    description: "Juicy beef patty, smoked sauce, pickles, and cheddar in a brioche bun.",
    image: "https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=900&q=80",
  },
  {
    id: 3,
    name: "Dragon Roll Sushi",
    price: 18.0,
    category: "Sushi",
    description: "Tempura shrimp roll topped with avocado, mango, and spicy mayo.",
    image: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=900&q=80",
  },
  {
    id: 4,
    name: "Choco Bliss Waffles",
    price: 9.75,
    category: "Desserts",
    description: "Crispy waffles with chocolate drizzle, strawberries, and whipped cream.",
    image: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=900&q=80",
  },
  {
    id: 5,
    name: "Thai Green Curry",
    price: 15.2,
    category: "Entrees",
    description: "Creamy coconut curry with eggplant, basil, and jasmine rice.",
    image: "https://images.unsplash.com/photo-1523986371872-9d3ba2e2f6ef?auto=format&fit=crop&w=900&q=80",
  },
  {
    id: 6,
    name: "Falafel Super Bowl",
    price: 13.5,
    category: "Bowls",
    description: "Crunchy falafel, quinoa, greens, hummus, and tahini dressing.",
    image: "https://images.unsplash.com/photo-1490645935967-10de6ba17061?auto=format&fit=crop&w=900&q=80",
  },
  {
    id: 7,
    name: "Sunrise Smoothie",
    price: 7.95,
    category: "Drinks",
    description: "Mango, orange, and passionfruit blend for a bright, citrus kick.",
    image: "https://images.unsplash.com/photo-1542373676-e94a25bf7608?auto=format&fit=crop&w=900&q=80",
  },
  {
    id: 8,
    name: "Spicy Chicken Tacos",
    price: 11.8,
    category: "Tacos",
    description: "Three corn tacos with chili chicken, pico, crema, and cilantro.",
    image: "https://images.unsplash.com/photo-1552332386-f8dd00dc2f85?auto=format&fit=crop&w=900&q=80",
  },
  {
    id: 9,
    name: "Harvest Power Bowl",
    price: 13.9,
    category: "Bowls",
    description: "Quinoa, roasted veggies, avocado, and tahini for a perfectly balanced meal.",
    image: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=900&q=80",
  },
  {
    id: 10,
    name: "Berry Bliss Parfait",
    price: 8.5,
    category: "Desserts",
    description: "Layered Greek yogurt with berries, granola, and honey drizzle.",
    image: "https://images.unsplash.com/photo-1497032628192-86f99bcd76bc?auto=format&fit=crop&w=900&q=80",
  },
];

const categories = [
  { name: "All", icon: "🍽️" },
  { name: "Pizza", icon: "🍕" },
  { name: "Burgers", icon: "🍔" },
  { name: "Sushi", icon: "🍣" },
  { name: "Desserts", icon: "🍰" },
  { name: "Entrees", icon: "🍛" },
  { name: "Bowls", icon: "🥗" },
  { name: "Drinks", icon: "🥤" },
  { name: "Tacos", icon: "🌮" },
];

let cart = JSON.parse(localStorage.getItem("freshEatsCart")) || {};
let activeCategory = "All";
let searchTerm = "";

const productGrid = document.querySelector(".product-grid");
const categoryList = document.querySelector(".category-list");
const searchInput = document.querySelector("#product-search");
const clearSearchButton = document.querySelector("#clear-search");
const startOrderButton = document.querySelector("#start-order");
const cartToggle = document.querySelector("#cart-toggle");
const cartDrawer = document.querySelector(".cart-panel");
const cartItemsContainer = document.querySelector(".cart-content");
const cartTotal = document.querySelector("#cart-total");
const cartCount = document.querySelector("#cart-count");
const closeCartButton = document.querySelector("#close-cart");
const checkoutButton = document.querySelector("#checkout-button");
const mobileMenuButton = document.querySelector("#mobile-menu-toggle");
const navLinks = document.querySelector(".nav-links");
const toast = document.querySelector("#toast");

function formatCurrency(value) {
  return `$${value.toFixed(2)}`;
}

function saveCart() {
  localStorage.setItem("freshEatsCart", JSON.stringify(cart));
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("visible");
  clearTimeout(showToast.timeout);
  showToast.timeout = setTimeout(() => {
    toast.classList.remove("visible");
  }, 2400);
}

function getFilteredProducts() {
  return products.filter((product) => {
    const matchesCategory = activeCategory === "All" || product.category === activeCategory;
    const filterText = searchTerm.toLowerCase();
    const matchesSearch =
      product.name.toLowerCase().includes(filterText) ||
      product.description.toLowerCase().includes(filterText) ||
      product.category.toLowerCase().includes(filterText);
    return matchesCategory && matchesSearch;
  });
}

function renderProducts() {
  const displayedProducts = getFilteredProducts();

  if (!displayedProducts.length) {
    productGrid.innerHTML = `<div class="product-card" style="text-align:center; grid-column: 1 / -1;"><strong>No dishes match your selection.</strong><p>Try another category or search term.</p></div>`;
    return;
  }

  productGrid.innerHTML = displayedProducts
    .map((product) => {
      return `<article class="product-card">
        <img src="${product.image}" alt="${product.name} photo" loading="lazy" />
        <div class="product-info">
          <h3>${product.name}</h3>
          <p>${product.description}</p>
          <div class="product-meta">
            <span class="product-price">${formatCurrency(product.price)}</span>
            <button class="button-add" data-product-id="${product.id}">Add to cart</button>
          </div>
        </div>
      </article>`;
    })
    .join("");
}

function renderCategories() {
  categoryList.innerHTML = categories
    .map((category) => {
      const activeClass = category.name === activeCategory ? "active-category" : "";
      return `<button class="category-card ${activeClass}" data-category="${category.name}" type="button">
        <span class="category-icon">${category.icon}</span>
        <span>${category.name}</span>
      </button>`;
    })
    .join("");
}

function renderCartSummary() {
  const items = Object.values(cart);
  const total = items.reduce((sum, item) => sum + item.quantity * item.price, 0);
  const totalCount = items.reduce((sum, item) => sum + item.quantity, 0);

  cartTotal.textContent = formatCurrency(total);
  cartCount.textContent = totalCount;

  if (!items.length) {
    cartItemsContainer.innerHTML = `<div class="cart-empty"><strong>Your cart is empty.</strong><p>Add meals from the menu to begin checkout.</p></div>`;
    return;
  }

  cartItemsContainer.innerHTML = items
    .map((item) => {
      return `<div class="cart-item">
        <img src="${item.image}" alt="${item.name} photo" />
        <div class="cart-item-details">
          <div style="display:flex; justify-content:space-between; align-items:center; gap:0.5rem;">
            <strong>${item.name}</strong>
            <button class="remove-item" data-product-id="${item.id}" aria-label="Remove ${item.name}">✕</button>
          </div>
          <span class="product-price">${formatCurrency(item.price)}</span>
          <div class="cart-item-qty">
            <button data-action="decrease" data-product-id="${item.id}">−</button>
            <span>${item.quantity}</span>
            <button data-action="increase" data-product-id="${item.id}">+</button>
          </div>
        </div>
      </div>`;
    })
    .join("");
}

function addToCart(productId) {
  const selectedProduct = products.find((item) => item.id === Number(productId));
  if (!selectedProduct) return;

  if (!cart[selectedProduct.id]) {
    cart[selectedProduct.id] = { ...selectedProduct, quantity: 0 };
  }

  cart[selectedProduct.id].quantity += 1;
  saveCart();
  renderCartSummary();
  showToast(`${selectedProduct.name} added to cart`);
}

function updateCartQuantity(productId, delta) {
  const item = cart[productId];
  if (!item) return;

  item.quantity += delta;
  if (item.quantity <= 0) {
    delete cart[productId];
  }

  saveCart();
  renderCartSummary();
}

function removeCartItem(productId) {
  delete cart[productId];
  saveCart();
  renderCartSummary();
}

function openCart() {
  cartDrawer.classList.add("open");
}

function closeCart() {
  cartDrawer.classList.remove("open");
}

function updateFilter(category) {
  activeCategory = category;
  renderCategories();
  renderProducts();
}

function handleCheckout() {
  const items = Object.values(cart);
  if (!items.length) {
    showToast("Add some meals before checkout.");
    return;
  }

  cart = {};
  saveCart();
  renderCartSummary();
  showToast("Checkout complete! Your order is on the way.");
}

searchInput.addEventListener("input", (event) => {
  searchTerm = event.target.value.trim();
  renderProducts();
});

clearSearchButton.addEventListener("click", () => {
  searchTerm = "";
  searchInput.value = "";
  renderProducts();
});

categoryList.addEventListener("click", (event) => {
  const button = event.target.closest("button[data-category]");
  if (!button) return;
  updateFilter(button.dataset.category);
});

productGrid.addEventListener("click", (event) => {
  const target = event.target.closest("button[data-product-id]");
  if (!target) return;
  addToCart(target.dataset.productId);
  openCart();
});

cartItemsContainer.addEventListener("click", (event) => {
  const actionButton = event.target.closest("button[data-action]");
  const removeButton = event.target.closest("button.remove-item");

  if (actionButton) {
    const productId = actionButton.dataset.productId;
    const actionType = actionButton.dataset.action;
    updateCartQuantity(productId, actionType === "increase" ? 1 : -1);
  }

  if (removeButton) {
    removeCartItem(removeButton.dataset.productId);
  }
});

cartToggle.addEventListener("click", openCart);
closeCartButton.addEventListener("click", closeCart);
checkoutButton.addEventListener("click", handleCheckout);
startOrderButton.addEventListener("click", () => {
  document.querySelector("#menu").scrollIntoView({ behavior: "smooth" });
});

mobileMenuButton.addEventListener("click", () => {
  navLinks.classList.toggle("open");
});

window.addEventListener("click", (event) => {
  if (!event.target.closest(".nav-links") && !event.target.closest("#mobile-menu-toggle")) {
    navLinks.classList.remove("open");
  }
});

window.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    navLinks.classList.remove("open");
    closeCart();
  }
});

renderCategories();
renderProducts();
renderCartSummary();
