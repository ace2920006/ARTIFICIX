import http from "http";
import express from "express";
import cors from "cors";
import { Server } from "socket.io";
import mongoose from "mongoose";
import dotenv from "dotenv";
import { createOrdersRouter } from "./routes/orders.js";
import { analyticsRouter } from "./routes/analytics.js";
import { createIntegrationsRouter } from "./routes/integrations.js";
import { notificationsRouter } from "./routes/notificationsRoute.js";

dotenv.config();

const PORT = Number(process.env.PORT) || 4000;
const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:5173";
const MONGODB_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/oms";

const app = express();
app.use(cors({ origin: CLIENT_URL, credentials: true }));
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: CLIENT_URL, methods: ["GET", "POST", "PATCH"] },
});

app.get("/api/health", (_req, res) => {
  res.json({ ok: true });
});

app.use("/api/orders", createOrdersRouter(io));
app.use("/api/analytics", analyticsRouter);
app.use("/api/integrations", createIntegrationsRouter(io));
app.use("/api/notifications", notificationsRouter);

mongoose
  .connect(MONGODB_URI)
  .then(() => {
    server.listen(PORT, () => {
      console.log(`OMS API http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error("MongoDB connection failed:", err);
    process.exit(1);
  });
