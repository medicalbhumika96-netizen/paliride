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

/* ================= RIDE TYPE BADGE ================= */
function rideBadge(r){
    if(r.rideType === "emergency"){
        return `<span style="
          background:#dc2626;
          color:white;
          padding:4px 10px;
          border-radius:999px;
          font-size:12px;
          font-weight:600;
        ">🚑 EMERGENCY</span>`;
    }

    if(r.rideType === "night"){
        return `<span style="
          background:#1e293b;
          color:#fff;
          padding:4px 10px;
          border-radius:999px;
          font-size:12px;
        ">🌙 NIGHT</span>`;
    }

    if(r.rideType === "student"){
        return `<span style="
          background:#0a7cff;
          color:white;
          padding:4px 10px;
          border-radius:999px;
          font-size:12px;
        ">🎓 STUDENT</span>`;
    }

    if(r.rideType === "village"){
        return `<span style="
          background:#16a34a;
          color:white;
          padding:4px 10px;
          border-radius:999px;
          font-size:12px;
        ">🌾 VILLAGE</span>`;
    }

    return `<span style="
      background:#475569;
      color:white;
      padding:4px 10px;
      border-radius:999px;
      font-size:12px;
    ">🧑‍💼 OFFICE</span>`;
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
            <div class="card" style="
              border:${r.rideType === "emergency" ? "2px solid #dc2626" : "none"};
            ">

              <div style="margin-bottom:6px">
                ${rideBadge(r)}
              </div>

              <b>${r.pickup}</b> → ${r.drop}<br>

              <div class="timeline">
                🕒 Requested → 🚕 Accepted → ✅ Completed
              </div>

              <hr style="border:0;border-top:1px solid #1e293b;margin:10px 0">

              💰 Fare: ₹${r.fare || "—"}<br>
              💳 Payment: ${(r.paymentMode || "cash").toUpperCase()}<br>

              ${r.customerPhone ? `
                📞 Customer: ${r.customerPhone}
                <a class="btn call" href="tel:${r.customerPhone}">
                  Call Customer
                </a>
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
const es = new EventSource(
    "https://paliride.onrender.com/api/realtime/stream"
);

es.addEventListener("ride_assigned", e => {
    const d = JSON.parse(e.data);
    if (d.driverId === driverId) {
        alert("🔔 New Ride Assigned");
        loadRides();
    }
});
