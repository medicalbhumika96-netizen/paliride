import mongoose from "mongoose";

const rideSchema = new mongoose.Schema({
  pickup: String,
  drop: String,
  vehicleType: { type:String, enum:["bike","auto"] },
  fare: Number, // 🔒 locked at creation
  status: {
    type:String,
    enum:["requested","assigned","accepted","completed","cancelled"],
    default:"requested"
  },
  driver: { type: mongoose.Schema.Types.ObjectId, ref:"Driver" }
},{ timestamps:true });

export default mongoose.model("Ride", rideSchema);
