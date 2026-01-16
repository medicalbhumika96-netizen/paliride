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
    const { pickup, drop, vehicleType, fare, paymentMode } = req.body;

    const ride = await Ride.create({
      pickup,
      drop,
      vehicleType,
      fare,
      paymentMode,
      status: "requested"
    });

    // auto assign (optional)
    const driver = await Driver.findOne({ isAvailable: true });
    if (driver) {
      ride.driver = driver._id;
      ride.status = "assigned";
      await ride.save();

      driver.isAvailable = false;
      await driver.save();
    }

    res.json({ rideId: ride._id, status: ride.status });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
