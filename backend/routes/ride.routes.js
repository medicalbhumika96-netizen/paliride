
import express from "express";
import Ride from "../models/Ride.js";
const router = express.Router();

router.post("/create", async (req,res)=>{
  const ride = await Ride.create(req.body);
  res.json(ride);
});

export default router;
