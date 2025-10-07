// Layout.tsx
import { useState } from "react";
import { Outlet} from "react-router-dom";
import { observer } from "mobx-react-lite";
import Sidebar from "./Sidebar";
import { userStore } from "../../store/UserStore";
import { User } from "lucide-react";

const Layout = observer(() => {
  const [sidebarOpen, setSidebarOpen] = useState(true); // sidebar open by default
  // const navigate = useNavigate();

  // const handleLogout = async () => {
  //   try {
  //     await userStore.logout();
  //     navigate("/");
  //   } catch (error) {
  //     console.error("Logout failed:", error);
  //   }
  // };

  return (
    <div className="flex h-screen w-full overflow-hidden">
      {/* Sidebar */}
      <Sidebar open={sidebarOpen} setOpen={setSidebarOpen} />

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 transition-all duration-300">
        {/* Header */}
        <header className="w-full bg-white border-b border-gray-300 px-4 py-2 flex items-center justify-between shadow-sm">
          {/* Hamburger menu */}
          <button
            className="md:hidden p-2 rounded hover:bg-gray-100"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            <svg
              className="w-6 h-6 text-gray-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </button>

          <div className="ml-auto flex items-center gap-4 pr-4">
            <div className="relative group flex items-center gap-6">
              <div className="flex items-center gap-4">
             
                <div className="flex flex-col leading-tight">
                  <span className="text-gray-800 font-medium text-sm ">
                    {userStore.user?.name || userStore.user?.email || "User"}
                  </span>
                  <span className="text-gray-500 text-xs text-right">{userStore.user?.role}</span>
                </div>
                   <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                  <User className="w-4 h-4 text-green-600" />
                </div>
              </div>

           
            </div>


          </div>
        </header>

        <main className="flex-1 overflow-auto min-w-0 p-4">
          <Outlet />
        </main>
      </div>
    </div>
  );
});

export default Layout;
