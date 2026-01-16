=import express from "express";
import mongoose from "mongoose";
import Ride from "../models/Ride.js";
import Driver from "../models/Driver.js";

const router = express.Router();

// get rides for driver (SAFE)
router.get("/:driverId/rides", async (req,res)=>{
  const { driverId } = req.params;

  // 🛑 Guard: invalid ObjectId
  if(!mongoose.Types.ObjectId.isValid(driverId)){
    return res.json([]); // never crash
  }

  const rides = await Ride.find({
    driver: driverId,
    status: { $in:["assigned","accepted"] }
  });

  res.json(rides);
});

// accept ride
router.post("/accept", async (req,res)=>{
  const { rideId } = req.body;
  if(!mongoose.Types.ObjectId.isValid(rideId)){
    return res.status(400).json({ message:"Invalid rideId" });
  }

  await Ride.findByIdAndUpdate(rideId,{ status:"accepted" });
  res.json({ message:"Ride accepted" });
});

// complete ride
router.post("/complete", async (req,res)=>{
  const { rideId } = req.body;
  if(!mongoose.Types.ObjectId.isValid(rideId)){
    return res.status(400).json({ message:"Invalid rideId" });
  }

  const ride = await Ride.findById(rideId);
  if(!ride) return res.json({});

  await Ride.findByIdAndUpdate(rideId,{ status:"completed" });
  await Driver.findByIdAndUpdate(ride.driver,{ isAvailable:true });

  res.json({ message:"Ride completed" });
});

export default router;
