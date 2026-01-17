  const API = "https://paliride.onrender.com/api/admin";
const alarm = document.getElementById("alarm");
let lastEmergencyIds = [];

function minsSince(ts){
  return Math.floor((Date.now() - new Date(ts)) / 60000);
}

async function load(){
  const [rides, drivers, emg, col] = await Promise.all([
    fetch(API+"/rides").then(r=>r.json()),
    fetch(API+"/drivers").then(r=>r.json()),
    fetch(API+"/emergency").then(r=>r.json()),
    fetch(API+"/collections").then(r=>r.json())
  ]);

  // Stats
  rideCount.innerText = rides.length;
  emgCount.innerText = emg.length;
  driverCount.innerText = drivers.length;
  collection.innerText = col.total || 0;

  // Emergency sound
  const ids = emg.map(r=>r._id);
  if(ids.some(id=>!lastEmergencyIds.includes(id)) && emg.length){
    alarm.play().catch(()=>{});
  }
  lastEmergencyIds = ids;

  // Emergency UI
  emergency.innerHTML="";
  emg.forEach(r=>{
    const mins = minsSince(r.createdAt);
    emergency.innerHTML+=`
      <div class="card red">
        <b>🚑 EMERGENCY</b><br>
        ⏱ <span class="sla">${mins} min</span><br>
        📍 ${r.pickup} → ${r.drop}<br>
        📞 ${r.customerPhone || "—"}<br>
        🚖 ${r.driver ? "Driver Assigned" : "NO DRIVER"}
      </div>`;
  });

  // Live rides
  ridesDiv.innerHTML="";
  rides.forEach(r=>{
    ridesDiv.innerHTML+=`
      <div class="card">
        <b>${r.pickup}</b> → ${r.drop}<br>
        ₹${r.fare} • ${r.paymentMode}<br>
        <span class="badge status-${r.status}">
          ${r.status}
        </span>
      </div>`;
  });
}

const ridesDiv = document.getElementById("rides");
const emergency = document.getElementById("emergency");

setInterval(load,5000);
load();
