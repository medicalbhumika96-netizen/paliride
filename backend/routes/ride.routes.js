  import express from "express";
  import Ride from "../models/Ride.js";
  import Driver from "../models/Driver.js";
  import { calculateFare } from "../utils/fare.js";

  const router = express.Router();

  const COMMISSION_PERCENT = 15;

  /* ===============================
    CREATE RIDE
  ================================ */
  router.post("/create", async (req, res) => {
    try {
      const {
        customerName,
        customerPhone,
        pickup,
        drop,
        vehicleType,
        distanceKm,
        paymentMode,
        rideType
      } = req.body;

      /* -------- PRIORITY -------- */
      let priority = 1;
      if (rideType === "emergency") priority = 5;
      if (rideType === "night") priority = 3;

      /* -------- FARE -------- */
      const fare = calculateFare(distanceKm, vehicleType);

      /* -------- COMMISSION (STEP-B BASE) -------- */
      const commission = Math.round(fare * COMMISSION_PERCENT / 100);
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
        paymentStatus: "pending",   // STEP-B start
        rideType,
        priority,
        status: "requested"
      });

      /* -------- AUTO ASSIGN DRIVER -------- */
      const driver = await Driver.findOne({
        isAvailable: true
      }).sort({ lastActive: -1 });

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
        driverEarning,
        paymentStatus: ride.paymentStatus
      });

    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  /* ===============================
    CUSTOMER – RIDE STATUS
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
        paymentStatus: ride.paymentStatus,
        commission: ride.commission,        // STEP-B visibility
        driverEarning: ride.driverEarning,  // STEP-B visibility
        driver: ride.driver || null
      });

    } catch (err) {
      res.json({ status: "searching" });
    }
  });

  /* ===============================
    STEP-B: MARK UPI PAID (AUTO / MANUAL)
  ================================ */
  router.post("/payment/upi-paid", async (req, res) => {
    const { rideId } = req.body;

    if (!rideId || rideId.length !== 24) {
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
      message: "UPI payment marked as PAID",
      fare: ride.fare,
      commission: ride.commission,
      driverEarning: ride.driverEarning
    });
  });

  export default router;