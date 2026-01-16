import express from "express";
import Ride from "../models/Ride.js";

const router = express.Router();

// allowed fare ranges (Pali-friendly)
const LIMITS = {
  bike: { min: 40, max: 120 },
  auto: { min: 60, max: 180 }
};

router.post("/create", async (req,res)=>{
  const { pickup, drop, vehicleType, fare } = req.body;

  if(!pickup || !drop || !vehicleType || !fare){
    return res.status(400).json({ message:"Missing fields" });
  }

  const lim = LIMITS[vehicleType];
  if(!lim) return res.status(400).json({ message:"Invalid vehicle" });

  if(fare < lim.min || fare > lim.max){
    return res.status(400).json({
      message:`Fare must be between ₹${lim.min}–₹${lim.max}`
    });
  }

  const ride = await Ride.create({
    pickup, drop, vehicleType, fare, status:"requested"
  });

  res.json({ message:"Ride created", ride });
});

export default router;
