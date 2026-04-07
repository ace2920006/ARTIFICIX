import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { Layout } from "./components/Layout";
import { AnalyticsPage } from "./pages/AnalyticsPage";
import { CustomerTrack } from "./pages/CustomerTrack";
import { Dashboard } from "./pages/Dashboard";
import { IntakePage } from "./pages/IntakePage";
import { OrderDetail } from "./pages/OrderDetail";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="intake" element={<IntakePage />} />
          <Route path="analytics" element={<AnalyticsPage />} />
          <Route path="track" element={<CustomerTrack />} />
          <Route path="orders/:id" element={<OrderDetail />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
