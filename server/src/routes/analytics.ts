import { Router } from "express";
import { Order } from "../models/Order.js";

export const analyticsRouter = Router();

analyticsRouter.get("/insights", async (_req, res) => {
  try {
    const totalOrders = await Order.countDocuments();
    const delayedCandidates = await Order.countDocuments({
      status: { $in: ["pending", "accepted", "packed"] },
      createdAt: { $lte: new Date(Date.now() - 12 * 60 * 60 * 1000) },
    });
    const fragileOpen = await Order.countDocuments({
      specialHandling: true,
      status: { $in: ["pending", "accepted", "packed", "shipped"] },
    });

    const busiestChannels = await Order.aggregate([
      { $group: { _id: "$channel", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 2 },
    ]);

    const insightCards = [
      {
        key: "risk",
        label: "Delay risk",
        value: delayedCandidates,
        tone: delayedCandidates > 0 ? "warn" : "ok",
        detail:
          delayedCandidates > 0
            ? "Orders pending >12h need escalation"
            : "No delayed order detected",
      },
      {
        key: "fragile",
        label: "Fragile in pipeline",
        value: fragileOpen,
        tone: fragileOpen > 3 ? "warn" : "info",
        detail: "High-fragility load suggests packaging focus",
      },
      {
        key: "coverage",
        label: "Routing confidence",
        value: totalOrders === 0 ? 0 : Math.max(0, 100 - Math.round((delayedCandidates / totalOrders) * 100)),
        tone: "info",
        detail: "Simple heuristic score from live operations",
      },
    ];

    res.json({
      cards: insightCards,
      channels: busiestChannels.map((x) => ({
        channel: String(x._id),
        count: Number(x.count),
      })),
      generatedAt: new Date().toISOString(),
    });
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

analyticsRouter.get("/summary", async (req, res) => {
  try {
    const dayParam = req.query.day as string | undefined;
    const dayStart = dayParam
      ? new Date(dayParam)
      : new Date(new Date().setHours(0, 0, 0, 0));
    const dayEnd = new Date(dayStart);
    dayEnd.setDate(dayEnd.getDate() + 1);

    const [statusCounts, revenueAgg, deliveredRevenue, hourly, topProducts] = await Promise.all([
      Order.aggregate([
        { $group: { _id: "$status", count: { $sum: 1 } } },
      ]),
      Order.aggregate([{ $group: { _id: null, total: { $sum: "$total" } } }]),
      Order.aggregate([
        { $match: { status: "delivered" } },
        { $group: { _id: null, total: { $sum: "$total" } } },
      ]),
      Order.aggregate([
        {
          $match: {
            createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
          },
        },
        {
          $group: {
            _id: { $hour: "$createdAt" },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]),
      Order.aggregate([
        { $unwind: "$lineItems" },
        {
          $group: {
            _id: "$lineItems.name",
            qty: { $sum: "$lineItems.qty" },
            revenue: { $sum: { $multiply: ["$lineItems.qty", "$lineItems.unitPrice"] } },
          },
        },
        { $sort: { revenue: -1 } },
        { $limit: 8 },
      ]),
    ]);

    const byStatus: Record<string, number> = {};
    for (const row of statusCounts) {
      byStatus[String(row._id)] = row.count as number;
    }

    const ordersToday = await Order.countDocuments({
      createdAt: { $gte: dayStart, $lt: dayEnd },
    });

    const ordersPerHour: { hour: number; count: number }[] = [];
    for (let h = 0; h < 24; h++) {
      const found = hourly.find((x: { _id: number }) => x._id === h);
      ordersPerHour.push({ hour: h, count: found ? (found.count as number) : 0 });
    }

    res.json({
      counts: {
        total: Object.values(byStatus).reduce((a, b) => a + b, 0),
        byStatus,
        processing:
          (byStatus["accepted"] ?? 0) + (byStatus["packed"] ?? 0),
      },
      revenue: {
        allTime: revenueAgg[0]?.total ?? 0,
        delivered: deliveredRevenue[0]?.total ?? 0,
      },
      ordersToday,
      ordersPerHour,
      topProducts: topProducts.map(
        (p: { _id: string; qty: number; revenue: number }) => ({
          name: p._id,
          qty: p.qty,
          revenue: p.revenue,
        })
      ),
    });
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});
