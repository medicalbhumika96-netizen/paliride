// utils/fare.js

export const calculateFare = (distanceKm, vehicleType) => {
  /* ===============================
     SAFE NUMBER CONVERSION
  ================================ */
  const distance = Number(distanceKm);

  if (isNaN(distance) || distance <= 0) {
    return 0;
  }

  /* ===============================
     VEHICLE RATES
  ================================ */
  const rates = {
    bike: {
      baseFare: 20,
      perKm: 8
    },
    auto: {
      baseFare: 30,
      perKm: 12
    },
    cab: {
      baseFare: 50,
      perKm: 18
    }
  };

  /* ===============================
     SAFE VEHICLE TYPE
  ================================ */
  const vehicle = rates[vehicleType] || rates.bike;

  /* ===============================
     FARE CALCULATION
  ================================ */
  let fare = vehicle.baseFare + distance * vehicle.perKm;

  /* ===============================
     FINAL SAFETY
  ================================ */
  if (isNaN(fare) || fare <= 0) {
    return 0;
  }

  return Number(fare.toFixed(2));
};