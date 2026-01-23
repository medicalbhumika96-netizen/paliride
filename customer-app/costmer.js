/* =====================================
   GLOBAL STATE
===================================== */
let rideType = "student";
let vehicle = "bike";
let paymentMode = "cash";
let rideId = null;
let pollTimer = null;

/* =====================================
   SPLASH → APP TRANSITION (FIXED)
===================================== */
window.addEventListener("load", () => {
  setTimeout(() => {
    const splash = document.getElementById("splash");
    const app = document.getElementById("app");

    if (splash) splash.style.display = "none";
    if (app) app.classList.remove("hidden");
  }, 1800);
});

/* =====================================
   RIDE MODE
===================================== */
function selectMode(type) {
  rideType = type;

  document.querySelectorAll(".mode")
    .forEach(m => m.classList.remove("active"));
  event.currentTarget.classList.add("active");

  if (type === "emergency") {
    alert("🚑 Emergency ride: priority dispatch");
  }
}

/* =====================================
   VEHICLE
===================================== */
function setVehicle(v) {
  vehicle = v;
  bike.classList.remove("active");
  auto.classList.remove("active");
  document.getElementById(v).classList.add("active");
}

/* =====================================
   PAYMENT
===================================== */
function setPay(p) {
  paymentMode = p;
  cash.classList.remove("active");
  upi.classList.remove("active");
  document.getElementById(p).classList.add("active");
}

/* =====================================
   BOOK RIDE (FIXED)
===================================== */
async function bookRide() {
  const nameVal   = document.getElementById("name").value.trim();
  const phoneVal  = document.getElementById("phone").value.trim();
  const pickupVal = document.getElementById("pickup").value.trim();
  const dropVal   = document.getElementById("drop").value.trim();

  if (!nameVal || !phoneVal || !pickupVal || !dropVal) {
    alert("All fields required");
    return;
  }

  const statusBox = document.getElementById("statusBox");
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
      distanceKm: null   // ✅ GMAPS key नहीं है → allowed
    })
  })
  .then(r => r.json())
  .then(d => {
    if (!d.rideId) {
      statusBox.innerHTML = "❌ Ride failed";
      return;
    }

    rideId = d.rideId;
    statusBox.innerHTML =
      `🔍 Searching nearby driver...<br>
       🚕 Mode: <b>${rideType.toUpperCase()}</b>`;

    pollTimer = setInterval(poll, 4000);
  })
  .catch(() => {
    statusBox.innerHTML = "❌ Server error";
  });
}

/* =====================================
   POLLING (VERY IMPORTANT)
===================================== */
function poll() {
  if (!rideId) return;

  fetch(`https://paliride.onrender.com/api/ride/status/${rideId}`)
    .then(r => r.ok ? r.json() : null)
    .then(d => {
      if (!d) return;

      const statusBox = document.getElementById("statusBox");

      statusBox.innerHTML = `
        <b>🚕 Ride Status</b><br>
        <span class="pill blue">${d.status}</span><br><br>
        💰 Fare: ₹${d.fare || "--"}<br>
        💳 Payment: ${d.paymentMode?.toUpperCase()}<br>
        📦 Payment Status: ${d.paymentStatus}
      `;

      if (d.driver) {
        statusBox.innerHTML += `
          <br><br>🚖 Driver: ${d.driver.name}
          <br>📞 ${d.driver.phone}
        `;
      }

      if (d.status === "completed") {
        statusBox.innerHTML += "<br><br>✅ Ride completed";
        clearInterval(pollTimer);
      }
    })
    .catch(() => {});
}

/* =====================================
   WHATSAPP BOOKING
===================================== */
function wa() {
  const msg =
`Pali Ride Booking
Name: ${name.value}
Phone: ${phone.value}
Pickup: ${pickup.value}
Drop: ${drop.value}
Mode: ${rideType.toUpperCase()}
Vehicle: ${vehicle}
Payment: ${paymentMode}`;

  window.open(
    `https://wa.me/91XXXXXXXXXX?text=${encodeURIComponent(msg)}`
  );
}
