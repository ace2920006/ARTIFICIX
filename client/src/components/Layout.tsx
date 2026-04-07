import { NavLink, Outlet } from "react-router-dom";
import { useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";
import { toast } from "sonner";
import { apiBase } from "../lib/api";

const nav = [
  { to: "/", label: "Dashboard" },
  { to: "/intake", label: "Order intake" },
  { to: "/analytics", label: "Analytics" },
  { to: "/track", label: "Track order" },
];

export function Layout() {
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const socket: Socket = io(apiBase.replace(/\/$/, ""), {
      transports: ["websocket", "polling"],
    });
    socket.on("connect", () => setConnected(true));
    socket.on("disconnect", () => setConnected(false));
    socket.on("order:created", (p: { orderNumber?: string }) => {
      toast.success("New order received", {
        description: p.orderNumber ? `Order ${p.orderNumber}` : undefined,
      });
    });
    socket.on("order:updated", (p: { orderNumber?: string }) => {
      toast.message("Order updated", {
        description: p.orderNumber ? `Order ${p.orderNumber}` : undefined,
      });
    });
    socket.on("orders:seeded", (p: { count?: number }) => {
      toast.info("Sample orders generated", {
        description: p.count != null ? `${p.count} orders` : undefined,
      });
    });
    socket.on("whatsapp:reply", (p: { body: string; to: string }) => {
      const digits = p.to.replace(/\D/g, "");
      const tail = digits.length >= 4 ? digits.slice(-4) : p.to;
      toast.message("WhatsApp auto-reply (mock)", {
        description: `${p.body.length > 140 ? `${p.body.slice(0, 140)}…` : p.body} · …${tail}`,
      });
    });
    return () => {
      socket.disconnect();
    };
  }, []);

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand">
          <span className="brand-mark" aria-hidden />
          <div>
            <div className="brand-title">Hey!! Parth</div>
            <div className="brand-sub">Centralized orders</div>
          </div>
        </div>
        <nav className="nav">
          {nav.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/"}
              className={({ isActive }) =>
                isActive ? "nav-link active" : "nav-link"
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div
          className={`live-pill ${connected ? "on" : "off"}`}
          title={connected ? "Socket connected" : "Reconnecting…"}
        >
          <span className="dot" />
          {connected ? "Live" : "Offline"}
        </div>
      </header>
      <main className="main">
        <Outlet />
      </main>
    </div>
  );
}
