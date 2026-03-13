// ----- CONFIG -----
// Replace this with your real WhatsApp business number (with country code, no + or 0)
const WHATSAPP_NUMBER = "9384002135";

// Google Apps Script Web App URL (for saving form data to Google Sheet)
const GOOGLE_APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbxeRkryBOiJ-URxigWaJyVaQGyaJVxbMzvdvPFSKo8FOHZezk5xT6jQC0SJ0ouNz6GjIg/exec";

// Destination data (text + gallery images)
const DESTINATIONS = {
  goa: {
    title: "Goa – Sun, Sand & Music",
    subtitle: "Perfect weekend escape with beaches, cafes, and nightlife.",
    description: `
      <p>
        Think golden beaches, sunset cruises, and beach shacks with live music.
        We curate relaxed itineraries with time for both adventure and doing
        absolutely nothing.
      </p>
      <ul>
        <li>Stay in cosy beachside stays or boutique resorts.</li>
        <li>Curated café-hopping trails and sunset points.</li>
        <li>Optional water sports and night market visits.</li>
      </ul>
    `,
    gallery: [
      "images/shacks.jpg",
      "images/sunset2.jpg",
      "images/night.webp"
    ]
  },
  ooty: {
    title: "Ooty – Misty Hill Retreat",
    subtitle: "Cool mountain air & tea estates for slow travel lovers.",
    description: `
      <p>
        Rolling hills, eucalyptus trees, and toy-train views. Ooty is perfect
        for slow mornings, scenic drives, and family-friendly walks.
      </p>
      <ul>
        <li>Stay in heritage bungalows or hillside cottages.</li>
        <li>Tea factory tours, lakes, and viewpoint drives.</li>
        <li>Kid-friendly experiences like toy train rides.</li>
      </ul>
    `,
    gallery: [
      "images/tea2.jpg",
      "images/toytrain.jpg",
      "images/Mountain.jpeg"
    ]
  },
  andaman: {
    title: "Andaman – Tropical Lagoon",
    subtitle: "Crystal clear waters, coral reefs & island sunsets.",
    description: `
      <p>
        Andaman is a dream for beach lovers and water babies. We help you
        balance snorkelling, island hopping and lazy hammock days.
      </p>
      <ul>
        <li>Handpicked island stays near quiet beaches.</li>
        <li>Optional snorkelling, scuba, and glass-bottom boat tours.</li>
        <li>Sunset spots and local seafood recommendations.</li>
      </ul>
    `,
    gallery: [
      "images/turquoise.jpg",
      "images/coral.jpg",
      "images/hopping.webp"
    ]
  },
  coorg: {
    title: "Coorg – Coffee & Clouds",
    subtitle: "Misty hills, plantations & cosy fireplace evenings.",
    description: `
      <p>
        Coorg is made for long walks in coffee estates, waterfalls, and homely
        meals. Ideal for couples, families and small groups.
      </p>
      <ul>
        <li>Plantation homestays with authentic Kodava cuisine.</li>
        <li>Waterfall visits and nature trails.</li>
        <li>Bonfire evenings and slow travel itineraries.</li>
      </ul>
    `,
    gallery: [
      "images/plantationstay.webp",
      "images/coorgwater.jpg",
      "images/serene.webp"
    ]
  }
};

// Scenic themes to subtly randomise text emphasis or background mood
const HERO_THEMES = [
  { tag: "Ocean escapes", subtitle: "From turquoise waters to sunset cruises, your next ocean story begins here." },
  { tag: "Hills & valleys", subtitle: "Wake up to the clouds, sip hot chai, and breathe in the mountain air." },
  { tag: "Tropical getaways", subtitle: "Palm trees, soft sands, and curated island experiences, just for you." }
];

// State for lightbox
let currentGallery = [];
let currentIndex = 0;
let currentDestinationKey = "";

// Helpers
function setCurrentYear() {
  const yearSpan = document.getElementById("currentYear");
  if (yearSpan) {
    yearSpan.textContent = new Date().getFullYear();
  }
}

function initHeroTheme() {
  const random = HERO_THEMES[Math.floor(Math.random() * HERO_THEMES.length)];
  const taglineEl = document.querySelector(".hero-tagline");
  const subtitleEl = document.querySelector(".hero-subtitle");

  if (taglineEl) {
    taglineEl.textContent = `Curated ${random.tag}`;
  }
  if (subtitleEl) {
    subtitleEl.textContent = random.subtitle;
  }
}

