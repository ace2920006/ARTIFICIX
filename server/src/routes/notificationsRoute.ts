import { Router } from "express";
import { listNotifications } from "../lib/notifications.js";

export const notificationsRouter = Router();

notificationsRouter.get("/", (_req, res) => {
  res.json(listNotifications(30));
});
