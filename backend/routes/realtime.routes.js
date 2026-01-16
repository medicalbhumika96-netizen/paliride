import express from "express";
import { addClient, removeClient } from "../realtime/events.js";

const router = express.Router();

router.get("/stream", (req, res) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders?.();

  addClient(res);

  req.on("close", () => {
    removeClient(res);
  });
});

export default router;
