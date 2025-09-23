import React, { useState, useRef } from "react";
import {
  FaThLarge,
  FaUserFriends,
  FaDollarSign,
  FaCreditCard,
  FaFileAlt,
  FaChartBar,
  FaUser,
  FaChevronRight,
} from "react-icons/fa";
import { Link, useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../../hooks/user";
import { logoutSuccess } from "../../store/UserSlice";
import { logout } from "../../services/AuthServices";
import  Logo  from "../../assets/img/logo/favicon.png";
interface SidebarProps {
  active: string;
}
const Sidebar: React.FC<SidebarProps> = ({ active }) => {
  const [open, setOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
    const dispatch = useAppDispatch();
  const profileRef = useRef(null);
  const { user } = useAppSelector((state) => state.user);
  const navigate = useNavigate();



  const handleLogout = async () => {
    try {
      await logout();
      dispatch(logoutSuccess());
      navigate("/");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        className="md:hidden fixed top-2 right-2 z-50 bg-green-600 bg-opacity-40 text-green p-2 rounded-lg"
        onClick={() => setOpen(!open)}
      >
        ☰
      </button>

      {/* Overlay */}
      {open && (
        <div
          className="fixed inset-0 bg-black bg-opacity-40 z-40 md:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      <aside
        className={`fixed md:static top-0 left-0 h-full w-64 bg-white flex flex-col justify-between border-r z-50 transform transition-transform duration-300
          ${open ? "translate-x-0" : "-translate-x-full md:translate-x-0"}`}
      >
        {/* Logo */}
        <div>
          <div className="flex items-center gap-3 px-6 py-6 border-b border-gray-300">
            <div className="bg-green-100 p-2 rounded-lg">
              {/* <FaThLarge className="text-green-700 text-2xl" /> */}
               <img
        src={Logo} 
        alt="Company Logo"
        className="h-10 w-auto object-contain"
      />
            </div>
            <div>
              <span className="block font-semibold text-green-900 text-lg">
              Claim Advance
              </span>
              {/* <span className="block text-gray-500 text-sm font-bold mt-1">
               LMS
              </span> */}
            </div>
          </div>

          {/* Nav Links */}
          <nav className="mt-4 m-3 flex flex-col gap-2">
            {[
              { name: "Dashboard", icon: <FaThLarge />, path: "dashboard" },
              { name: "Clients", icon: <FaUserFriends />, path: "clients" },
              { name: "Loans", icon: <FaDollarSign />, path: "loans" },
              { name: "Payments", icon: <FaCreditCard />, path: "payments" },
              { name: "Documents", icon: <FaFileAlt />, path: "documents" },
              { name: "Reports", icon: <FaChartBar />, path: "reports" },
            ].map((item) => (
              <Link
                key={item.path}
                to={`/${item.path}`}
                className={`flex items-center justify-between px-4 py-2 gap-3 rounded-lg font-medium transition-colors ${
                  active === item.path
                    ? "bg-green-800 text-white shadow-lg"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                <div className="flex items-center gap-3">
                  {item.icon}
                  {item.name}
                </div>
                {active === item.path && (
                  <FaChevronRight className="text-sm" />
                )}
              </Link>
            ))}
          </nav>
        </div>

        {/* Profile Section */}
        <div className="relative mb-4" ref={profileRef}>
          <div
            className="flex items-center gap-3 px-4 py-3 bg-green-700 cursor-pointer hover:shadow-lg transition-shadow rounded-lg"
            onClick={() => setProfileOpen((prev) => !prev)}
          >
            <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-green-600 font-bold text-lg">
              {(user?.name || user?.email || "").charAt(0).toUpperCase()}
            </div>
            <div className="flex flex-col">
              <span className="text-white font-semibold">
                {user?.name || user?.email}
              </span>
              <span className="text-sm bg-white text-green-600 px-2 py-0.5 mt-1 rounded-full font-medium uppercase">
                {user?.role}
              </span>
            </div>
          </div>

          {/* Dropdown */}
          {profileOpen && (
            <div className="absolute right-0 bottom-full mb-2 w-72 bg-white rounded-lg shadow-lg border z-50 animate-fade-in overflow-hidden">
              <div className="px-4 py-4 border-b">
                <div className="font-semibold text-gray-900">
                  {user?.name || user?.email}
                </div>
                <div className="text-xs text-gray-500 truncate">{user?.email}</div>
              </div>

              <Link
                to="/profile"
                className="flex items-center gap-2 px-4 py-3 hover:bg-gray-100 transition-colors text-gray-800 font-medium"
              >
                <FaUser className="text-green-600" /> Profile Settings
              </Link>

              <button
                onClick={handleLogout}
                className="w-full px-4 py-1 bg-red-500 text-white font-medium hover:bg-red-400 transition-colors flex items-center justify-center gap-2"
              >
                &#8682; Sign Out
              </button>
            </div>
          )}
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
