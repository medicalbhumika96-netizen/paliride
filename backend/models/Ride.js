import mongoose from "mongoose";

const rideSchema = new mongoose.Schema({
  customerName: String,
  customerPhone: String,

  pickup: String,
  drop: String,

  vehicleType: String,
  distanceKm: Number,

  fare: Number,
  commission: Number,
  driverEarning: Number,

  paymentMode: { type: String, default: "cash" },
  paymentStatus: { type: String, default: "pending" },

  rideType: { type: String, default: "student" },
  priority: { type: Number, default: 1 },

  status: { type: String, default: "requested" },

  driver: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Driver"
  }

}, { timestamps: true });

export default mongoose.model("Ride", rideSchema);
