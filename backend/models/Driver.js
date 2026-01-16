import mongoose from "mongoose";

const driverSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    phone: { type: String, required: true, unique: true },
    pin: { type: String, required: true }, // simple local PIN
    isAvailable: { type: Boolean, default: false }
  },
  { timestamps: true }
);

export default mongoose.model("Driver", driverSchema);
