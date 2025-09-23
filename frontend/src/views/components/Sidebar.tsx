import React, { useState, useRef, useEffect } from "react";
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

const Sidebar = ({ active }) => {
  const { user } = useAppSelector((state) => state.user);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef(null);

  const handleLogout = async () => {
    try {
      await logout();
      dispatch(logoutSuccess());
      navigate("/");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  useEffect(() => {
    const handler = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <aside className="w-64 bg-white flex flex-col justify-between h-screen border-r relative">
      {/* Top Section */}
      <div>
        {/* Brand */}
        <div className="flex items-center gap-3 px-6 py-6 border-b border-gray-300 hover:bg-gray-50 cursor-pointer transition-colors">
          <div className="bg-accent-mint p-2 rounded-lg">
            <FaThLarge className="text-primary-green text-2xl" />
          </div>
          <div>
            <span className="block font-semibold text-deep-forest text-lg">
              Loans Program
            </span>
            <span className="block text-text-gray text-xs mt-1">
              Loan Management Software
            </span>
          </div>
        </div>

        {/* Nav */}
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
              className={`flex items-center justify-between px-4 py-2 gap-3 rounded-lg font-medium transition-colors ${active === item.path
                  ? "bg-deep-forest text-white shadow-lg"
                  : "text-text-gray hover:bg-soft-gray hover:shadow-sm"
                }`}
            >
              {/* Left side: icon + label */}
              <div className="flex items-center gap-3">
                {item.icon}
                {item.name}
              </div>

              {/* Right side: arrow only if active */}
              {active === item.path && (
                <FaChevronRight className="text-sm transition-transform rotate-0" />
              )}
            </Link>
          ))}
        </nav>

      </div>

      {/* Profile Section */}
      <div className="relative mb-4" ref={profileRef}>
        {/* Profile Button */}
        <div
          className="flex items-center gap-3 px-4 py-3 bg-deep-forest cursor-pointer hover:shadow-lg hover:bg-primary-green transition-shadow rounded-lg"
          onClick={() => setProfileOpen((prev) => !prev)}
        >
          {/* Avatar */}
          <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-green-600 font-bold text-lg">
            {(user?.name || user?.email || "").charAt(0).toUpperCase()}
          </div>

          {/* Name & Role */}
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
            {/* Header */}
            <div className="px-4 py-4 border-b">
              <div className="font-semibold text-gray-900">
                {user?.name || user?.email}
              </div>
              <div className="text-xs text-gray-500 truncate">{user?.email}</div>
            </div>

            {/* Links */}
            <Link
              to="/profile"
              className="flex items-center gap-2 px-4 py-3 hover:bg-gray-100 transition-colors text-gray-800 font-medium"
            >
              <FaUser className="text-green-600" /> Profile Settings
            </Link>

            {/* Logout Button */}
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
  );
};

export default Sidebar;
