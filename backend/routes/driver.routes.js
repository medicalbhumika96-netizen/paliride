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
   MY RIDES (ACTIVE)
================================ */
router.post("/my-rides", async (req, res) => {
  const { driverId } = req.body;

  if (!mongoose.Types.ObjectId.isValid(driverId)) {
    return res.status(400).json({ message: "Invalid driverId" });
  }

  const rides = await Ride.find({
    driver: driverId,
    status: { $in: ["assigned", "accepted", "completed"] }
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

  ride.status = "accepted";
  await ride.save();

  // 🔔 realtime → customer
  broadcast("ride_accepted", {
    rideId,
    driverId
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
  if (!ride) {
    return res.status(404).json({ message: "Ride not found" });
  }

  ride.status = "completed";
  await ride.save();

  // driver free again
  await Driver.findByIdAndUpdate(ride.driver, { isAvailable: true });

  // 🔔 realtime → customer/admin
  broadcast("ride_completed", {
    rideId
  });

  res.json({
    message: "Ride completed",
    driverEarning: ride.driverEarning,
    commission: ride.commission
  });
});

/* ===============================
   CASH COLLECTION
================================ */
router.post("/collect-cash", async (req, res) => {
  const { rideId } = req.body;

  if (!mongoose.Types.ObjectId.isValid(rideId)) {
    return res.status(400).json({ message: "Invalid rideId" });
  }

  const ride = await Ride.findById(rideId);
  if (!ride) {
    return res.status(404).json({ message: "Ride not found" });
  }

  if (ride.paymentMode !== "cash") {
    return res.status(400).json({ message: "Not a cash ride" });
  }

  ride.paymentStatus = "collected";
  await ride.save();

  res.json({
    message: "Cash collected successfully",
    amount: ride.fare,
    driverEarning: ride.driverEarning
  });
});

/* ===============================
   UPI REQUEST (QR FLOW)
================================ */
router.post("/request-upi", async (req, res) => {
  const { rideId } = req.body;

  if (!mongoose.Types.ObjectId.isValid(rideId)) {
    return res.status(400).json({ message: "Invalid rideId" });
  }

  const ride = await Ride.findById(rideId);
  if (!ride) {
    return res.status(404).json({ message: "Ride not found" });
  }

  ride.paymentStatus = "requested";
  await ride.save();

  res.json({
    message: "UPI request sent",
    upiLink: "upi://pay?pa=YOURUPI@bank&pn=PaliRide"
  });
});

/* ===============================
   CONFIRM UPI (LOGICAL VERIFY)
================================ */
router.post("/confirm-upi", async (req, res) => {
  const { rideId } = req.body;

  if (!mongoose.Types.ObjectId.isValid(rideId)) {
    return res.status(400).json({ message: "Invalid rideId" });
  }

  const ride = await Ride.findById(rideId);
  if (!ride) {
    return res.status(404).json({ message: "Ride not found" });
  }

  if (ride.paymentMode !== "upi") {
    return res.status(400).json({ message: "Not a UPI ride" });
  }

  ride.paymentStatus = "paid";
  await ride.save();

  res.json({
    message: "UPI payment confirmed",
    driverEarning: ride.driverEarning,
    commission: ride.commission
  });
});

export default router;
