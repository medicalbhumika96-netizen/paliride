import express from "express";
import Ride from "../models/Ride.js";
import Driver from "../models/Driver.js";
import { calculateFare } from "../utils/fare.js";

const router = express.Router();

/* ===============================
   CREATE RIDE
================================ */
router.post("/create", async (req, res) => {
  try {
    const {
      pickup,
      drop,
      vehicleType,
      distanceKm,
      paymentMode
    } = req.body;

    if (!pickup || !drop || !vehicleType || !distanceKm) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    // ✅ BACKEND decides fare (SECURE)
    const fare = calculateFare(vehicleType, distanceKm);

    const ride = await Ride.create({
      pickup,
      drop,
      vehicleType,
      distanceKm,
      fare,
      paymentMode: paymentMode || "cash",
      status: "requested"
    });

    // ✅ AUTO ASSIGN DRIVER (if available)
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
      fare
    });

  } catch (err) {
    console.error("Create ride error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

/* ===============================
   GET RIDE STATUS (POLLING)
================================ */
router.get("/status/:id", async (req, res) => {
  try {
    const rideId = req.params.id;

    if (!rideId || rideId.length !== 24) {
      return res.json({ status: "searching" });
    }

    const ride = await Ride.findById(rideId)
      .populate("driver", "name phone");

    if (!ride) {
      return res.json({ status: "searching" });
    }

    res.json({
      status: ride.status,
      fare: ride.fare,
      paymentMode: ride.paymentMode,
      driver: ride.driver || null
    });

  } catch (err) {
    // 🔕 NEVER BREAK CUSTOMER UI
    res.json({ status: "searching" });
  }
});

export default router;
