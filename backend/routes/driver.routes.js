import express from "express";
import Ride from "../models/Ride.js";
import Driver from "../models/Driver.js";

const router = express.Router();

// driver rides
router.get("/:driverId/rides", async (req,res)=>{
  const rides = await Ride.find({
    driver: req.params.driverId,
    status: { $in:["assigned","accepted"] }
  });
  res.json(rides);
});

// accept ride
router.post("/accept", async (req,res)=>{
  await Ride.findByIdAndUpdate(req.body.rideId,{ status:"accepted" });
  res.json({ message:"Ride accepted" });
});

// complete ride
router.post("/complete", async (req,res)=>{
  const ride = await Ride.findById(req.body.rideId);
  await Ride.findByIdAndUpdate(ride._id,{ status:"completed" });
  await Driver.findByIdAndUpdate(ride.driver,{ isAvailable:true });
  res.json({ message:"Ride completed" });
});

export default router;
