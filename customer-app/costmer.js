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

/* BOOK */
function bookRide() {
  if (!name.value || !phone.value || !pickup.value || !drop.value) {
    return alert("All fields required");
  }

  statusBox.classList.remove("hidden");
  statusBox.innerHTML =
    `🚕 <b>${rideType.toUpperCase()}</b><br>
   Searching nearest driver...`;

  fetch("https://paliride.onrender.com/api/ride/create", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      customerName: name.value,
      customerPhone: phone.value,
      pickup: pickup.value,
      drop: drop.value,
      vehicleType: vehicle,
      paymentMode,
      rideType
    })
  })
    .then(r => r.json())
    .then(d => {
      rideId = d.rideId;
      statusBox.innerHTML += "<br>⏳ Waiting for driver";
    });
}
// safety fallback
setTimeout(() => {
  document.getElementById("splash")?.remove();
  document.getElementById("app")?.classList.remove("hidden");
}, 2500);
