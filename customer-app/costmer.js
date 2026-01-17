let vehicle = "bike";
let fare = 40;
let paymentMode = "cash";
let rideId = null;
let pollTimer = null;

/* ===============================
   UI HELPERS
================================ */
function setVehicle(v){
  vehicle = v;
  bike.classList.remove("active");
  auto.classList.remove("active");
  document.getElementById(v).classList.add("active");
}

function setFare(f){
  fare = f;
  document
    .querySelectorAll(".fares button")
    .forEach(b => b.classList.remove("active"));
  event.target.classList.add("active");
}

function setPay(p){
  paymentMode = p;
  cash.classList.remove("active");
  upi.classList.remove("active");
  document.getElementById(p).classList.add("active");
}

/* ===============================
   BOOK RIDE
================================ */
function bookRide(){
  if(!pickup.value || !drop.value){
    return alert("Pickup & Drop required");
  }

  const distanceKm = Number(prompt("Approx distance (KM)?", 3));
  if(!distanceKm || distanceKm <= 0) return;

  fetch("https://paliride.onrender.com/api/ride/create",{
    method:"POST",
    headers:{ "Content-Type":"application/json" },
    body:JSON.stringify({
      pickup: pickup.value,
      drop: drop.value,
      vehicleType: vehicle,
      distanceKm,
      paymentMode
    })
  })
  .then(r => r.json())
  .then(d => {
    rideId = d.rideId;
    statusBox.style.display = "block";
    statusBox.innerHTML = "🔍 Searching for driver...";
    pollTimer = setInterval(poll, 4000); // backup polling
  });
}

/* ===============================
   POLLING (BACKUP)
================================ */
function poll(){
  if(!rideId) return;

  fetch(`https://paliride.onrender.com/api/ride/status/${rideId}`)
    .then(r => r.ok ? r.json() : null)
    .then(d => {
      if(!d) return;

      statusBox.innerHTML =
        `Status: <b>${d.status}</b><br>
         Fare: ₹${d.fare}<br>
         Payment: ${d.paymentMode}`;

      if(d.status === "completed"){
        statusBox.innerHTML += "<br>✅ Ride completed";
        clearInterval(pollTimer);
      }
    })
    .catch(() => {});
}

/* ===============================
   WHATSAPP BOOKING
================================ */
function wa(){
  const msg =
`Pali Ride Booking
Pickup: ${pickup.value}
Drop: ${drop.value}
Vehicle: ${vehicle}
Payment: ${paymentMode}`;

  window.open(
    `https://wa.me/91XXXXXXXXXX?text=${encodeURIComponent(msg)}`
  );
}

/* ===============================
   REALTIME (PRIMARY)
================================ */
const es = new EventSource(
  "https://paliride.onrender.com/api/realtime/stream"
);

es.addEventListener("ride_accepted", (e) => {
  const d = JSON.parse(e.data);
  if (d.rideId === rideId) {
    statusBox.innerHTML += "<br>🚕 Driver accepted, on the way";
  }
});

es.addEventListener("ride_completed", (e) => {
  const d = JSON.parse(e.data);
  if (d.rideId === rideId) {
    statusBox.innerHTML += "<br>🎉 Ride completed";
    if(pollTimer) clearInterval(pollTimer);
  }
});
