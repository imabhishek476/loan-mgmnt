// src/views/components/Layout.tsx
import { Outlet, useLocation } from "react-router-dom";
import Sidebar from "./Sidebar";
import { useAppSelector } from "../../hooks/user";

const Layout = () => {
  const location = useLocation();
  const active = location.pathname.replace("/", ""); // e.g. "/dashboard" → "dashboard"
  const { user } = useAppSelector((state) => state.user);

  return (
    <div className="flex h-screen w-full">
      <Sidebar active={active} />
      <div className="flex-1 flex flex-col">
        <header className="fixed top-0 left-64 right-0 h-14 bg-white border-b shadow-sm flex items-center justify-between px-6 z-20">
          <h1 className="text-lg font-semibold capitalize">
            {active || "Dashboard"}
          </h1>
          <div className="flex items-center gap-3">
               <div className="w-8 h-8 rounded-full bg-green-700 text-white flex items-center justify-center font-bold">
              U
            </div>
            <span className="hidden sm:block text-gray-600">{user?.name}</span>
         
          </div>
        </header>
        <main className="flex-1 bg-gray-100 p-6 overflow-auto pt-14">
          <Outlet />
      </main>
      </div>
    </div>
  );
};

export default Layout;
