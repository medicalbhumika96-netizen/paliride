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

    /* BASIC VALIDATION */
    if (!customerName || !customerPhone || !pickup || !drop) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    /* SAFE VEHICLE */
    vehicleType = vehicleType || "bike";

    /* SAFE DISTANCE */
    let safeDistance = Number(distanceKm);
    if (isNaN(safeDistance) || safeDistance <= 0) {
      safeDistance = vehicleType === "auto" ? 4 : 3;
    }

    /* PRIORITY */
    let priority = 1;
    if (rideType === "emergency") priority = 5;
    else if (rideType === "night") priority = 3;

    /* FARE */
    let fare = calculateFare(safeDistance, vehicleType);
    if (isNaN(fare) || fare <= 0) fare = 50;
    fare = Number(fare.toFixed(2));

    /* COMMISSION */
    let commission = (fare * COMMISSION_PERCENT) / 100;
    if (isNaN(commission)) commission = 0;
    commission = Number(commission.toFixed(2));

    let driverEarning = fare - commission;
    if (isNaN(driverEarning) || driverEarning < 0) {
      driverEarning = fare;
    }
    driverEarning = Number(driverEarning.toFixed(2));

    /* CREATE RIDE */
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

    /* AUTO ASSIGN DRIVER */
    const driver = await Driver.findOne({ isAvailable: true });
    if (driver) {
      ride.driver = driver._id;
      ride.status = "assigned";
      await ride.save();

      driver.isAvailable = false;
      await driver.save();
    }

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

/* ===============================
   DRIVER COMPLETE RIDE
================================ */
router.post("/:id/complete", async (req, res) => {
  try {
    const ride = await Ride.findById(req.params.id);
    if (!ride) {
      return res.status(404).json({ error: "Ride not found" });
    }

    ride.status = "completed";
    ride.paymentStatus = "paid";
    await ride.save();

    if (ride.driver) {
      await Driver.findByIdAndUpdate(ride.driver, {
        isAvailable: true
      });
    }

    res.json({ message: "Ride completed successfully" });
  } catch (err) {
    res.status(500).json({ error: "Failed to complete ride" });
  }
});

/* ===============================
   CUSTOMER RIDE STATUS (IMPORTANT)
================================ */
router.get("/:id/status", async (req, res) => {
  try {
    const ride = await Ride.findById(req.params.id);

    if (!ride) {
      return res.status(404).json({ error: "Ride not found" });
    }

    res.json({
      status: ride.status,
      fare: ride.fare,
      paymentStatus: ride.paymentStatus
    });
  } catch (err) {
    res.status(500).json({ error: "Status check failed" });
  }
});

export default router;