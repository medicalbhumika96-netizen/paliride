
import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";

import adminRoutes from "./routes/admin.routes.js";
import rideRoutes from "./routes/ride.routes.js";

dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());

app.use("/api/admin", adminRoutes);
app.use("/api/ride", rideRoutes);

mongoose.connect(process.env.MONGO_URI)
.then(()=>console.log("MongoDB connected"))
.catch(err=>console.log(err));

app.listen(5000, ()=>console.log("Server running on 5000"));
