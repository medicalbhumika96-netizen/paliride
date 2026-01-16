import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

import adminRoutes from "./routes/admin.routes.js";
import rideRoutes from "./routes/ride.routes.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// --- Fix __dirname for ES Modules ---
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// --- Middlewares ---
app.use(cors());
app.use(express.json());

// --- API Routes ---
app.use("/api/admin", adminRoutes);
app.use("/api/ride", rideRoutes);

// --- Serve Frontend (Customer App) ---
app.use(express.static(path.join(__dirname, "../customer-app")));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../customer-app/index.html"));
});

// --- MongoDB ---
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.log(err));

// --- Start Server ---
app.listen(PORT, () => console.log("Server running on " + PORT));
