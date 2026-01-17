import mongoose from "mongoose";

const rideSchema = new mongoose.Schema({
  pickup: String,
  drop: String,
  vehicleType: String,
  fare: Number,
  status: String,

  driver: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Driver"
  },

  paymentMode: {
    type: String,
    enum: ["cash", "upi"],
    default: "cash"
  },

  paymentStatus: {
    type: String,
    enum: ["pending", "collected", "failed"],
    default: "pending"
  }

}, { timestamps: true });

export default mongoose.model("Ride", rideSchema);
