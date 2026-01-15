
import express from "express";
import Ride from "../models/Ride.js";
const router = express.Router();

router.get("/rides", async (req,res)=>{
  const rides = await Ride.find().sort({createdAt:-1});
  res.json(rides);
});

export default router;
