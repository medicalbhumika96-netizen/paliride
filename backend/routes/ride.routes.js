import express from "express";
import Ride from "../models/Ride.js";
import Driver from "../models/Driver.js";
import { calculateFare } from "../utils/fare.js";

const router = express.Router();

/* ===============================
   CREATE RIDE
================================ */
router.post("/create", async (req,res)=>{
  try{
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

    // 🔥 PRIORITY LOGIC
    let priority = 1;
    if(rideType === "emergency") priority = 5;
    if(rideType === "night") priority = 3;

    const ride = await Ride.create({
      customerName,
      customerPhone,
      pickup,
      drop,
      vehicleType,
      distanceKm,
      paymentMode,
      rideType,
      priority,
      status:"requested"
    });

    // 🔥 EMERGENCY-FIRST DRIVER ASSIGN
    const driver = await Driver.findOne({
      isAvailable:true
    }).sort({ lastActive:-1 }); // nearest later

    if(driver){
      ride.driver = driver._id;
      ride.status = "assigned";
      await ride.save();

      driver.isAvailable = false;
      await driver.save();
    }

    res.json({
      rideId: ride._id,
      status: ride.status,
      priority: ride.priority
    });

  }catch(err){
    res.status(500).json({ error: err.message });
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
