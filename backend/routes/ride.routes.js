import express from "express";
import Ride from "../models/Ride.js";
import Driver from "../models/Driver.js";
import { calculateFare } from "../utils/fare.js";

const router = express.Router();
const COMMISSION_PERCENT = 15;

/* ===============================
   CREATE RIDE (SAFE)
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

    // ✅ FALLBACK (NO GMAPS)
    if (!distanceKm || isNaN(distanceKm)) {
      distanceKm = vehicleType === "auto" ? 4 : 3;
    }

    /* PRIORITY */
    let priority = 1;
    if (rideType === "emergency") priority = 5;
    if (rideType === "night") priority = 3;

    /* FARE */
    const fare = calculateFare(Number(distanceKm), vehicleType);

    /* COMMISSION */
    const commission = Math.round((fare * COMMISSION_PERCENT) / 100);
    const driverEarning = fare - commission;

    const ride = await Ride.create({
      customerName,
      customerPhone,
      pickup,
      drop,
      vehicleType,
      distanceKm,
      fare,
      commission,
      driverEarning,
      paymentMode,
      paymentStatus: "pending",
      rideType,
      priority,
      status: "requested"
    });

    /* AUTO ASSIGN DRIVER */
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
