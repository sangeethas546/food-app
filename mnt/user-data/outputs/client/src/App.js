import React, { useEffect, useMemo, useState } from "react";
import api from "./api";

const sampleRestaurants = [
  { name: "Saffron Grill", cuisine: "Indian classics", badge: "Local favorite" },
  { name: "Tokyo Bites", cuisine: "Sushi & ramen", badge: "Fresh catches daily" },
  { name: "Urban Tacos", cuisine: "Street tacos", badge: "Bold spice blends" },
  { name: "Mediterraneo", cuisine: "Mediterranean bowls", badge: "Healthy and vibrant" },
  { name: "Casa Carnitas", cuisine: "Mexican comfort", badge: "Spicy favorites" },
  { name: "Sweet Spoon", cuisine: "Desserts & drinks", badge: "Delightful treats" },
];

const sampleFallbackProducts = [
  {
    id: "f1",
    title: "Classic Margherita Pizza",
    description: "Fresh mozzarella, basil, and tomato sauce on a crispy thin crust.",
    ingredients: "Tomato, mozzarella, basil, olive oil, garlic",
    promotion: "Chef's choice",
    price: 12.9,
    category: "Pizza",
    image: "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=900&q=80",
  },
  {
    id: "f2",
    title: "BBQ Chicken Pizza",
    description: "Smoky barbeque chicken, onions, cilantro, and melted cheddar.",
    ingredients: "Chicken, BBQ sauce, cheddar, onions, cilantro",
    promotion: "Most ordered",
    price: 14.5,
    category: "Pizza",
    image: "https://images.unsplash.com/photo-1548365328-4f9464d368d2?auto=format&fit=crop&w=900&q=80",
  },
  {
    id: "f3",
    title: "Crispy Chicken Tenders",
    description: "Golden fried tenders served with honey mustard dip.",
    ingredients: "Chicken breast, panko, spices, honey mustard",
    promotion: "Family favorite",
    price: 9.75,
    category: "Starters",
    image: "https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?auto=format&fit=crop&w=900&q=80",
  },
  {
    id: "f4",
    title: "Loaded Nacho Platter",
    description: "Tortilla chips with cheese, jalapeños, salsa, and sour cream.",
    ingredients: "Tortilla chips, cheddar, jalapeños, salsa, sour cream",
    promotion: "Great for sharing",
    price: 11.4,
    category: "Snacks",
    image: "https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=900&q=80",
  },
  {
    id: "f5",
    title: "Power Bowl",
    description: "Quinoa, roasted vegetables, avocado, and tahini dressing.",
    ingredients: "Quinoa, sweet potato, avocado, kale, tahini",
    promotion: "Healthy pick",
    price: 13.9,
    category: "Bowls",
    image: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=900&q=80",
  },
  {
    id: "f6",
    title: "Garden Salad",
    description: "Baby greens, cherry tomatoes, cucumbers, and citrus vinaigrette.",
    ingredients: "Mixed greens, tomato, cucumber, feta, citrus dressing",
    promotion: "Fresh choice",
    price: 8.3,
    category: "Meals",
    image: "https://images.unsplash.com/photo-1556911220-e15b29be8c2d?auto=format&fit=crop&w=900&q=80",
  },
  {
    id: "f7",
    title: "Fresh Mango Smoothie",
    description: "Creamy mango, yogurt, and honey blended to perfection.",
    ingredients: "Mango, yogurt, honey, ice, mint",
    promotion: "Refreshing",
    price: 6.5,
    category: "Drinks",
    image: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=900&q=80",
  },
  {
    id: "f8",
    title: "Iced Latte",
    description: "Cold espresso with milk and a touch of vanilla.",
    ingredients: "Espresso, milk, vanilla, ice",
    promotion: "Morning boost",
    price: 5.0,
    category: "Drinks",
    image: "https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=900&q=80",
  },
  {
    id: "f9",
    title: "Chocolate Brownie",
    description: "Warm fudgy brownie topped with chocolate drizzle.",
    ingredients: "Cocoa, butter, sugar, eggs, chocolate sauce",
    promotion: "Sweet choice",
    price: 7.0,
    category: "Desserts",
    image: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=900&q=80",
  },
  {
    id: "f10",
    title: "Garlic Bread",
    description: "Crispy garlic bread with herb butter and parmesan.",
    ingredients: "Baguette, garlic, butter, parsley, parmesan",
    promotion: "Perfect starter",
    price: 5.5,
    category: "Starters",
    image: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=900&q=80",
  },
  {
    id: "f11",
    title: "Fresh Fruit Bowl",
    description: "Seasonal fruit finished with mint and lime.",
    ingredients: "Melon, berries, kiwi, mint, lime",
    promotion: "Light snack",
    price: 8.8,
    category: "Snacks",
    image: "https://images.unsplash.com/photo-1528825871115-3581a5387919?auto=format&fit=crop&w=900&q=80",
  },
  {
    id: "f12",
    title: "Teriyaki Salmon Bowl",
    description: "Grilled salmon, rice, edamame, and sesame dressing.",
    ingredients: "Salmon, rice, edamame, avocado, sesame glaze",
    promotion: "Top rated",
    price: 16.9,
    category: "Bowls",
    image: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=900&q=80",
  },
];

const paymentMethods = ["Credit / Debit Card", "UPI", "Cash on Delivery", "Wallet"];
const orderSteps = ["Preparing food", "Packed", "Out for delivery", "Reaching soon", "Delivered"];

