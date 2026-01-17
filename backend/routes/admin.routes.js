import express from "express";
import mongoose from "mongoose";
import Ride from "../models/Ride.js";
import Driver from "../models/Driver.js";

const router = express.Router();

/* ===============================
   GET ALL RIDES
================================ */
router.get("/rides", async (req, res) => {
  const rides = await Ride.find().sort({ createdAt: -1 });
  res.json(rides);
});

/* ===============================
   GET ONLY ONLINE DRIVERS
================================ */
router.get("/drivers", async (req, res) => {
  const drivers = await Driver.find({ isAvailable: true }).select("-pin");
  res.json(drivers);
});

/* ===============================
   ASSIGN DRIVER (SAFE)
================================ */
router.post("/assign", async (req, res) => {
  const { rideId, driverId } = req.body;

  if (
    !mongoose.Types.ObjectId.isValid(rideId) ||
    !mongoose.Types.ObjectId.isValid(driverId)
  ) {
    return res.status(400).json({ message: "Invalid IDs" });
  }

  const driver = await Driver.findById(driverId);
  if (!driver || !driver.isAvailable) {
    return res.status(400).json({ message: "Driver not available" });
  }

  const ride = await Ride.findById(rideId);
  if (!ride || ride.status !== "requested") {
    return res.status(400).json({ message: "Ride not assignable" });
  }

  await Ride.findByIdAndUpdate(rideId, {
    driver: driverId,
    status: "assigned"
  });

  await Driver.findByIdAndUpdate(driverId, { isAvailable: false });

  res.json({ message: "Driver assigned successfully" });
});
/**
 * TODAY COLLECTION
 */
router.get("/collections", async (req, res) => {
  const total = await Ride.aggregate([
    { $match: { paymentStatus: "collected" } },
    { $group: { _id: null, sum: { $sum: "$fare" } } }
  ]);

  res.json({
    total: total[0]?.sum || 0
  });
});

router.get("/emergency", async (req,res)=>{
  const list = await Ride.find({
    rideType:"emergency",
    status:{ $ne:"completed" }
  }).sort({ createdAt:-1 });

  res.json(list);
});


export default router;
