import express from "express";
import mongoose from "mongoose";
import Driver from "../models/Driver.js";
import Ride from "../models/Ride.js";

const router = express.Router();

/**
 * LOGIN / REGISTER
 * POST /api/driver/login
 * body: { name, phone, pin }
 */
router.post("/login", async (req, res) => {
  const { name, phone, pin } = req.body;
  if (!phone || !pin) {
    return res.status(400).json({ message: "Phone & PIN required" });
  }

  let driver = await Driver.findOne({ phone });

  if (!driver) {
    // auto-register
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

/**
 * AVAILABILITY
 * POST /api/driver/availability
 * body: { driverId, isAvailable }
 */
router.post("/availability", async (req, res) => {
  const { driverId, isAvailable } = req.body;

  if (!mongoose.Types.ObjectId.isValid(driverId)) {
    return res.status(400).json({ message: "Invalid driverId" });
  }

  await Driver.findByIdAndUpdate(driverId, { isAvailable });
  res.json({ message: "Availability updated" });
});

/**
 * MY RIDES (NO driverId IN URL)
 * POST /api/driver/my-rides
 * body: { driverId }
 */
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

/**
 * ACCEPT RIDE
 * POST /api/driver/accept
 * body: { rideId, driverId }
 */
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
  res.json({ message: "Ride accepted" });
});

/**
 * COMPLETE RIDE
 * POST /api/driver/complete
 * body: { rideId }
 */
router.post("/complete", async (req, res) => {
  const { rideId } = req.body;

  if (!mongoose.Types.ObjectId.isValid(rideId)) {
    return res.status(400).json({ message: "Invalid rideId" });
  }

  const ride = await Ride.findById(rideId);
  if (!ride) return res.status(404).json({ message: "Ride not found" });

  await Ride.findByIdAndUpdate(rideId, { status: "completed" });
  await Driver.findByIdAndUpdate(ride.driver, { isAvailable: true });

  res.json({ message: "Ride completed" });
});

export default router;