const mapApiProduct = (product) => ({
  id: product._id || product.id,
  _id: product._id || product.id,
  title: product.title || product.name || "Menu item",
  description: product.description || product.summary || "Delicious dish.",
  ingredients: product.ingredients || product.details || "Fresh ingredients",
  promotion: product.promotion || product.badge || "Popular",
  price: typeof product.price === "number" ? product.price : Number(product.price) || 0,
  category: product.category?.name || product.category || "Uncategorized",
  image: product.image || product.photo || "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=900&q=80",
});

const mapCartItem = (item) => {
  const product = item.product || {};
  return {
    id: product._id?.toString() || item.product?.toString() || item.id,
    title: item.name || product.title || "Menu item",
    description: product.description || item.description || "",
    price: item.price || product.price || 0,
    category: product.category?.name || item.category || "Uncategorized",
    image: product.image || item.image || "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=900&q=80",
    quantity: item.quantity || 1,
  };
};

const getCategories = (items) => [
  "All",
  ...Array.from(new Set(items.map((item) => item.category || "Uncategorized"))),
];

const formatCurrency = (value) => `$${value.toFixed(2)}`;

const OrderStatusStep = ({ label, active, completed }) => (
  <div className={`status-step${active ? " active" : ""}${completed ? " completed" : ""}`}>
    <span className="status-dot" />
    <span>{label}</span>
  </div>
);

