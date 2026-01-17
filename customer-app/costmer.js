/* =====================================
   GLOBAL STATE
===================================== */
let rideType = "student";     // NEW (5 modes)
let vehicle = "bike";
let fare = 40;
let paymentMode = "cash";
let rideId = null;
let pollTimer = null;

// ⚠️ Testing ke liye (later backend move)
const MAPS_KEY = "PASTE_YOUR_GOOGLE_MAPS_KEY_HERE";

/* =====================================
   RIDE MODE (NEW)
===================================== */
function selectMode(type){
  rideType = type;

  document.querySelectorAll(".mode")
    .forEach(m => m.classList.remove("active"));
  event.currentTarget.classList.add("active");

  if(type === "emergency"){
    alert("🚑 Emergency ride: nearest driver priority");
  }
}

/* =====================================
   UI HELPERS
===================================== */
function setVehicle(v){
  vehicle = v;
  bike.classList.remove("active");
  auto.classList.remove("active");
  document.getElementById(v).classList.add("active");
}

function setPay(p){
  paymentMode = p;
  cash.classList.remove("active");
  upi.classList.remove("active");
  document.getElementById(p).classList.add("active");
}

/* =====================================
   BOOK RIDE
===================================== */
async function bookRide(){
  if(!pickup.value || !drop.value || !phone.value){
    return alert("Name, Phone, Pickup & Drop required");
  }

  statusBox.style.display = "block";
  statusBox.innerHTML = "📍 Calculating distance...";

  /* -------- Distance Matrix -------- */
  let distanceKm = null;

  try{
    const url =
      `https://maps.googleapis.com/maps/api/distancematrix/json` +
      `?origins=${encodeURIComponent(pickup.value)}` +
      `&destinations=${encodeURIComponent(drop.value)}` +
      `&key=${MAPS_KEY}`;

    const res = await fetch(url);
    const data = await res.json();

    if(data.status === "OK"){
      const meters = data.rows[0].elements[0].distance.value;
      distanceKm = (meters / 1000).toFixed(2);
    }
  }catch(e){
    // silent fail (manual fallback)
  }

  statusBox.innerHTML =
    `📍 Distance: ${distanceKm || "—"} KM<br>
     🔍 Creating ride...`;

  /* -------- CREATE RIDE -------- */
  fetch("https://paliride.onrender.com/api/ride/create",{
    method:"POST",
    headers:{ "Content-Type":"application/json" },
    body:JSON.stringify({
      customerName: name.value,
      customerPhone: phone.value,
      pickup: pickup.value,
      drop: drop.value,
      vehicleType: vehicle,
      distanceKm,
      paymentMode,
      rideType          // 🔥 NEW
    })
  })
  .then(r=>r.json())
  .then(d=>{
    rideId = d.rideId;
    statusBox.innerHTML =
      `🚕 Ride Mode: <b>${rideType.toUpperCase()}</b><br>
       🔍 Searching nearby driver...`;

    pollTimer = setInterval(poll, 4000);
  });
}

/* =====================================
   POLLING (BACKUP)
===================================== */
function poll(){
  if(!rideId) return;

  fetch(`https://paliride.onrender.com/api/ride/status/${rideId}`)
    .then(r => r.ok ? r.json() : null)
    .then(d => {
      if(!d) return;

      statusBox.innerHTML = `
        <b>🚕 Ride Status</b><br>
        <span class="pill blue">${d.status}</span><br><br>

        👤 Customer: ${name.value}<br>
        📞 Phone: ${phone.value}<br>
        💰 Fare: ₹${d.fare}<br>
        💳 Payment: ${d.paymentMode.toUpperCase()}<br>
        📦 Payment Status: ${d.paymentStatus}
      `;

      if(d.status === "completed"){
        statusBox.innerHTML += "<br>✅ Ride completed";
        clearInterval(pollTimer);
      }
    })
    .catch(()=>{});
}

/* =====================================
   WHATSAPP BOOKING
===================================== */
function wa(){
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

/* =====================================
   REALTIME (PRIMARY)
===================================== */
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
