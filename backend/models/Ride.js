import mongoose from "mongoose";

const rideSchema = new mongoose.Schema({
  customerName: String,
  customerPhone: String,

  pickup: String,
  drop: String,
  vehicleType: String,

  distanceKm: Number,
  fare: Number,

  rideType: {
    type: String,
    enum: ["student","office","emergency","village","night"],
    default: "office"
  },

  priority: {
    type: Number,
    default: 1 // emergency = 5
  },

  status: {
    type: String,
    enum: ["requested","assigned","accepted","completed"],
    default: "requested"
  },

  driver: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Driver"
  },

  paymentMode: {
    type: String,
    enum: ["cash","upi"],
    default: "cash"
  },

  paymentStatus: {
    type: String,
    enum: ["pending","collected"],
    default: "pending"
  }

},{ timestamps:true });

export default mongoose.model("Ride", rideSchema);
