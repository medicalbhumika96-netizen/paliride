let vehicle="bike";
let fare=40;
let paymentMode="cash"; // ✅ NEW

function setVehicle(v){
  vehicle=v;
  bike.classList.remove("active");
  auto.classList.remove("active");
  document.getElementById(v).classList.add("active");
}

function setFare(f){
  fare=f;
  document.querySelectorAll(".fares button").forEach(b=>b.classList.remove("active"));
  event.target.classList.add("active");
}

function setPay(p){
  paymentMode=p;
  cash.classList.remove("active");
  upi.classList.remove("active");
  document.getElementById(p).classList.add("active");
}

function bookRide(){
  if(!pickup.value || !drop.value){
    return alert("Pickup & Drop required");
  }

  fetch("https://paliride.onrender.com/api/ride/create",{
    method:"POST",
    headers:{ "Content-Type":"application/json" },
    body:JSON.stringify({
      pickup:pickup.value,
      drop:drop.value,
      vehicleType:vehicle,
      fare,
      paymentMode // ✅ SEND TO BACKEND
    })
  })
  .then(()=>alert("🚖 Ride booked successfully"));
}

function wa(){
  const msg=
`Pali Ride Booking
Pickup: ${pickup.value}
Drop: ${drop.value}
Vehicle: ${vehicle}
Fare: ₹${fare}
Payment: ${paymentMode.toUpperCase()}`;

  window.open(
    `https://wa.me/91XXXXXXXXXX?text=${encodeURIComponent(msg)}`
  );
}