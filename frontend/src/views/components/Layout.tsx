// src/views/components/Layout.tsx
import { Outlet, useLocation } from "react-router-dom";
import Sidebar from "./Sidebar";

const Layout = () => {
  const location = useLocation();
  const active = location.pathname.replace("/", ""); // e.g. "/dashboard" → "dashboard"

  return (
    <div className="flex h-screen w-full">
      <Sidebar active={active} />
      <main className="flex-1 p-6">
        <Outlet /> {/* Render nested route here */}
      </main>
    </div>
  );
};

export default Layout;
