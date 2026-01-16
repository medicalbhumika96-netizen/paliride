import express from "express";
import Ride from "../models/Ride.js";
import Driver from "../models/Driver.js";

const router = express.Router();

// get all rides
router.get("/rides", async (req,res)=>{
  const rides = await Ride.find().populate("driver");
  res.json(rides);
});

// get available drivers
router.get("/drivers", async (req,res)=>{
  const drivers = await Driver.find({ isAvailable:true });
  res.json(drivers);
});

// assign driver
router.post("/assign", async (req,res)=>{
  const { rideId, driverId } = req.body;

  await Ride.findByIdAndUpdate(rideId,{
    driver: driverId,
    status: "assigned"
  });

  await Driver.findByIdAndUpdate(driverId,{ isAvailable:false });

  res.json({ message:"Driver assigned" });
});

export default router;
