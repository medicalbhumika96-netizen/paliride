/* ===============================
   GLOBAL STATE
================================ */
let rideType = "student";
let vehicle = "bike";
let paymentMode = "cash";
let rideId = null;
let pollTimer = null;
let statusBox = null; // 🔒 GLOBAL FIX

/* ===============================
   SPLASH → APP
================================ */
window.addEventListener("load", () => {
  setTimeout(() => {
    document.getElementById("splash")?.remove();
    document.getElementById("app")?.classList.remove("hidden");
  }, 1500);
});

/* ===============================
   MODE
================================ */
function selectMode(type) {
  rideType = type;
  document.querySelectorAll(".mode")
    .forEach(m => m.classList.remove("active"));
  event.currentTarget.classList.add("active");
}

/* ===============================
   VEHICLE
================================ */
function setVehicle(v) {
  vehicle = v;
  bike.classList.remove("active");
  auto.classList.remove("active");
  document.getElementById(v).classList.add("active");
}

/* ===============================
   PAYMENT
================================ */
function setPay(p) {
  paymentMode = p;
  cash.classList.remove("active");
  upi.classList.remove("active");
  document.getElementById(p).classList.add("active");
}

/* ===============================
   BOOK RIDE
================================ */
function bookRide() {
  const nameVal   = document.getElementById("name").value.trim();
  const phoneVal  = document.getElementById("phone").value.trim();
  const pickupVal = document.getElementById("pickup").value.trim();
  const dropVal   = document.getElementById("drop").value.trim();

  statusBox = document.getElementById("statusBox");

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
      vehicleType: vehicle || "bike",
      paymentMode: paymentMode || "cash",
      rideType: rideType || "student",
      distanceKm: 3
    })
  })
  .then(res => {
    if (!res.ok) throw new Error("Backend error");
    return res.json();
  })
  .then(d => {
    if (!d.rideId) throw new Error("No rideId");

    rideId = d.rideId;
    statusBox.innerHTML = "🔍 Searching nearby driver...";
    pollTimer = setInterval(poll, 4000); // 🔁 START POLLING
  })
  .catch(err => {
    console.error(err);
    statusBox.innerHTML = "❌ Ride failed";
  });
}

/* ===============================
   POLL STATUS (FINAL FIX)
================================ */
function poll() {
  if (!rideId) return;

  fetch(`https://paliride.onrender.com/api/ride/${rideId}/status`) // ✅ CORRECT URL
    .then(r => r.json())
    .then(d => {
      if (!d.status) return;

      statusBox.innerHTML = `
        <b>Status:</b> ${d.status}<br>
        💰 Fare: ₹${d.fare ?? "--"}<br>
        📦 Payment Status: ${d.paymentStatus ?? "--"}
      `;

      if (d.status === "completed") {
        clearInterval(pollTimer);
        statusBox.innerHTML += `<br><br>✅ Ride completed successfully`;
      }
    })
    .catch(() => {
      console.log("Status check failed");
    });
}