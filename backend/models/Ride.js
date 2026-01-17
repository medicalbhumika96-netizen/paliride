import mongoose from "mongoose";

const rideSchema = new mongoose.Schema({
  pickup: String,
  drop: String,
  vehicleType: String,
  distanceKm: Number,

  fare: Number,

  // PAYMENT
  paymentMode: { type:String, enum:["cash","upi"], default:"cash" },
  paymentStatus: {
    type:String,
    enum:["pending","requested","paid","collected"],
    default:"pending"
  },

  // MONEY SPLIT
  commission: Number,      // YOUR EARNING
  driverEarning: Number,   // DRIVER EARNING

  // DRIVER
  driver:{ type:mongoose.Schema.Types.ObjectId, ref:"Driver" },

  // RATING
  rating:{ type:Number, min:1, max:5 },
  penalty:{ type:Number, default:0 },

  status:String
},{ timestamps:true });

export default mongoose.model("Ride", rideSchema);
