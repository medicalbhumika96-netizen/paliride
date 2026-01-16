import mongoose from "mongoose";

const driverSchema = new mongoose.Schema({
  name: String,
  phone: String,
  vehicleType: { type: String, enum: ["bike", "auto"] },
  isAvailable: { type: Boolean, default: true }
}, { timestamps: true });

export default mongoose.model("Driver", driverSchema);
