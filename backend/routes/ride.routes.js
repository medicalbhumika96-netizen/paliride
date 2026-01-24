import express from "express";
import Ride from "../models/Ride.js";
import Driver from "../models/Driver.js";
import { calculateFare } from "../utils/fare.js";

const router = express.Router();
const COMMISSION_PERCENT = 15;

/* ===============================
   CREATE RIDE (ERROR FREE)
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

    /* ===============================
       BASIC VALIDATION
    ================================ */
    if (!customerName || !customerPhone || !pickup || !drop) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    /* ===============================
       SAFE VEHICLE
    ================================ */
    vehicleType = vehicleType || "bike";

    /* ===============================
       SAFE DISTANCE
    ================================ */
    let safeDistance = Number(distanceKm);

    if (isNaN(safeDistance) || safeDistance <= 0) {
      safeDistance = vehicleType === "auto" ? 4 : 3;
    }

    /* ===============================
       PRIORITY
    ================================ */
    let priority = 1;
    if (rideType === "emergency") priority = 5;
    else if (rideType === "night") priority = 3;

    /* ===============================
       FARE (100% SAFE)
    ================================ */
    let fare = calculateFare(safeDistance, vehicleType);

    if (isNaN(fare) || fare <= 0) {
      fare = 50; // absolute fallback (NEVER NaN)
    }

    fare = Number(fare.toFixed(2));

    /* ===============================
       COMMISSION & DRIVER EARNING
    ================================ */
    let commission = (fare * COMMISSION_PERCENT) / 100;
    if (isNaN(commission)) commission = 0;

    commission = Number(commission.toFixed(2));

    let driverEarning = fare - commission;
    if (isNaN(driverEarning) || driverEarning < 0) {
      driverEarning = fare;
    }

    driverEarning = Number(driverEarning.toFixed(2));

    /* ===============================
       FINAL SAFETY CHECK
    ================================ */
    if (
      isNaN(fare) ||
      isNaN(commission) ||
      isNaN(driverEarning)
    ) {
      return res.status(400).json({ error: "Invalid fare calculation" });
    }

    /* ===============================
       CREATE RIDE
    ================================ */
    const ride = await Ride.create({
      customerName,
      customerPhone,
      pickup,
      drop,
      vehicleType,
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

    /* ===============================
       AUTO ASSIGN DRIVER
    ================================ */
    const driver = await Driver.findOne({ isAvailable: true });

    if (driver) {
      ride.driver = driver._id;
      ride.status = "assigned";
      await ride.save();

      driver.isAvailable = false;
      await driver.save();
    }

    /* ===============================
       RESPONSE
    ================================ */
    res.status(201).json({
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