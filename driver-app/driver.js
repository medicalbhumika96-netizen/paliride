const API = "https://paliride.onrender.com/api/driver";
let driverId = null;
let pollTimer = null;

/* ================= INIT ================= */
if (localStorage.getItem("driverId")) {
    driverId = localStorage.getItem("driverId");
    showDash();
}

/* ================= LOGIN ================= */
function login() {
    fetch(API + "/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            name: name.value,
            phone: phone.value,
            pin: pin.value
        })
    })
        .then(r => r.json())
        .then(d => {
            if (!d.driverId) return alert(d.message);
            localStorage.setItem("driverId", d.driverId);
            driverId = d.driverId;
            showDash(d.name);
        });
}

/* ================= DASH ================= */
function showDash(n) {
    loginBox.classList.add("hidden");
    dash.classList.remove("hidden");
    welcome.innerHTML = `Welcome, <b>${n || "Driver"}</b>`;
    loadRides();
    pollTimer = setInterval(loadRides, 4000);
}

/* ================= AVAILABILITY ================= */
function setAvail(v) {
    fetch(API + "/availability", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ driverId, isAvailable: v })
    }).then(() => {
        onBtn.classList.toggle("hidden", v);
        offBtn.classList.toggle("hidden", !v);
    });
}

/* ================= LOAD RIDES ================= */
function loadRides() {
    fetch(API + "/my-rides", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ driverId })
    })
        .then(r => r.json())
        .then(list => {
            rides.innerHTML = "";
            if (!list.length) {
                rides.innerHTML = "<div class='card'>No active rides</div>";
                return;
            }

            list.forEach(r => {
                const pickURL = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(r.pickup)}`;
                const dropURL = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(r.drop)}`;

                rides.innerHTML += `
      <div class="card">

        <b>${r.pickup}</b> → ${r.drop}
        <span class="badge status-${r.status}">${r.status}</span>

        <div class="timeline">
          🕒 Requested → 🚕 Accepted → ✅ Completed
        </div>

        <hr style="border:0;border-top:1px solid #1e293b;margin:10px 0">

        💰 Fare: ₹${r.fare || "—"}<br>
        💳 Payment: ${(r.paymentMode || "cash").toUpperCase()}<br>

        ${r.customerPhone ? `
          📞 Customer: ${r.customerPhone}
          <a class="btn call" href="tel:${r.customerPhone}">Call Customer</a>
        `: ""}

        <a class="btn nav" target="_blank" href="${pickURL}">
          📍 Navigate Pickup
        </a>
        <a class="btn nav" target="_blank" href="${dropURL}">
          📍 Navigate Drop
        </a>

        ${r.status === "assigned" ? `
          <button class="btn green" onclick="act('${r._id}','accept')">
            Accept Ride
          </button>
        `: ""}

        ${r.status === "accepted" ? `
          <button class="btn primary" onclick="act('${r._id}','complete')">
            Complete Ride
          </button>
        `: ""}

        ${r.status === "completed" && r.paymentStatus !== "collected" ? `
          <button class="btn green" onclick="collectPay('${r._id}')">
            💰 Collect Payment
          </button>
        `: ""}

      </div>`;
            });
        });
}

/* ================= ACTIONS ================= */
function act(id, type) {
    fetch(API + "/" + type, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rideId: id, driverId })
    }).then(loadRides);
}
function collectPay(id) {
    fetch(API + "/collect-payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rideId: id })
    }).then(loadRides);
}

/* ================= REALTIME ================= */
const es = new EventSource("https://paliride.onrender.com/api/realtime/stream");
es.addEventListener("ride_assigned", e => {
    const d = JSON.parse(e.data);
    if (d.driverId === driverId) {
        alert("🔔 New Ride Assigned");
        loadRides();
    }
});