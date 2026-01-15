
import mongoose from "mongoose";
export default mongoose.model("Ride", new mongoose.Schema({
  pickup:String,
  drop:String,
  vehicleType:String,
  fare:Number,
  status:{type:String,default:"requested"}
},{timestamps:true}));
