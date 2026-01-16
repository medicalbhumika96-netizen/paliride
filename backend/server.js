import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

import adminRoutes from "./routes/admin.routes.js";
import rideRoutes from "./routes/ride.routes.js";
import driverRoutes from "./routes/driver.routes.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 10000;

/* ===============================
   FIX __dirname (ES MODULE)
================================ */
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/* ===============================
   MIDDLEWARES
================================ */
app.use(cors());
app.use(express.json());

/* ===============================
   API ROUTES
================================ */
app.use("/api/admin", adminRoutes);
app.use("/api/ride", rideRoutes);
app.use("/api/driver", driverRoutes);

/* ===============================
   (OPTIONAL) SERVE CUSTOMER APP
   ⚠️ GitHub Pages use kar rahe ho,
   isliye Render par frontend
   serve karna optional hai
================================ */
// app.use(express.static(path.join(__dirname, "../customer-app")));

// app.get("/", (req, res) => {
//   res.sendFile(path.join(__dirname, "../customer-app/index.html"));
// });

/* ===============================
   HEALTH CHECK (IMPORTANT)
================================ */
app.get("/", (req, res) => {
  res.send("Pali Ride Backend Running 🚀");
});

/* ===============================
   MONGODB CONNECTION
================================ */
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error("Mongo error:", err));

/* ===============================
   START SERVER
================================ */
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
