const API = "https://paliride.onrender.com/api/driver";
let driverId = null;
let pollTimer = null;

/* ===============================
   INIT
================================ */
if (localStorage.getItem("driverId")) {
  driverId = localStorage.getItem("driverId");
  showDash();
}

/* ===============================
   LOGIN
================================ */
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

/* ===============================
   DASHBOARD
================================ */
function showDash(n) {
  loginBox.classList.add("hidden");
  dash.classList.remove("hidden");
  welcome.innerHTML = "Welcome, <b>" + (n || "Driver") + "</b>";
  loadRides();

  // start polling backup
  pollTimer = setInterval(loadRides, 4000);
}

/* ===============================
   AVAILABILITY
================================ */
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

/* ===============================
   LOAD RIDES
================================ */
function loadRides() {
  if (!driverId) return;

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
        rides.innerHTML += `
        <div class="card ride">
          <b>${r.pickup}</b> → ${r.drop}<br>
          Fare: ₹${r.fare}<br>
          Payment: ${r.paymentMode?.toUpperCase() || "CASH"}<br>
          <span class="status">Status: ${r.status}</span>

          ${
            r.status === "assigned"
              ? `<button class="btn green" onclick="act('${r._id}','accept')">Accept Ride</button>`
              : ""
          }

          ${
            r.status === "accepted"
              ? `<button class="btn primary" onclick="act('${r._id}','complete')">Complete Ride</button>`
              : ""
          }
        </div>`;
      });
    })
    .catch(() => {});
}

/* ===============================
   ACTIONS
================================ */
function act(id, type) {
  fetch(API + "/" + type, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ rideId: id, driverId })
  }).then(() => loadRides());
}

/* ===============================
   REALTIME (PRIMARY)
================================ */
const es = new EventSource(
  "https://paliride.onrender.com/api/realtime/stream"
);

es.addEventListener("ride_assigned", (e) => {
  const data = JSON.parse(e.data);

  if (data.driverId === driverId) {
    alert("🔔 New Ride Assigned");
    loadRides();
  }
});

/* ===============================
   CLEANUP (OPTIONAL)
================================ */
window.addEventListener("beforeunload", () => {
  if (pollTimer) clearInterval(pollTimer);
});
