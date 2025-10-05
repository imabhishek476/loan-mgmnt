import React, { useState, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { observer } from "mobx-react-lite";
import { userStore } from "../../store/UserStore";
import {
  LayoutDashboard,
  Users,
  DollarSign,
  CreditCard,
  FileText,
  BarChart3,
  ChevronRight,
  LogOut,
  User,
  Menu,
  Settings,
} from "lucide-react";
import Logo from "../../assets/img/logo/favicon.png";

const Sidebar: React.FC = observer(() => {
  const location = useLocation();
  const navigate = useNavigate();
  const profileRef = useRef(null);

  const [open, setOpen] = useState(() => {
    if (typeof window !== "undefined") return window.innerWidth >= 768;
    return true;
  });

  const handleLogout = async () => {
    try {
      await userStore.logout();
      navigate("/"); // redirect to login
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const menuItems = [
    { name: "Dashboard", icon: <LayoutDashboard className="w-5 h-5" />, path: "dashboard" },
    { name: "Clients", icon: <Users className="w-5 h-5" />, path: "clients" },
    { name: "Loans", icon: <DollarSign className="w-5 h-5" />, path: "loans" },
    // { name: "Payments", icon: <CreditCard className="w-5 h-5" />, path: "payments" },
    // { name: "Documents", icon: <FileText className="w-5 h-5" />, path: "documents" },
    // { name: "Reports", icon: <BarChart3 className="w-5 h-5" />, path: "reports" },
    { name: "Administration", icon: <Settings className="w-5 h-5" />, path: "administration" },

  ];

  const currentPath = location.pathname.replace(/^\/+/, "") || "dashboard";

  return (
    <aside className={`fixed md:static top-0 left-0 h-full flex flex-col justify-between border-r bg-white z-50 transform transition-all duration-300 ${open ? "w-64" : "w-16"}`}>
      {/* Logo */}
      <div className={`border-b border-gray-300 p-4 relative ${open ? "flex flex-row items-center justify-between" : "flex flex-col items-center"}`}>
        <div className={`flex items-center gap-3 ${open ? "" : "flex-col"}`}>
          <div className="p-2 rounded-lg flex items-center justify-center h-16 w-16">
            <img
              src={Logo}
              alt="Company Logo"
              className="h-full w-auto object-contain transition-all duration-300"
            />
          </div>
          {open && (
            <span
              className={`text-primary-green font-pt-sans  text-2xl lg:text-[20px] font-bold`}
            >
              Claim Advance
            </span>

          )}
        </div>

        <button onClick={() => setOpen(!open)} className={`p-2 rounded-md hover:bg-gray-200 bg-white transition-colors ${open ? "" : "mb-2"} lg:hidden`}>
          <Menu className="w-6 h-6 text-gray-600" />
        </button>
      </div>

      {/* Navigation */}
      <nav className="m-2 mt-4 flex flex-col gap-2 flex-1">
        {menuItems.map((item) => {
          const isActive = currentPath === item.path;
          return (
            <Link
              key={item.path}
              to={`/${item.path}`}
              className={`flex items-center px-4 py-2 gap-3 rounded-lg font-medium transition-colors ${isActive ? "bg-green-800 text-white shadow-lg" : "text-gray-600 hover:bg-gray-100"}`}
            >
              {item.icon}
              {open && <span>{item.name}</span>}
              {isActive && open && <ChevronRight className="w-4 h-4 ml-auto" />}
            </Link>
          );
        })}
      </nav>

      {/* User Info + Logout */}
      <div className="relative border-t border-gray-300" ref={profileRef}>
        {open ? (
          <div className="flex items-center justify-between gap-3 px-2 py-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-gray-200 flex items-center justify-center text-green-600 font-bold text-base">
                <User className="w-4 h-4 text-green-600" />
              </div>
              <div className="flex flex-col leading-tight">
                <span className="text-gray-800 font-medium text-sm">{userStore.user?.name || userStore.user?.email}</span>
                <span className="text-gray-500 text-xs text-left">{userStore.user?.role}</span>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="p-1.5 rounded-full text-gray-500 hover:bg-red-500 hover:text-white transition-colors"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3 py-3">
            <div className="w-9 h-9 rounded-full bg-gray-200 flex items-center justify-center text-green-600">
              <User className="w-4 h-4 text-green-600" />
            </div>
            <button
              onClick={handleLogout}
              className="p-2 rounded-full text-gray-500 hover:bg-red-500 hover:text-white transition-colors"
              title="Sign Out"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>
    </aside>
  );
});

export default Sidebar;
