import express from "express";
import mongoose from "mongoose";
import Driver from "../models/Driver.js";
import Ride from "../models/Ride.js";
import { broadcast } from "../realtime/events.js";

const router = express.Router();

/* ===============================
   LOGIN / REGISTER
================================ */
router.post("/login", async (req, res) => {
  const { name, phone, pin } = req.body;
  if (!phone || !pin) {
    return res.status(400).json({ message: "Phone & PIN required" });
  }

  let driver = await Driver.findOne({ phone });

  if (!driver) {
    driver = await Driver.create({
      name: name || "Driver",
      phone,
      pin,
      isAvailable: false
    });
  } else {
    if (driver.pin !== pin) {
      return res.status(401).json({ message: "Invalid PIN" });
    }
  }

  res.json({
    message: "Login successful",
    driverId: driver._id,
    name: driver.name,
    isAvailable: driver.isAvailable
  });
});

/* ===============================
   AVAILABILITY
================================ */
router.post("/availability", async (req, res) => {
  const { driverId, isAvailable } = req.body;

  if (!mongoose.Types.ObjectId.isValid(driverId)) {
    return res.status(400).json({ message: "Invalid driverId" });
  }

  await Driver.findByIdAndUpdate(driverId, { isAvailable });
  res.json({ message: "Availability updated" });
});

/* ===============================
   MY RIDES
================================ */
router.post("/my-rides", async (req, res) => {
  const { driverId } = req.body;

  if (!mongoose.Types.ObjectId.isValid(driverId)) {
    return res.status(400).json({ message: "Invalid driverId" });
  }

  const rides = await Ride.find({
    driver: driverId,
    status: { $in: ["assigned", "accepted"] }
  }).sort({ createdAt: -1 });

  res.json(rides);
});

/* ===============================
   ACCEPT RIDE
================================ */
router.post("/accept", async (req, res) => {
  const { rideId, driverId } = req.body;

  if (
    !mongoose.Types.ObjectId.isValid(rideId) ||
    !mongoose.Types.ObjectId.isValid(driverId)
  ) {
    return res.status(400).json({ message: "Invalid IDs" });
  }

  const ride = await Ride.findById(rideId);
  if (!ride || ride.status !== "assigned") {
    return res.status(400).json({ message: "Ride not assignable" });
  }

  await Ride.findByIdAndUpdate(rideId, { status: "accepted" });

  // ✅ EMIT REALTIME EVENT (CORRECT PLACE)
  broadcast("ride_accepted", {
    rideId: rideId,
    driverId: driverId
  });

  res.json({ message: "Ride accepted" });
});

/* ===============================
   COMPLETE RIDE
================================ */
router.post("/complete", async (req, res) => {
  const { rideId } = req.body;

  if (!mongoose.Types.ObjectId.isValid(rideId)) {
    return res.status(400).json({ message: "Invalid rideId" });
  }

  const ride = await Ride.findById(rideId);
  if (!ride) return res.status(404).json({ message: "Ride not found" });

  await Ride.findByIdAndUpdate(rideId, { status: "completed" });
  await Driver.findByIdAndUpdate(ride.driver, { isAvailable: true });

  // ✅ EMIT REALTIME EVENT
  broadcast("ride_completed", {
    rideId: rideId
  });

  res.json({ message: "Ride completed" });
});

/**
 * COLLECT PAYMENT
 * POST /api/driver/collect-payment
 * body: { rideId }
 */
router.post("/collect-payment", async (req, res) => {
  const { rideId } = req.body;

  if (!mongoose.Types.ObjectId.isValid(rideId)) {
    return res.status(400).json({ message: "Invalid rideId" });
  }

  await Ride.findByIdAndUpdate(rideId, {
    paymentStatus: "collected"
  });

  res.json({ message: "Payment marked as collected" });
});

export default router;
