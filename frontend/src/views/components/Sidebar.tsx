import React, { useState } from "react";
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
import { Link } from "react-router-dom";

const Sidebar = ({ active }) => {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        className="md:hidden fixed top-4 left-4 z-50 bg-green-700 text-white p-2 rounded-lg"
        onClick={() => setOpen(!open)}
      >
        ☰
      </button>

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
      <div>
          <div className="flex items-center gap-3 px-6 py-6 border-b border-gray-300">
            <div className="bg-green-100 p-2 rounded-lg">
              <FaThLarge className="text-green-700 text-2xl" />
            </div>
            <div>
              <span className="block font-semibold text-green-900 text-lg">
                Loans Program
              </span>
              <span className="block text-gray-500 text-xs mt-1">
                Loan Management Software
              </span>
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

        <div className="p-4 border-t">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-green-700 text-white flex items-center justify-center font-bold">
              U
            </div>
            <div>
              <p className="font-semibold text-gray-800">User Name</p>
              <span className="text-sm text-gray-500">Admin</span>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
