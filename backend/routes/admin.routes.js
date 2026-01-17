import express from "express";
import mongoose from "mongoose";
import Ride from "../models/Ride.js";
import Driver from "../models/Driver.js";

const router = express.Router();

/* ===============================
   GET ALL RIDES (ADMIN DASHBOARD)
================================ */
router.get("/rides", async (req, res) => {
  const rides = await Ride.find()
    .populate("driver", "name phone")
    .sort({ createdAt: -1 });

  res.json(rides);
});

/* ===============================
   GET ONLY ONLINE DRIVERS
================================ */
router.get("/drivers", async (req, res) => {
  const drivers = await Driver.find({ isAvailable: true })
    .select("name phone isAvailable");

  res.json(drivers);
});

/* ===============================
   MANUAL DRIVER ASSIGN (SAFE)
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

  ride.driver = driverId;
  ride.status = "assigned";
  await ride.save();

  driver.isAvailable = false;
  await driver.save();

  res.json({ message: "Driver assigned successfully" });
});

/* ===============================
   TODAY COLLECTION (OWNER VIEW)
================================ */
router.get("/collections", async (req, res) => {
  const data = await Ride.aggregate([
    {
      $match: {
        paymentStatus: { $in: ["paid", "collected"] }
      }
    },
    {
      $group: {
        _id: null,
        totalFare: { $sum: "$fare" },
        ownerEarning: { $sum: "$commission" },
        driverPayout: { $sum: "$driverEarning" }
      }
    }
  ]);

  res.json({
    totalFare: data[0]?.totalFare || 0,
    ownerEarning: data[0]?.ownerEarning || 0,
    driverPayout: data[0]?.driverPayout || 0
  });
});

/* ===============================
   EMERGENCY MONITOR (CRITICAL)
================================ */
router.get("/emergency", async (req, res) => {
  const list = await Ride.find({
    rideType: "emergency",
    status: { $ne: "completed" }
  })
    .populate("driver", "name phone")
    .sort({ priority: -1, createdAt: -1 });

  res.json(list);
});

/* ===============================
   DRIVER PERFORMANCE (BONUS)
================================ */
router.get("/driver-performance", async (req, res) => {
  const stats = await Ride.aggregate([
    {
      $match: {
        status: "completed",
        rating: { $exists: true }
      }
    },
    {
      $group: {
        _id: "$driver",
        avgRating: { $avg: "$rating" },
        totalPenalty: { $sum: "$penalty" },
        rides: { $sum: 1 }
      }
    }
  ]);

  res.json(stats);
});

export default router;
