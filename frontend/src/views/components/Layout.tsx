import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import { useState } from "react";
import { User } from "lucide-react";
import { useAppSelector } from "../../hooks/user";

const Layout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false); // collapsed by default on small screens
  const { user } = useAppSelector((state) => state.user);

  return (
    <div className="flex h-screen w-full overflow-hidden">
      <Sidebar open={sidebarOpen} setOpen={setSidebarOpen} />
      <div className="flex-1 flex flex-col min-w-0 transition-all duration-300"
        style={{ marginLeft: sidebarOpen && window.innerWidth >= 768 ? 256 : 0 }}>

        <header className="w-full bg-white border-b border-gray-300 px-4 py-2 flex items-center justify-between shadow-sm">
          <button
            className="md:hidden p-2 rounded hover:bg-gray-100"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <div className="ml-auto flex items-center gap-3">
            <span className="font-medium text-gray-700 truncate">Welcome, {user?.name || "User"}</span>
            <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
              <User className="w-4 h-4 text-green-600" />
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-auto min-w-0 p-4">
          <Outlet />
        </main>
      </div>
    </div>

  );
};

export default Layout;
