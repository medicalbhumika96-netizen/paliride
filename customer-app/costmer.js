let vehicle = "bike";
let fare = 40;
let paymentMode = "cash";
let rideId = null;
let pollTimer = null;

// ⚠️ अभी testing के लिए रहने दो, बाद में backend shift करेंगे
const MAPS_KEY = "PASTE_YOUR_GOOGLE_MAPS_KEY_HERE";

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
async function bookRide(){
  if(!pickup.value || !drop.value){
    return alert("Pickup & Drop required");
  }

  statusBox.style.display = "block";
  statusBox.innerHTML = "📍 Calculating distance...";

  // 🔹 Google Distance Matrix
  const url =
    `https://maps.googleapis.com/maps/api/distancematrix/json` +
    `?origins=${encodeURIComponent(pickup.value)}` +
    `&destinations=${encodeURIComponent(drop.value)}` +
    `&key=${MAPS_KEY}`;

  const res = await fetch(url);
  const data = await res.json();

  if(data.status !== "OK"){
    return alert("Map error");
  }

  const meters = data.rows[0].elements[0].distance.value;
  const distanceKm = (meters / 1000).toFixed(2);

  statusBox.innerHTML =
    `📍 Distance: ${distanceKm} KM<br>💰 Calculating fare...`;

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
  .then(r=>r.json())
  .then(d=>{
    rideId = d.rideId;
    statusBox.innerHTML =
      `💰 Fare: ₹${d.fare}<br>🔍 Searching for driver...`;
    pollTimer = setInterval(poll, 4000);
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

     statusBox.innerHTML = `
  <b>🚕 Ride Status</b><br>
  <span class="pill blue">${d.status}</span><br><br>
  💰 Fare: ₹${d.fare}<br>
  💳 Payment: ${d.paymentMode.toUpperCase()}<br>
  📦 Payment Status: ${d.paymentStatus}
`;
            
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
