export function calculateFare(vehicle, km){
  km = Number(km);

  if(vehicle === "bike"){
    return Math.max(30, Math.round(km * 12));
  }

  if(vehicle === "auto"){
    return Math.max(50, Math.round(km * 18));
  }

  return Math.round(km * 15);
}
