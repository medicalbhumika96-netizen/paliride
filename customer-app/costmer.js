let rideType = "student";
let vehicle = "bike";
let paymentMode = "cash";
let rideId = null;

/* ===============================
   SPLASH → APP TRANSITION
================================ */
window.addEventListener("load", () => {
  setTimeout(() => {
    const splash = document.getElementById("splash");
    const app = document.getElementById("app");

    if (splash) splash.style.display = "none";
    if (app) app.classList.remove("hidden");
  }, 1800);
});


/* SPLASH */
setTimeout(() => {
  splash.classList.add("hidden");
  app.classList.remove("hidden");
}, 2000);

/* MODE */
function selectMode(type) {
  rideType = type;
  document.querySelectorAll(".mode")
    .forEach(m => m.classList.remove("active"));
  event.target.classList.add("active");

  if (type === "emergency") {
    alert("🚑 Emergency ride: priority dispatch");
  }
}

/* VEHICLE */
function setVehicle(v) {
  vehicle = v;
  bike.classList.remove("active");
  auto.classList.remove("active");
  document.getElementById(v).classList.add("active");
}

/* PAYMENT */
function setPay(p) {
  paymentMode = p;
  cash.classList.remove("active");
  upi.classList.remove("active");
  document.getElementById(p).classList.add("active");
}

async function bookRide() {
  const nameVal = name.value.trim();
  const phoneVal = phone.value.trim();
  const pickupVal = pickup.value.trim();
  const dropVal = drop.value.trim();

  if (!nameVal || !phoneVal || !pickupVal || !dropVal) {
    alert("All fields required");
    return;
  }

  statusBox.classList.remove("hidden");
  statusBox.innerHTML = "🚕 Creating ride...";

  fetch("https://paliride.onrender.com/api/ride/create", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      customerName: nameVal,
      customerPhone: phoneVal,
      pickup: pickupVal,
      drop: dropVal,
      vehicleType: vehicle,
      paymentMode: paymentMode,
      rideType: rideType,
      distanceKm: null   // GMAPS key नहीं है → allowed
    })
  })
  .then(r => r.json())
  .then(d => {
    rideId = d.rideId;
    statusBox.innerHTML = "🔍 Searching nearby driver...";
    pollTimer = setInterval(poll, 4000);
  })
  .catch(() => {
    statusBox.innerHTML = "❌ Server error";
  });
}

// safety fallback
setTimeout(() => {
  document.getElementById("splash")?.remove();
  document.getElementById("app")?.classList.remove("hidden");
}, 2500);
