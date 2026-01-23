import express from "express";
import Ride from "../models/Ride.js";
import Driver from "../models/Driver.js";
import { calculateFare } from "../utils/fare.js";

const router = express.Router();
const COMMISSION_PERCENT = 15;

/* ===============================
   CREATE RIDE (RENDER SAFE)
================================ */
router.post("/create", async (req, res) => {
  try {
    let {
      customerName,
      customerPhone,
      pickup,
      drop,
      vehicleType,
      distanceKm,
      paymentMode,
      rideType
    } = req.body;

    // ✅ BASIC VALIDATION
    if (!customerName || !customerPhone || !pickup || !drop) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // ✅ SAFE DISTANCE (NO GMAPS)
    let safeDistance = Number(distanceKm);
    if (!safeDistance || isNaN(safeDistance)) {
      safeDistance = vehicleType === "auto" ? 4 : 3;
    }

    // ✅ PRIORITY
    let priority = 1;
    if (rideType === "emergency") priority = 5;
    if (rideType === "night") priority = 3;

    // ✅ FARE
    const fare = calculateFare(safeDistance, vehicleType || "bike");

    // ✅ COMMISSION
    const commission = Math.round((fare * COMMISSION_PERCENT) / 100);
    const driverEarning = fare - commission;

    // ✅ CREATE RIDE
    const ride = await Ride.create({
      customerName,
      customerPhone,
      pickup,
      drop,
      vehicleType: vehicleType || "bike",
      distanceKm: safeDistance,
      fare,
      commission,
      driverEarning,
      paymentMode: paymentMode || "cash",
      paymentStatus: "pending",
      rideType: rideType || "student",
      priority,
      status: "requested"
    });

    // ✅ AUTO ASSIGN DRIVER
    const driver = await Driver.findOne({ isAvailable: true });
    if (driver) {
      ride.driver = driver._id;
      ride.status = "assigned";
      await ride.save();

      driver.isAvailable = false;
      await driver.save();
    }

    res.json({
      rideId: ride._id,
      status: ride.status,
      fare,
      commission,
      driverEarning
    });

  } catch (err) {
    console.error("RIDE CREATE ERROR:", err);
    res.status(500).json({ error: "Ride creation failed" });
  }
});

export default router;
