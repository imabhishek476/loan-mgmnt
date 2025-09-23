// src/views/components/Layout.tsx
import { Outlet, useLocation } from "react-router-dom";
import Sidebar from "./Sidebar";
import { useAppSelector } from "../../hooks/user";

const Layout = () => {
  const location = useLocation();
  const active = location.pathname.replace("/", "");
  const { user } = useAppSelector((state) => state.user);

  return (
    <div className="flex h-screen w-full">
      <Sidebar active={active} />
      <div className="flex-1 flex flex-col">

        <main className="flex-col bg-gray-100 overflow-auto pt-2">
          <Outlet />
      </main>
      </div>
    </div>
  );
};

export default Layout;