function App() {
  const [authMode, setAuthMode] = useState("login");
  const [resetPasswordMode, setResetPasswordMode] = useState(false);
  const [authForm, setAuthForm] = useState({ name: "", email: "", phone: "", password: "", confirmPassword: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [notification, setNotification] = useState("");
  const [serverStatus, setServerStatus] = useState("Checking backend...");
  const [products, setProducts] = useState(sampleFallbackProducts);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const [cart, setCart] = useState(() => JSON.parse(localStorage.getItem("freshEatsCart")) || []);
  const [pastOrders, setPastOrders] = useState([]);
  const [user, setUser] = useState(() => JSON.parse(localStorage.getItem("freshEatsUser")) || null);
  const [recentlyAdded, setRecentlyAdded] = useState(null);
  const [checkoutInfo, setCheckoutInfo] = useState({ address: "", paymentMethod: paymentMethods[0] });
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [orderId, setOrderId] = useState("");
  const [orderStep, setOrderStep] = useState(0);
  const [trackingOpen, setTrackingOpen] = useState(true);
  const [cartOpen, setCartOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [profileForm, setProfileForm] = useState({
    name: user?.name || "",
    phone: user?.phone || "",
    address: user?.address || "",
    imagePreview: user?.profileImage || "",
  });

  const categories = useMemo(() => getCategories(products), [products]);
  const filteredProducts = useMemo(
    () =>
      products.filter((product) => {
        const matchesCategory = activeCategory === "All" || product.category === activeCategory;
        const normalizedSearch = searchTerm.trim().toLowerCase();
        return (
          matchesCategory &&
          (!normalizedSearch ||
            [product.title, product.description, product.category].some((value) =>
              value.toLowerCase().includes(normalizedSearch)
            ))
        );
      }),
    [activeCategory, products, searchTerm]
  );

  const cartTotal = cart.reduce((sum, item) => sum + item.quantity * item.price, 0);
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const profileInitials = user?.name
    ? user.name
        .split(" ")
        .map((word) => word[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : "ME";

  const profilePhoto = profileForm.imagePreview || user?.profileImage || "";
  const isGuest = !user;
  const displayName = user?.name || "Guest";

  useEffect(() => {
    localStorage.setItem("freshEatsCart", JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    localStorage.setItem("freshEatsUser", JSON.stringify(user));
    if (user?.token) {
      api.defaults.headers.common.Authorization = `Bearer ${user.token}`;
      fetchCart();
      fetchPastOrders();
      setTimeout(() => document.getElementById("home")?.scrollIntoView({ behavior: "smooth" }), 150);
    } else {
      delete api.defaults.headers.common.Authorization;
      setPastOrders([]);
    }
  }, [user]);

  useEffect(() => {
    setProfileForm({
      name: user?.name || "",
      phone: user?.phone || "",
      address: user?.address || "",
      imagePreview: user?.profileImage || "",
    });
  }, [user]);

  useEffect(() => {
    const cancel = { canceled: false };

    const fetchBackend = async () => {
      try {
        const health = await api.get("/health");
        if (cancel.canceled) return;
        setServerStatus(`Backend connected (${health.data.environment || "online"})`);
      } catch (error) {
        if (cancel.canceled) return;
        setServerStatus("Backend unavailable — running in offline mode.");
      }
    };

    const fetchProducts = async () => {
      try {
        const response = await api.get("/products");
        if (cancel.canceled) return;
        setProducts(response.data.products.map(mapApiProduct));
      } catch (error) {
        if (cancel.canceled) return;
        setProducts(sampleFallbackProducts);
      }
    };

    fetchBackend();
    fetchProducts();
    return () => {
      cancel.canceled = true;
    };
  }, []);

  useEffect(() => {
    if (!orderPlaced) return undefined;
    if (orderStep >= orderSteps.length - 1) return undefined;

    const timer = window.setTimeout(() => {
      setOrderStep((prev) => Math.min(prev + 1, orderSteps.length - 1));
    }, 60000);

    return () => window.clearTimeout(timer);
  }, [orderPlaced, orderStep]);

  useEffect(() => {
    if (!notification) return undefined;
    const timer = window.setTimeout(() => setNotification(""), 2600);
    return () => window.clearTimeout(timer);
  }, [notification]);

  useEffect(() => {
    if (!recentlyAdded) return undefined;
    const timer = window.setTimeout(() => setRecentlyAdded(null), 2200);
    return () => window.clearTimeout(timer);
  }, [recentlyAdded]);

  const showNotification = (message) => {
    setNotification(message);
  };

  const fetchPastOrders = async () => {
    if (!user) {
      setPastOrders([]);
      return;
    }

    try {
      const response = await api.get("/orders");
      setPastOrders(response.data.orders || response.data || []);
    } catch (error) {
      setPastOrders([]);
    }
  };

  const handleBuyNow = () => {
    setActiveCategory("All");
    setSearchTerm("");
    document.getElementById("menu")?.scrollIntoView({ behavior: "smooth" });
  };

  const handleCancelOrder = () => {
    if (!orderPlaced) return;
    if (orderStep >= 2) {
      showNotification("Order cannot be canceled once it is out for delivery.");
      return;
    }
    setOrderPlaced(false);
    setOrderStep(0);
    setOrderId("");
    showNotification("Order canceled. Continue selecting fresh dishes.");
  };

  const fetchCart = async () => {
    if (!user) return;
    try {
      const response = await api.get("/cart");
      setCart(response.data.cart.items.map(mapCartItem));
    } catch (error) {
      showNotification("Unable to load cart from backend.");
    }
  };

  const syncLocalCartToBackend = async (localCartItems, token) => {
    if (!localCartItems?.length || !token) return;
    const authHeader = `Bearer ${token}`;
    try {
      for (const item of localCartItems) {
        await api.post(
          "/cart",
          { productId: item.id, quantity: item.quantity },
          { headers: { Authorization: authHeader } }
        );
      }
    } catch (error) {
      console.warn("Unable to sync saved cart with backend:", error);
    }
  };

  const clearPasswordVisibility = () => {
    setShowPassword(false);
    setShowConfirmPassword(false);
  };

  const handleAuthChange = (e) => {
    const { name, value } = e.target;
    setAuthForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfileForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleProfileImageChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setProfileForm((prev) => ({ ...prev, imagePreview: reader.result }));
    };
    reader.readAsDataURL(file);
  };

  const saveProfileChanges = () => {
    if (!user) {
      showNotification("Please log in to update profile details.");
      return;
    }

    const updatedUser = {
      ...user,
      name: profileForm.name || user.name,
      phone: profileForm.phone,
      address: profileForm.address,
      profileImage: profileForm.imagePreview,
    };

    setUser(updatedUser);
    localStorage.setItem("freshEatsUser", JSON.stringify(updatedUser));
    if (profileForm.address.trim()) {
      setCheckoutInfo((prev) => ({ ...prev, address: profileForm.address }));
    }
    setProfileOpen(false);
    showNotification("Profile updated successfully.");
  };

  const handleAuthSubmit = async (event) => {
    event.preventDefault();
    const { name, email, phone, password, confirmPassword } = authForm;

    if (resetPasswordMode) {
      if (!email) {
        showNotification("Email is required to reset your password.");
        return;
      }
      if (!password) {
        showNotification("New password is required.");
        return;
      }
      if (!confirmPassword) {
        showNotification("Please confirm your new password.");
        return;
      }
      if (password !== confirmPassword) {
        showNotification("Invalid password: confirm password does not match new password.");
        return;
      }

      try {
        await api.post("/auth/reset-password", { email, password, confirmPassword, phone });
        setResetPasswordMode(false);
        setAuthMode("login");
        setAuthForm({ name: "", email: "", phone: "", password: "", confirmPassword: "" });
        clearPasswordVisibility();
        showNotification("Password updated. Please log in with your new password.");
      } catch (error) {
        const serverMessage = error.response?.data?.message;
        const friendlyMessage =
          serverMessage?.includes("Email not found")
            ? "No account was found for that email. Please register first."
            : serverMessage?.includes("Phone number")
            ? serverMessage
            : serverMessage?.includes("confirm")
            ? serverMessage
            : serverMessage || "Unable to reset password. Please try again.";
        showNotification(friendlyMessage);
      }

      return;
    }

    if (authMode === "login") {
      if (!email) {
        showNotification("Enter your email address to sign in.");
        return;
      }
      if (!password) {
        showNotification("Enter your password to sign in.");
        return;
      }
    }

    if (authMode === "register") {
      if (!name) {
        showNotification("Please enter your full name.");
        return;
      }
      if (!email) {
        showNotification("Please enter your email address.");
        return;
      }
      if (!phone) {
        showNotification("Please enter your phone number.");
        return;
      }
      if (!password) {
        showNotification("Please choose a password.");
        return;
      }
    }

    try {
      const payload = authMode === "register" ? { name, email, password, phone } : { email, password };
      const route = authMode === "register" ? "/auth/register" : "/auth/login";
      const response = await api.post(route, payload);
      const userData = { ...response.data.user, token: response.data.token };
      localStorage.setItem("freshEatsUser", JSON.stringify(userData));
      setUser(userData);
      setProfileOpen(false);
      setCartOpen(false);
      api.defaults.headers.common.Authorization = `Bearer ${userData.token}`;
      if (cart.length) {
        await syncLocalCartToBackend(cart, userData.token);
      }
      fetchCart();
      clearPasswordVisibility();
      showNotification(`${authMode === "register" ? "Welcome" : "Welcome back"}, ${response.data.user.name}!`);
      setAuthForm({ name: "", email: "", phone: "", password: "", confirmPassword: "" });
    } catch (error) {
      const serverMessage = error.response?.data?.message;
      const friendlyMessage =
        authMode === "login"
          ? serverMessage?.includes("No user found")
            ? "No account found with that email. Please register first."
            : serverMessage?.includes("Incorrect password")
            ? "Wrong password. Try again or reset your password."
            : serverMessage || "Login failed. Check email and password."
          : authMode === "register"
          ? serverMessage?.includes("Email already registered")
            ? "This email is already registered. Please login or use a different email."
            : serverMessage?.includes("Phone number already registered")
            ? "This phone number is already in use. Please sign in or use another number."
            : serverMessage || "Registration failed. Please review your details."
          : serverMessage || "Authentication failed.";

      showNotification(friendlyMessage);
    }
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem("freshEatsUser");
    setCheckoutInfo({ address: "", paymentMethod: paymentMethods[0] });
    setOrderPlaced(false);
    setOrderStep(0);
    setCart([]);
    setProfileOpen(false);
    setCartOpen(false);
    showNotification("Logged out successfully.");
  };

  const addToCart = async (product) => {
    setRecentlyAdded(product.id);

    if (user) {
      try {
        const response = await api.post("/cart", { productId: product._id || product.id, quantity: 1 });
        setCart(response.data.cart.items.map(mapCartItem));
        showNotification(`${product.title} added to cart.`);
        return;
      } catch (error) {
        showNotification("Could not sync with backend; item added locally.");
      }
    }

    setCart((prev) => {
      const found = prev.find((item) => item.id === product.id);
      if (found) {
        return prev.map((item) =>
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { ...product, quantity: 1 }];
    });
    showNotification(`${product.title} added to cart.`);
  };

  const updateItemQuantity = async (productId, quantity) => {
    if (quantity < 1) {
      removeCartItem(productId);
      return;
    }

    if (user) {
      try {
        const response = await api.patch("/cart", { productId, quantity });
        setCart(response.data.cart.items.map(mapCartItem));
        return;
      } catch (error) {
        showNotification("Unable to update backend cart. Updating locally.");
      }
    }

    setCart((prev) =>
      prev.map((item) => (item.id === productId ? { ...item, quantity } : item))
    );
  };

  const removeCartItem = async (productId) => {
    if (user) {
      try {
        const response = await api.delete("/cart/item", { data: { productId } });
        setCart(response.data.cart.items.map(mapCartItem));
        return;
      } catch (error) {
        showNotification("Unable to remove item from backend cart. Removing locally.");
      }
    }

    setCart((prev) => prev.filter((item) => item.id !== productId));
  };

  const handleCheckoutOpen = () => {
    if (!cart.length) {
      showNotification("Add items to your cart before checkout.");
      return;
    }
    if (!user) {
      showNotification("Please log in to checkout.");
      document.getElementById("auth")?.scrollIntoView({ behavior: "smooth" });
      return;
    }
    document.getElementById("checkout")?.scrollIntoView({ behavior: "smooth" });
  };

  const handlePlaceOrder = async () => {
    if (!cart.length) {
      showNotification("Your cart is empty.");
      return;
    }
    if (!user) {
      showNotification("Please log in to place an order.");
      document.getElementById("auth")?.scrollIntoView({ behavior: "smooth" });
      return;
    }
    if (!checkoutInfo.address.trim()) {
      showNotification("Enter your delivery address.");
      return;
    }

    try {
      const response = await api.post("/orders", {
        shippingAddress: checkoutInfo.address,
        paymentMethod: checkoutInfo.paymentMethod,
      });
      setOrderPlaced(true);
      setOrderId(response.data.order._id || `FE${Date.now().toString().slice(-6)}`);
      setOrderStep(0);
      setTrackingOpen(true);
      setCart([]);
      setCheckoutInfo({ address: "", paymentMethod: paymentMethods[0] });
      await api.delete("/cart");
      fetchPastOrders();
      showNotification("Order placed successfully! Track it below.");
    } catch (error) {
      showNotification(error.response?.data?.message || "Checkout failed. Please try again.");
    }
  };

  const displayedProducts = filteredProducts;
  const heroDescription =
    "Fresh menus and fast checkout for pizzas, snacks, meals, drinks, starters, and desserts.";

  if (!user) {
    return (
      <div className="auth-layout">
        <section className="auth-panel">
          <div className="section-title">
            <span className="eyebrow">Save your order</span>
            <h2>
              {resetPasswordMode
                ? "Reset your password"
                : authMode === "register"
                ? "Create your FreshEats account"
                : "Existing user sign in"}
            </h2>
            <p>
              {resetPasswordMode
                ? "Enter your email and a new password to update your account."
                : authMode === "register"
                ? "Register to save orders, track delivery, and checkout faster."
                : "Sign in to save your cart and place your first order."}
            </p>
          </div>
          {!resetPasswordMode && (
            <div className="auth-toggle">
              <button
                className={`button-secondary ${authMode === "login" ? "active" : ""}`}
                type="button"
                onClick={() => {
                  setAuthMode("login");
                  clearPasswordVisibility();
                }}
              >
                Login
              </button>
              <button
                className={`button-secondary ${authMode === "register" ? "active" : ""}`}
                type="button"
                onClick={() => {
                  setAuthMode("register");
                  clearPasswordVisibility();
                }}
              >
                Register
              </button>
            </div>
          )}
          <form className="auth-form" onSubmit={handleAuthSubmit}>
            {resetPasswordMode ? (
              <>
                <label>
                  Account email
                  <input name="email" value={authForm.email} onChange={handleAuthChange} placeholder="name@example.com" />
                </label>
                <label>
                  New password
                  <div className="password-input-wrapper">
                    <input
                      type={showPassword ? "text" : "password"}
                      name="password"
                      value={authForm.password}
                      onChange={handleAuthChange}
                      placeholder="New password"
                    />
                    <button
                      type="button"
                      className="password-toggle"
                      onClick={() => setShowPassword((prev) => !prev)}
                    >
                      {showPassword ? "Hide" : "Show"}
                    </button>
                  </div>
                </label>
                <label>
                  Confirm new password
                  <div className="password-input-wrapper">
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      name="confirmPassword"
                      value={authForm.confirmPassword}
                      onChange={handleAuthChange}
                      placeholder="Confirm password"
                    />
                    <button
                      type="button"
                      className="password-toggle"
                      onClick={() => setShowConfirmPassword((prev) => !prev)}
                    >
                      {showConfirmPassword ? "Hide" : "Show"}
                    </button>
                  </div>
                </label>
                <label>
                  Phone number (optional)
                  <input name="phone" value={authForm.phone} onChange={handleAuthChange} placeholder="Phone number" />
                </label>
                <button type="submit" className="button-primary">
                  Reset password
                </button>
                <button
                  type="button"
                  className="button-secondary"
                  onClick={() => {
                    setResetPasswordMode(false);
                    setAuthForm((prev) => ({ ...prev, password: "", confirmPassword: "" }));
                    clearPasswordVisibility();
                  }}
                >
                  Back to login
                </button>
              </>
            ) : (
              <>
                {authMode === "register" && (
                  <>
                    <label>
                      Full name
                      <input name="name" value={authForm.name} onChange={handleAuthChange} placeholder="Your name" />
                    </label>
                    <label>
                      Phone number
                      <input name="phone" value={authForm.phone} onChange={handleAuthChange} placeholder="Phone number" />
                    </label>
                  </>
                )}
                <label>
                  Email address
                  <input name="email" value={authForm.email} onChange={handleAuthChange} placeholder="name@example.com" />
                </label>
                <label>
                  Password
                  <div className="password-input-wrapper">
                    <input
                      type={showPassword ? "text" : "password"}
                      name="password"
                      value={authForm.password}
                      onChange={handleAuthChange}
                      placeholder="Password"
                    />
                    <button
                      type="button"
                      className="password-toggle"
                      onClick={() => setShowPassword((prev) => !prev)}
                    >
                      {showPassword ? "Hide" : "Show"}
                    </button>
                  </div>
                </label>
                <button type="submit" className="button-primary">
                  {authMode === "register" ? "Create account" : "Sign in"}
                </button>
                {authMode === "login" && (
                  <button
                    type="button"
                    className="button-link"
                    onClick={() => {
                      setResetPasswordMode(true);
                      setAuthForm((prev) => ({ ...prev, password: "", confirmPassword: "" }));
                      clearPasswordVisibility();
                    }}
                  >
                    Forgot password?
                  </button>
                )}
              </>
            )}
          </form>
          <div className="trust-bar">
            <strong>Backend status:</strong> {serverStatus}
          </div>
          {notification && <div className="toast visible">{notification}</div>}
        </section>
      </div>
    );
  }

  return (
    <div className="app-shell">
      <header className="site-header">
        <div className="page-container navbar">
          <a href="#home" className="brand">
            <span className="brand-mark">FE</span>
            <span>FreshEats</span>
          </a>
          <nav className="nav-links" aria-label="Primary navigation">
            <a href="#home">Home</a>
            <a href="#restaurants">Restaurants</a>
            <a href="#menu">Menu</a>
            <a href="#cart">Cart</a>
            <a href="#checkout">Checkout</a>
            {orderPlaced && <a href="#tracking">Track order</a>}
          </nav>
          <div className="nav-actions">
            <button className="button-icon" type="button" onClick={() => setCartOpen((prev) => !prev)}>
              <span className="icon">🛒</span>
              <span className="icon-badge">{cartCount}</span>
            </button>
            <button
              className="button-icon profile-button"
              type="button"
              onClick={() => setProfileOpen(true)}
              onTouchStart={() => setProfileOpen(true)}
            >
              <span className="profile-avatar">
                {profilePhoto ? (
                  <img src={profilePhoto} alt="Profile" style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "50%" }} />
                ) : (
                  profileInitials
                )}
              </span>
              <span className="profile-name">{displayName}</span>
            </button>
            <button className="button-primary" type="button" onClick={handleBuyNow}>
              Buy now
            </button>
            {isGuest ? (
              <button
                className="button-secondary"
                type="button"
                onClick={() => document.getElementById("auth")?.scrollIntoView({ behavior: "smooth" })}
              >
                Login
              </button>
            ) : (
              <button className="button-secondary" type="button" onClick={handleLogout}>
                Logout
              </button>
            )}
          </div>
        </div>
      </header>
      <main className="page-container">
        {profileOpen && (
          <section className="profile-dropdown">
            <div className="profile-dropdown-inner">
              <div className="profile-dropdown-header">
                <div className="profile-avatar profile-dropdown-avatar">{profileInitials}</div>
                <div>
                  <strong>{displayName}</strong>
                  <p>Tap to manage your profile, orders and contact details.</p>
                </div>
              </div>
              <div className="profile-dropdown-details">
                <div className="profile-form-grid">
                  <label className="profile-input-group">
                    <strong>Profile photo</strong>
                    <div className="profile-image-upload">
                      {profilePhoto ? (
                        <img
                          src={profilePhoto}
                          alt="Profile preview"
                          className="profile-photo-preview"
                          style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "50%" }}
                        />
                      ) : (
                        <div className="profile-avatar profile-dropdown-avatar">{profileInitials}</div>
                      )}
                      <input type="file" accept="image/*" onChange={handleProfileImageChange} />
                    </div>
                  </label>
                  <label className="profile-input-group">
                    <strong>Full name</strong>
                    <input
                      type="text"
                      name="name"
                      value={profileForm.name}
                      onChange={handleProfileChange}
                      placeholder="Enter your name"
                    />
                  </label>
                  <label className="profile-input-group">
                    <strong>Phone</strong>
                    <input
                      type="text"
                      name="phone"
                      value={profileForm.phone}
                      onChange={handleProfileChange}
                      placeholder="Enter your phone number"
                    />
                  </label>
                  <label className="profile-input-group">
                    <strong>Delivery address</strong>
                    <textarea
                      name="address"
                      value={profileForm.address}
                      onChange={handleProfileChange}
                      placeholder="Enter your address"
                      rows={3}
                    />
                  </label>
                </div>
                <div className="profile-summary">
                  <div>
                    <strong>Email</strong>
                    <p>{user?.email || "Not set"}</p>
                  </div>
                  <div>
                    <strong>Past orders</strong>
                    <p>{pastOrders.length} orders</p>
                  </div>
                </div>
              </div>
              <div className="profile-dropdown-actions">
                <button type="button" className="button-secondary" onClick={saveProfileChanges}>
                  Save profile
                </button>
                <button
                  type="button"
                  className="button-secondary"
                  onClick={() => {
                    setProfileOpen(false);
                    setTimeout(() => {
                      document.getElementById("past-orders")?.scrollIntoView({ behavior: "smooth" });
                    }, 100);
                  }}
                >
                  View past orders
                </button>
                <button type="button" className="button-primary" onClick={handleLogout}>
                  Logout
                </button>
              </div>
            </div>
          </section>
        )}
        <div style={{ display: profileOpen ? "none" : undefined }}>
        {cartOpen && (
          <div className="cart-overlay" onClick={() => setCartOpen(false)}>
            <div className="cart-drawer" onClick={(e) => e.stopPropagation()}>
              <div className="cart-drawer-header">
                <div>
                  <strong>Your cart</strong>
                  <p>{cartCount} items ready to order</p>
                </div>
                <button className="button-secondary" type="button" onClick={() => setCartOpen(false)}>
                  Close
                </button>
              </div>
              {cart.length === 0 ? (
                <div className="empty-cart">
                  <p>Your cart is empty. Add items from the menu.</p>
                </div>
              ) : (
                <div className="cart-drawer-items">
                  {cart.map((item) => (
                    <article key={item.id} className="cart-item">
                      <img src={item.image} alt={item.title} />
                      <div className="cart-item-details">
                        <strong>{item.title}</strong>
                        <p>{formatCurrency(item.price)} each</p>
                        <div className="quantity-controls">
                          <button type="button" onClick={() => updateItemQuantity(item.id, item.quantity - 1)}>-</button>
                          <span>{item.quantity}</span>
                          <button type="button" onClick={() => updateItemQuantity(item.id, item.quantity + 1)}>+</button>
                        </div>
                      </div>
                      <button className="button-link" type="button" onClick={() => removeCartItem(item.id)}>
                        Remove
                      </button>
                    </article>
                  ))}
                </div>
              )}
              <div className="cart-drawer-actions">
                <button type="button" className="button-primary" onClick={() => { setCartOpen(false); document.getElementById("cart")?.scrollIntoView({ behavior: "smooth" }); }}>
                  Open full cart
                </button>
              </div>
            </div>
          </div>
        )}

        <section id="home" className="hero">
          <div className="hero-copy">
            <span className="eyebrow">Fast delivery from top kitchens.</span>
            <h1>Order fresh meals, drinks, snacks, and pizza seamlessly.</h1>
            <p>{heroDescription}</p>
            <p className="hero-subtext">
             Why choose us? Unlike other food delivery apps, we bring trusted restaurants and the healthiest food options together in one place. No matter which restaurant or dish you’re craving, you’ll find it here — at the most affordable prices.</p>
            <div className="hero-actions">
              <button className="button-primary" type="button" onClick={() => document.getElementById("menu").scrollIntoView({ behavior: "smooth" })}>
                Browse menu
              </button>
              <button className="button-secondary" type="button" onClick={() => document.getElementById("restaurants").scrollIntoView({ behavior: "smooth" })}>
                See restaurants
              </button>
            </div>
            <div className="hero-highlights">
              <div>
                <strong>{cartCount}</strong>
                <p>Items selected</p>
              </div>
              <div>
                <strong>{formatCurrency(cartTotal)}</strong>
                <p>Cart total</p>
              </div>
              <div>
                <strong>{serverStatus.includes("connected") ? "Online" : "Offline"}</strong>
                <p>Backend status</p>
              </div>
            </div>
          </div>
          <div className="hero-visual">
            <div className="hero-image-card">
              <img src="https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=900&q=80" alt="Food service on phone" />
            </div>
          </div>
        </section>
        <section id="restaurants" className="section-block">
          <div className="section-title">
            <h2>Featured restaurants</h2>
            <p>Choose from great kitchens serving curated meals, pizza, snacks, and drinks.</p>
          </div>
          <div className="feature-grid">
            {sampleRestaurants.map((restaurant) => (
              <article key={restaurant.name} className="feature-card">
                <strong>{restaurant.name}</strong>
                <p>{restaurant.cuisine}</p>
                <span>{restaurant.badge}</span>
              </article>
            ))}
          </div>
        </section>
        <section id="menu" className="section-block">
          <div className="section-title">
            <div>
              <h2>Food items</h2>
              <p>Select from drinks, meals, starters, snacks, pizza, and desserts.</p>
            </div>
            <div className="trust-bar">
              <strong>Backend:</strong> {serverStatus}
            </div>
          </div>
          <div className="filter-bar">
            <input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search dishes, categories, or ingredients"
              aria-label="Search menu"
            />
            <button className="button-secondary" type="button" onClick={() => setSearchTerm("")}>Clear</button>
            <select value={activeCategory} onChange={(e) => setActiveCategory(e.target.value)}>
              {categories.map((category) => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>
          <div className="product-grid">
            {displayedProducts.map((product) => (
              <article key={product.id} className="product-card">
                <img src={product.image} alt={product.title} />
                <div className="product-info">
                  <h3>{product.title}</h3>
                  <p>{product.description}</p>
                  {product.ingredients && (
                    <p className="product-ingredients">
                      <strong>Ingredients:</strong> {product.ingredients}
                    </p>
                  )}
                  {product.promotion && <span className="product-badge">{product.promotion}</span>}
                  <div className="product-meta">
                    <span>{product.category}</span>
                    <span className="product-price">{formatCurrency(product.price)}</span>
                  </div>
                  <button className="button-add" type="button" onClick={() => addToCart(product)}>
                    {recentlyAdded === product.id ? "Added to cart" : "Add to cart"}
                  </button>
                </div>
              </article>
            ))}
            {!displayedProducts.length && (
              <article className="product-card empty-state">
                <strong>No items match your search.</strong>
                <p>Try a different category or keyword.</p>
              </article>
            )}
          </div>
        </section>
        <section id="cart" className="section-block cart-panel">
          <div className="section-title">
            <h2>Your Cart</h2>
            <p>Review selected items before checkout.</p>
          </div>
          <div className="cart-grid">
            <div className="cart-content">
              {cart.length === 0 ? (
                <div className="empty-cart">
                  <p>Your cart is empty. Add items to start ordering now.</p>
                </div>
              ) : (
                <div className="cart-items">
                  {cart.map((item) => (
                    <article key={item.id} className="cart-item">
                      <img src={item.image} alt={item.title} />
                      <div className="cart-item-details">
                        <strong>{item.title}</strong>
                        <p>{item.category}</p>
                        <p>{formatCurrency(item.price)} each</p>
                        <div className="quantity-controls">
                          <button type="button" onClick={() => updateItemQuantity(item.id, item.quantity - 1)}>-</button>
                          <span>{item.quantity}</span>
                          <button type="button" onClick={() => updateItemQuantity(item.id, item.quantity + 1)}>+</button>
                        </div>
                      </div>
                      <button className="button-link" type="button" onClick={() => removeCartItem(item.id)}>
                        Remove
                      </button>
                    </article>
                  ))}
                </div>
              )}
            </div>
            <aside className="profile-canvas">
              <div className="profile-header">
              <div className="profile-avatar">{profileInitials}</div>
              <div>
                <h3>{displayName}</h3>
                <p className="profile-role">{isGuest ? "Guest mode" : "Your profile"}</p>
              </div>
            </div>
            <div className="profile-details">
              <div>
                <strong>Email</strong>
                <p>{user?.email || "Not signed in"}</p>
              </div>
              {user?.phone && (
                <div>
                  <strong>Phone</strong>
                  <p>{user.phone}</p>
                </div>
              )}
              <div>
                <strong>Items in cart</strong>
                <p>{cartCount}</p>
              </div>
              <div>
                <strong>Cart total</strong>
                <p>{formatCurrency(cartTotal)}</p>
              </div>
            </div>
            <button className="button-secondary" type="button" onClick={() => document.getElementById("past-orders")?.scrollIntoView({ behavior: "smooth" })}>
              View past orders
            </button>
            <button
              className="button-primary"
              type="button"
              onClick={isGuest ? () => document.getElementById("auth")?.scrollIntoView({ behavior: "smooth" }) : handleLogout}
            >
              {isGuest ? "Login" : "Logout"}
            </button>
            </aside>
          </div>
        </section>
        <section id="checkout" className="section-block">
          <div className="section-title">
            <h2>Checkout</h2>
            <p>Finish your order with quick payment and delivery details.</p>
          </div>
          <article className="checkout-grid">
            <div className="summary-card">
              <h3>Order summary</h3>
              <div className="summary-row">
                <span>Items</span>
                <span>{cartCount}</span>
              </div>
              <div className="summary-row">
                <span>Subtotal</span>
                <span>{formatCurrency(cartTotal)}</span>
              </div>
              <div className="summary-row">
                <span>Delivery fee</span>
                <span>{formatCurrency(5)}</span>
              </div>
              <div className="summary-row total-row">
                <span>Total</span>
                <span>{formatCurrency(cartTotal + 5)}</span>
              </div>
              <button type="button" className="button-primary" onClick={handleCheckoutOpen}>
                Confirm order
              </button>
            </div>
            <div className="checkout-form">
              <label>
                Delivery address
                <textarea
                  value={checkoutInfo.address}
                  onChange={(e) => setCheckoutInfo((prev) => ({ ...prev, address: e.target.value }))}
                  placeholder="Enter your delivery address"
                  rows={4}
                />
              </label>
              <label>
                Payment option
                <select
                  value={checkoutInfo.paymentMethod}
                  onChange={(e) => setCheckoutInfo((prev) => ({ ...prev, paymentMethod: e.target.value }))}
                >
                  {paymentMethods.map((option) => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              </label>
              <button type="button" className="button-primary" onClick={handlePlaceOrder}>
                Place order
              </button>
            </div>
          </article>
        </section>
        <section id="past-orders" className="section-block">
          <div className="section-title">
            <h2>Past orders</h2>
            <p>Review your saved orders, or start a new meal today.</p>
          </div>
          {pastOrders.length === 0 ? (
            <div className="empty-cart">
              <p>No past orders yet. Add items to the cart and place your first order.</p>
            </div>
          ) : (
            <div className="cart-items">
              {pastOrders.map((order) => {
                const orderDate = new Date(order.createdAt || order.createdAtAt || Date.now());
                const orderTotal = order.totalPrice || order.total || 0;
                return (
                  <article key={order._id || order.id || order.orderId} className="cart-item">
                    <div className="cart-item-details">
                      <strong>Order {order._id || order.id || order.orderId}</strong>
                      <p>{order.status || "Pending"} • {orderDate.toLocaleDateString()}</p>
                      <p>{order.items?.length ? `${order.items.length} item${order.items.length > 1 ? "s" : ""}` : "No items listed"}</p>
                      <p>Total: {formatCurrency(orderTotal)}</p>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
        {orderPlaced && (
          <section id="tracking" className="section-block">
            <div className="section-title">
              <h2>Order tracking</h2>
              <p>Your order ID: {orderId}. Track every stage until delivery.</p>
            </div>
            {trackingOpen ? (
              <div className="tracking-card">
                <div className="tracking-bar">
                  <div className="tracking-progress" style={{ width: `${(orderStep / (orderSteps.length - 1)) * 100}%` }} />
                </div>
                <div className="status-grid">
                  {orderSteps.map((step, index) => (
                    <OrderStatusStep
                      key={step}
                      label={step}
                      active={orderStep === index}
                      completed={orderStep > index}
                    />
                  ))}
                </div>
                <div className="status-message">
                  <strong>{orderSteps[orderStep]}</strong>
                  <p>{orderStep < orderSteps.length - 1 ? "Your order is on the way." : "Delivered — enjoy your meal!"}</p>
                </div>
                <div className="tracking-actions">
                  <button className="button-secondary" type="button" onClick={() => setTrackingOpen((prev) => !prev)}>
                    {trackingOpen ? "Hide tracking" : "Show tracking"}
                  </button>
                  <button
                    className="button-secondary button-cancel"
                    type="button"
                    disabled={orderStep >= 2}
                    onClick={handleCancelOrder}
                  >
                    {orderStep >= 2 ? "Cannot cancel" : "Cancel order"}
                  </button>
                </div>
              </div>
            ) : (
              <div className="tracking-card tracking-collapsed">
                <p>Tracking updates are hidden. Click Show tracking to reveal the latest delivery status.</p>
                <div className="tracking-actions">
                  <button className="button-secondary" type="button" onClick={() => setTrackingOpen(true)}>
                    Show tracking
                  </button>
                  <button
                    className="button-secondary button-cancel"
                    type="button"
                    disabled={orderStep >= 2}
                    onClick={handleCancelOrder}
                  >
                    {orderStep >= 2 ? "Cannot cancel" : "Cancel order"}
                  </button>
                </div>
              </div>
            )}
          </section>
        )}
        </div>
      </main>
      {user && (
        <button
          className="floating-profile-button"
          type="button"
          onClick={() => {
            setProfileOpen(true);
            document.getElementById("home")?.scrollIntoView({ behavior: "smooth" });
          }}
          onTouchStart={() => {
            setProfileOpen(true);
            document.getElementById("home")?.scrollIntoView({ behavior: "smooth" });
          }}
        >
          <span className="profile-avatar">
            {profilePhoto ? (
              <img src={profilePhoto} alt="Profile" style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "50%" }} />
            ) : (
              profileInitials
            )}
          </span>
          <span className="floating-profile-text">{displayName}</span>
        </button>
      )}
      <footer className="page-container footer">
        <div className="footer-grid">
          <div className="footer-column">
            <h4>FreshEats</h4>
            <p>Delicious delivery, secure checkout, and a modern ordering experience for every meal.</p>
          </div>
          <div className="footer-column">
            <h4>Quick links</h4>
            <ul>
              <li><a href="#home">Home</a></li>
              <li><a href="#restaurants">Restaurants</a></li>
              <li><a href="#menu">Menu</a></li>
              <li><a href="#tracking">Track order</a></li>
            </ul>
          </div>
          <div className="footer-column">
            <h4>Contact</h4>
            <ul>
              <li><a href="mailto:hello@fresheats.app">hello@fresheats.app</a></li>
              <li><a href="tel:+1234567890">+1 (234) 567-890</a></li>
            </ul>
          </div>
        </div>
      </footer>
      {notification && <div className="toast visible">{notification}</div>}
    </div>
  );
}

export default App;
