/* =========================================================
   NOVAFORM — script.js
   All interactivity: rack rendering, filtering, 3D tilt,
   cursor spotlight, detail overlay, cart, form validation,
   scroll reveal. Vanilla JS only.
   ========================================================= */

(function () {
  "use strict";

  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------------------------------------------------------
     1. Shoe data — swap "colors" / add "img" once real
        product photography is available. The SVG renderer
        below is the placeholder visual.
     --------------------------------------------------------- */
  const SHOES = [
    {
      id: "s1", name: "Aero Strike", category: "running", price: 149,
      img: "image-removebg-preview.png",
      description: "A featherweight trainer with a springy midsole tuned for tempo runs and quick turnovers."
    },
    {
      id: "s2", name: "Court Vector", category: "basketball", price: 179,
      img: "image-removebg-preview (1).png",
      description: "High-top support with a wide base for lateral cuts, built to survive fourth-quarter fatigue."
    },
    {
      id: "s3", name: "Drift Low", category: "casual", price: 99,
      img: "image-removebg-preview (2).png",
      description: "A clean, minimal low-top for everyday wear — soft leather-look upper, all-day comfort."
    },
    {
      id: "s4", name: "Static Hi", category: "streetwear", price: 189,
      img: "image-removebg-preview (3).png",
      description: "Chunky sole, oversized tongue, statement colorway — made to be seen, not just worn."
    },
    {
      id: "s5", name: "Pulse Trainer", category: "sports", price: 129,
      img: "image-removebg-preview (4).png",
      description: "A cross-trainer with a flat, stable base for lifting and a flexible forefoot for agility work."
    },
    {
      id: "s6", name: "Aurora Runner", category: "running", price: 219,
      img: "image-removebg-preview (5).png",
      description: "Our flagship long-distance shoe — reactive foam core wrapped in a single-thread knit upper."
    }
  ];

  /* ---------------------------------------------------------
     2. Product photo renderer — real PNGs (transparent bg)
        living in the same folder as index.html.
     --------------------------------------------------------- */
  function shoePhoto(shoe) {
    return `<img src="${shoe.img}" alt="${shoe.name}" class="shoe-photo" loading="lazy" />`;
  }

  /* ---------------------------------------------------------
     3. Cart state
     --------------------------------------------------------- */
  const cart = []; // { id, name, price, qty }

  function addToCart(shoe) {
    const existing = cart.find((item) => item.id === shoe.id);
    if (existing) {
      existing.qty += 1;
    } else {
      cart.push({ id: shoe.id, name: shoe.name, price: shoe.price, qty: 1, img: shoe.img });
    }
    renderCart();
    bumpCartIcon();
    showToast(`${shoe.name} added to cart`);
  }

  function removeFromCart(id) {
    const idx = cart.findIndex((item) => item.id === id);
    if (idx > -1) cart.splice(idx, 1);
    renderCart();
  }

  function cartTotal() {
    return cart.reduce((sum, item) => sum + item.price * item.qty, 0);
  }

  function cartCount() {
    return cart.reduce((sum, item) => sum + item.qty, 0);
  }

  function renderCart() {
    const itemsEl = document.getElementById("cartItems");
    const emptyEl = document.getElementById("cartEmpty");
    const totalEl = document.getElementById("cartTotal");
    const countEl = document.getElementById("cartCount");

    itemsEl.innerHTML = "";
    if (cart.length === 0) {
      itemsEl.appendChild(emptyEl);
    } else {
      cart.forEach((item) => {
        const row = document.createElement("div");
        row.className = "cart-item";
        row.innerHTML = `
          <div class="cart-item-visual"><img src="${item.img}" alt="${item.name}" class="shoe-photo" /></div>
          <div>
            <div class="cart-item-name">${item.name}</div>
            <div class="cart-item-meta">Qty ${item.qty} &middot; $${item.price * item.qty}</div>
          </div>
          <button class="cart-item-remove" aria-label="Remove ${item.name}" data-remove="${item.id}">&times;</button>
        `;
        itemsEl.appendChild(row);
      });
    }
    totalEl.textContent = "$" + cartTotal();
    countEl.textContent = cartCount();
  }

  function bumpCartIcon() {
    const btn = document.getElementById("cartToggle");
    btn.classList.remove("bump");
    // force reflow so the animation can retrigger
    void btn.offsetWidth;
    btn.classList.add("bump");
  }

  let toastTimer = null;
  function showToast(message) {
    const toast = document.getElementById("toast");
    toast.textContent = message;
    toast.classList.add("is-shown");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove("is-shown"), 2200);
  }

  /* ---------------------------------------------------------
     4. Render the rack
     --------------------------------------------------------- */
  const shelf = document.getElementById("rackShelf");

  function renderRack() {
    shelf.innerHTML = "";
    SHOES.forEach((shoe) => {
      const card = document.createElement("article");
      card.className = "shoe-card reveal is-visible";
      card.dataset.category = shoe.category;
      card.dataset.id = shoe.id;
      card.innerHTML = `
        <div class="card-visual">${shoePhoto(shoe)}</div>
        <p class="card-category">${capitalize(shoe.category)}</p>
        <h3 class="card-name">${shoe.name}</h3>
        <div class="card-bottom">
          <span class="card-price">$${shoe.price}</span>
          <button class="card-explore" type="button">Explore</button>
        </div>
      `;
      card.addEventListener("click", () => openDetail(shoe));
      if (!prefersReducedMotion) attachTilt(card);
      shelf.appendChild(card);
    });
  }

  function capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  /* ---------------------------------------------------------
     5. 3D tilt on hover, per card
     --------------------------------------------------------- */
  function attachTilt(card) {
    const maxTilt = 10;
    card.addEventListener("mousemove", (e) => {
      const rect = card.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width;   // 0..1
      const y = (e.clientY - rect.top) / rect.height;   // 0..1
      const rotY = (x - 0.5) * maxTilt * 2;
      const rotX = (0.5 - y) * maxTilt * 2;
      card.style.transform = `perspective(800px) rotateX(${rotX}deg) rotateY(${rotY}deg) translateY(-6px) translateZ(10px)`;
      card.style.setProperty("--mx", `${x * 100}%`);
      card.style.setProperty("--my", `${y * 100}%`);
    });
    card.addEventListener("mouseleave", () => {
      card.style.transform = "";
    });
  }

  /* ---------------------------------------------------------
     6. Category filtering
     --------------------------------------------------------- */
  const filterRow = document.getElementById("filterRow");
  filterRow.addEventListener("click", (e) => {
    const btn = e.target.closest(".filter-btn");
    if (!btn) return;
    filterRow.querySelectorAll(".filter-btn").forEach((b) => b.classList.remove("is-active"));
    btn.classList.add("is-active");
    applyFilter(btn.dataset.filter);
  });

  function applyFilter(category) {
    const cards = shelf.querySelectorAll(".shoe-card");
    cards.forEach((card) => {
      const matches = category === "all" || card.dataset.category === category;
      if (matches) {
        card.classList.remove("is-hidden");
        requestAnimationFrame(() => {
          card.style.opacity = "1";
          card.style.transform = "";
        });
      } else {
        card.style.opacity = "0";
        card.style.transform = "translateY(12px) scale(0.94)";
        setTimeout(() => {
          if (card.style.opacity === "0") card.classList.add("is-hidden");
        }, 350);
      }
    });
  }

  /* ---------------------------------------------------------
     7. Detail overlay (shoe selection)
     --------------------------------------------------------- */
  const overlay = document.getElementById("detailOverlay");
  const detailVisual = document.getElementById("detailVisual");
  const detailCategory = document.getElementById("detailCategory");
  const detailName = document.getElementById("detailName");
  const detailDesc = document.getElementById("detailDesc");
  const detailPrice = document.getElementById("detailPrice");
  const detailAddToCart = document.getElementById("detailAddToCart");

  let activeShoe = null;

  function openDetail(shoe) {
    activeShoe = shoe;
    detailVisual.innerHTML = shoePhoto(shoe);
    detailCategory.textContent = capitalize(shoe.category);
    detailName.textContent = shoe.name;
    detailDesc.textContent = shoe.description;
    detailPrice.textContent = "$" + shoe.price;
    overlay.classList.add("is-open");

    // dim other cards on the shelf
    shelf.querySelectorAll(".shoe-card").forEach((card) => {
      card.classList.toggle("is-dimmed", card.dataset.id !== shoe.id);
    });
    document.body.style.overflow = "hidden";
  }

  function closeDetail() {
    overlay.classList.remove("is-open");
    shelf.querySelectorAll(".shoe-card").forEach((card) => card.classList.remove("is-dimmed"));
    document.body.style.overflow = "";
  }

  document.getElementById("detailClose").addEventListener("click", closeDetail);
  document.getElementById("detailBackdrop").addEventListener("click", closeDetail);
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      closeDetail();
      closeCart();
    }
  });
  detailAddToCart.addEventListener("click", () => {
    if (activeShoe) addToCart(activeShoe);
    closeDetail();
  });

  /* ---------------------------------------------------------
     8. Cart panel open/close
     --------------------------------------------------------- */
  const cartPanel = document.getElementById("cartPanel");
  const cartScrim = document.getElementById("cartScrim");

  function openCart() {
    cartPanel.classList.add("is-open");
    cartScrim.classList.add("is-open");
    cartPanel.setAttribute("aria-hidden", "false");
  }
  function closeCart() {
    cartPanel.classList.remove("is-open");
    cartScrim.classList.remove("is-open");
    cartPanel.setAttribute("aria-hidden", "true");
  }
  document.getElementById("cartToggle").addEventListener("click", openCart);
  document.getElementById("cartClose").addEventListener("click", closeCart);
  cartScrim.addEventListener("click", closeCart);
  document.getElementById("cartCheckoutBtn").addEventListener("click", closeCart);

  document.getElementById("cartItems").addEventListener("click", (e) => {
    const removeBtn = e.target.closest("[data-remove]");
    if (removeBtn) removeFromCart(removeBtn.dataset.remove);
  });

  /* ---------------------------------------------------------
     9. Featured shoe "Buy Now"
     --------------------------------------------------------- */
  document.getElementById("featuredBuyBtn").addEventListener("click", () => {
    const aurora = SHOES.find((s) => s.id === "s6");
    addToCart(aurora);
  });

  /* ---------------------------------------------------------
     10. Cursor spotlight + subtle hero-shoe tilt toward cursor
     --------------------------------------------------------- */
  const cursorGlow = document.getElementById("cursorGlow");
  const heroShoe = document.getElementById("heroShoe");
  const heroStage = document.getElementById("heroShoeStage");

  if (!prefersReducedMotion) {
    window.addEventListener("mousemove", (e) => {
      cursorGlow.style.transform = `translate(${e.clientX}px, ${e.clientY}px)`;
      cursorGlow.style.opacity = "1";
    });
    window.addEventListener("mouseleave", () => { cursorGlow.style.opacity = "0"; });

    if (heroStage && heroShoe) {
      heroStage.addEventListener("mousemove", (e) => {
        const rect = heroStage.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width - 0.5;
        const y = (e.clientY - rect.top) / rect.height - 0.5;
        heroShoe.style.transform = `rotateY(${x * 18}deg) rotateX(${-y * 14}deg)`;
      });
      heroStage.addEventListener("mouseleave", () => {
        heroShoe.style.transform = "";
      });
    }
  }

  /* ---------------------------------------------------------
     11. Floating particles in hero
     --------------------------------------------------------- */
  function spawnParticles() {
    if (prefersReducedMotion) return;
    const container = document.getElementById("heroParticles");
    const count = window.innerWidth < 720 ? 12 : 24;
    for (let i = 0; i < count; i++) {
      const p = document.createElement("span");
      p.className = "particle";
      p.style.left = Math.random() * 100 + "%";
      p.style.bottom = "-10px";
      p.style.animationDuration = 8 + Math.random() * 10 + "s";
      p.style.animationDelay = Math.random() * 10 + "s";
      p.style.opacity = String(0.3 + Math.random() * 0.4);
      container.appendChild(p);
    }
  }

  /* ---------------------------------------------------------
     12. Header scroll state + mobile nav burger
     --------------------------------------------------------- */
  const header = document.getElementById("siteHeader");
  window.addEventListener("scroll", () => {
    header.classList.toggle("is-scrolled", window.scrollY > 20);
  }, { passive: true });

  const navBurger = document.getElementById("navBurger");
  const mainNav = document.getElementById("mainNav");
  navBurger.addEventListener("click", () => {
    const isOpen = mainNav.classList.toggle("is-open");
    navBurger.setAttribute("aria-expanded", String(isOpen));
  });
  mainNav.querySelectorAll(".nav-link").forEach((link) => {
    link.addEventListener("click", () => {
      mainNav.classList.remove("is-open");
      navBurger.setAttribute("aria-expanded", "false");
    });
  });

  /* ---------------------------------------------------------
     13. Shop Now -> scroll to rack
     --------------------------------------------------------- */
  document.getElementById("shopNowBtn").addEventListener("click", () => {
    document.getElementById("rack").scrollIntoView({ behavior: prefersReducedMotion ? "auto" : "smooth" });
  });

  /* ---------------------------------------------------------
     14. Scroll reveal (IntersectionObserver) + light parallax
     --------------------------------------------------------- */
  const revealTargets = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15 });
    revealTargets.forEach((el) => io.observe(el));
  } else {
    revealTargets.forEach((el) => el.classList.add("is-visible"));
  }

  if (!prefersReducedMotion) {
    window.addEventListener("scroll", () => {
      const y = window.scrollY;
      const orbA = document.querySelector(".orb-a");
      const orbB = document.querySelector(".orb-b");
      if (orbA) orbA.style.transform = `translateY(${y * 0.08}px)`;
      if (orbB) orbB.style.transform = `translateY(${y * -0.06}px)`;
    }, { passive: true });
  }

  /* ---------------------------------------------------------
     15. Populate "Selected Shoe" dropdown in the order form
     --------------------------------------------------------- */
  const selectedShoeField = document.getElementById("selectedShoe");
  SHOES.forEach((shoe) => {
    const opt = document.createElement("option");
    opt.value = shoe.id;
    opt.textContent = `${shoe.name} — $${shoe.price}`;
    selectedShoeField.appendChild(opt);
  });

  /* ---------------------------------------------------------
     16. Order form validation
     --------------------------------------------------------- */
  const orderForm = document.getElementById("orderForm");
  const formSuccess = document.getElementById("formSuccess");

  const validators = {
    fullName: (v) => v.trim().length >= 2 || "Enter your full name.",
    email: (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) || "Enter a valid email address.",
    phone: (v) => /^[+\d][\d\s-]{6,}$/.test(v.trim()) || "Enter a valid phone number.",
    shoeSize: (v) => v.trim().length > 0 || "Enter your shoe size.",
    address: (v) => v.trim().length >= 4 || "Enter your street address.",
    city: (v) => v.trim().length >= 2 || "Enter your city.",
    zip: (v) => /^[A-Za-z0-9\- ]{3,10}$/.test(v.trim()) || "Enter a valid postal/ZIP code.",
    selectedShoe: (v) => v !== "" || "Choose a shoe."
  };

  function validateField(field) {
    const name = field.name;
    if (!validators[name]) return true;
    const result = validators[name](field.value);
    const errorEl = orderForm.querySelector(`[data-error-for="${name}"]`);
    const wrapper = field.closest(".field");
    if (result === true) {
      wrapper.classList.remove("has-error");
      if (errorEl) errorEl.textContent = "";
      return true;
    }
    wrapper.classList.add("has-error");
    if (errorEl) errorEl.textContent = result;
    return false;
  }

  Object.keys(validators).forEach((name) => {
    const field = orderForm.elements[name];
    if (!field) return;
    field.addEventListener("blur", () => validateField(field));
  });

  orderForm.addEventListener("submit", (e) => {
    e.preventDefault();
    let allValid = true;
    Object.keys(validators).forEach((name) => {
      const field = orderForm.elements[name];
      if (field && !validateField(field)) allValid = false;
    });

    if (!allValid) {
      formSuccess.classList.remove("is-shown");
      const firstError = orderForm.querySelector(".has-error");
      if (firstError) firstError.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }

    formSuccess.textContent = "Order details received successfully!";
    formSuccess.classList.add("is-shown");
    orderForm.reset();
  });

  // Pre-fill "Selected Shoe" when a shoe is added to cart, for convenience.
  const originalAddToCart = addToCart;
  window.addEventListener("cart:updated", () => {}); // reserved hook, no-op

  /* ---------------------------------------------------------
     Init
     --------------------------------------------------------- */
  renderRack();
  renderCart();
  spawnParticles();
  document.getElementById("footerYear").textContent = new Date().getFullYear();
})();
