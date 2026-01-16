export function calculateFare(distanceKm, vehicleType) {
  const rate = vehicleType === "auto" ? 18 : 12;
  const minFare = vehicleType === "auto" ? 60 : 40;

  const fare = Math.round(distanceKm * rate);
  return fare < minFare ? minFare : fare;
}