function buildGallery(galleryImages) {
  const galleryContainer = document.getElementById("detailGallery");
  if (!galleryContainer) return;

  galleryContainer.innerHTML = "";

  currentGallery = galleryImages || [];

  currentGallery.forEach((src, index) => {
    const img = document.createElement("img");
    img.src = src;
    img.alt = "Destination photo " + (index + 1);
    img.dataset.index = index;
    img.addEventListener("click", () => openLightbox(index));
    galleryContainer.appendChild(img);
  });
}

function updateDestinationDetail(key) {
  const data = DESTINATIONS[key];
  if (!data) return;

  currentDestinationKey = key;

  const titleEl = document.getElementById("detailTitle");
  const subtitleEl = document.getElementById("detailSubtitle");
  const descEl = document.getElementById("detailDescription");
  const formDestination = document.getElementById("formDestination");

  if (titleEl) titleEl.textContent = data.title;
  if (subtitleEl) subtitleEl.textContent = data.subtitle;
  if (descEl) descEl.innerHTML = data.description;
  if (formDestination) formDestination.value = data.title;

  buildGallery(data.gallery);

  // Smooth scroll to detail section
  document.getElementById("destinationDetail").scrollIntoView({ behavior: "smooth" });
}

/* WhatsApp helpers */
function openWhatsappChat(preFilledText = "") {
  const encodedMsg = encodeURIComponent(preFilledText);
  const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodedMsg}`;
  window.open(url, "_blank");
}

/* Form submit to Google Sheets via Apps Script */
async function handleFormSubmit(event) {
  event.preventDefault();
  const form = event.target;
  const statusEl = document.getElementById("formStatus");
  if (!statusEl) return;

  statusEl.textContent = "Submitting…";

  const formData = new FormData(form);
  const payload = {
    name: formData.get("name"),
    email: formData.get("email"),
    phone: formData.get("phone"),
    destination: formData.get("destination") || currentDestinationKey || "General enquiry",
    timestamp: new Date().toISOString()
  };

  try {
    const response = await fetch(GOOGLE_APPS_SCRIPT_URL, {
      method: "POST",
      mode: "no-cors", // Apps Script often uses no-cors; remove/adjust if you manage CORS
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    // With no-cors we can't inspect response, so just show success
    statusEl.textContent = "Thank you! We will get back to you soon.";
    form.reset();
  } catch (error) {
    console.error("Error submitting form:", error);
    statusEl.textContent = "Something went wrong. Please try again or connect via WhatsApp.";
  }
}

/* Modal helpers */
function openEnquiryModal() {
  const modal = document.getElementById("enquiryModal");
  if (modal) {
    modal.classList.add("active");
    modal.setAttribute("aria-hidden", "false");
  }
}

function closeEnquiryModal() {
  const modal = document.getElementById("enquiryModal");
  const statusEl = document.getElementById("formStatus");
  if (modal) {
    modal.classList.remove("active");
    modal.setAttribute("aria-hidden", "true");
  }
  if (statusEl) statusEl.textContent = "";
}

/* Lightbox */
function openLightbox(index) {
  const modal = document.getElementById("lightboxModal");
  const imgEl = document.getElementById("lightboxImage");
  if (!modal || !imgEl) return;

  currentIndex = index;
  imgEl.src = currentGallery[currentIndex];
  modal.classList.add("active");
  modal.setAttribute("aria-hidden", "false");
}

function closeLightbox() {
  const modal = document.getElementById("lightboxModal");
  if (modal) {
    modal.classList.remove("active");
    modal.setAttribute("aria-hidden", "true");
  }
}

function showNextImage() {
  if (!currentGallery.length) return;
  currentIndex = (currentIndex + 1) % currentGallery.length;
  document.getElementById("lightboxImage").src = currentGallery[currentIndex];
}

function showPrevImage() {
  if (!currentGallery.length) return;
  currentIndex = (currentIndex - 1 + currentGallery.length) % currentGallery.length;
  document.getElementById("lightboxImage").src = currentGallery[currentIndex];
}

/* Event Listeners */
document.addEventListener("DOMContentLoaded", () => {
  setCurrentYear();
  initHeroTheme();

    initLuxuryNavbar();
// Destination thumbnail clicks
  document.querySelectorAll(".destination-card").forEach(card => {
    card.addEventListener("click", () => {
      const id = card.getAttribute("data-destination-id");
      updateDestinationDetail(id);
    });
  });

  // Hero buttons
  const heroWhatsappBtn = document.getElementById("heroWhatsappBtn");
  const heroPlanTripBtn = document.getElementById("heroPlanTripBtn");
  const detailWhatsappBtn = document.getElementById("detailWhatsappBtn");
  const detailEnquiryBtn = document.getElementById("detailEnquiryBtn");

  if (heroWhatsappBtn) {
    heroWhatsappBtn.addEventListener("click", () => {
      openWhatsappChat("Hi Hop and Go! I’d like help planning a custom trip.");
    });
  }

  if (heroPlanTripBtn) {
    heroPlanTripBtn.addEventListener("click", () => {
      openEnquiryModal();
    });
  }

  if (detailWhatsappBtn) {
    detailWhatsappBtn.addEventListener("click", () => {
      const titleEl = document.getElementById("detailTitle");
      const place = titleEl ? titleEl.textContent : "a destination";
      openWhatsappChat(`Hi Hop and Go! I’d like to plan a trip to ${place}.`);
    });
  }

  if (detailEnquiryBtn) {
    detailEnquiryBtn.addEventListener("click", openEnquiryModal);
  }

  // Enquiry modal
  const enquiryForm = document.getElementById("enquiryForm");
  if (enquiryForm) {
    enquiryForm.addEventListener("submit", handleFormSubmit);
  }

  const closeEnquiryBtn = document.getElementById("closeEnquiryModal");
  if (closeEnquiryBtn) {
    closeEnquiryBtn.addEventListener("click", closeEnquiryModal);
  }

  // Lightbox
  const closeLightboxBtn = document.getElementById("closeLightbox");
  const lightboxPrevBtn = document.getElementById("lightboxPrev");
  const lightboxNextBtn = document.getElementById("lightboxNext");

  if (closeLightboxBtn) closeLightboxBtn.addEventListener("click", closeLightbox);
  if (lightboxPrevBtn) lightboxPrevBtn.addEventListener("click", showPrevImage);
  if (lightboxNextBtn) lightboxNextBtn.addEventListener("click", showNextImage);

  // Close modals on background click
  document.querySelectorAll(".modal").forEach(modal => {
    modal.addEventListener("click", (e) => {
      if (e.target === modal) {
        modal.classList.remove("active");
        modal.setAttribute("aria-hidden", "true");
      }
    });
  });

  // Optional: Escape key closes modals
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      closeEnquiryModal();
      closeLightbox();
    }
  });
});


/* ---------- Luxury Navbar (transparent over hero, solid after hero) ---------- */
function initLuxuryNavbar(){
  const navbar = document.getElementById("navbar");
  const hero = document.getElementById("hero");
  const toggle = document.getElementById("navToggle");
  const menu = document.getElementById("navMenu");
  const backdrop = document.getElementById("navBackdrop");

  if(!navbar || !hero || !toggle || !menu || !backdrop) return;

  const openMenu = () => {
    menu.classList.add("open");
    backdrop.classList.add("open");
    toggle.setAttribute("aria-expanded", "true");
    toggle.setAttribute("aria-label", "Close menu");
    // prevent background scroll on mobile
    document.documentElement.style.overflow = "hidden";
    document.body.style.overflow = "hidden";
  };

  const closeMenu = () => {
    menu.classList.remove("open");
    backdrop.classList.remove("open");
    toggle.setAttribute("aria-expanded", "false");
    toggle.setAttribute("aria-label", "Open menu");
    document.documentElement.style.overflow = "";
    document.body.style.overflow = "";
  };

  toggle.addEventListener("click", (e) => {
    e.preventDefault();
    if(menu.classList.contains("open")) closeMenu();
    else openMenu();
  });

  backdrop.addEventListener("click", closeMenu);

  // Close on link click (mobile)
  menu.querySelectorAll("a").forEach(a => a.addEventListener("click", closeMenu));

  // Close on Escape
  document.addEventListener("keydown", (e) => {
    if(e.key === "Escape") closeMenu();
  });

  // If resizing to desktop, ensure menu is closed
  window.addEventListener("resize", () => {
    if(window.innerWidth > 860) closeMenu();
  });

  // Transparent only while hero is visible
  const setSolid = (isSolid) => {
    if(isSolid) navbar.classList.add("solid");
    else navbar.classList.remove("solid");
  };

  if("IntersectionObserver" in window){
    const observer = new IntersectionObserver((entries) => {
      // When hero is not intersecting, we are past it -> solid
      const entry = entries[0];
      setSolid(!entry.isIntersecting);
    }, { root: null, threshold: 0.01 });

    observer.observe(hero);
  } else {
    // Fallback: basic scroll check
    const onScroll = () => {
      setSolid(window.scrollY > (hero.offsetHeight - 120));
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
  }
}
