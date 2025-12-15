import { observer } from "mobx-react-lite";
import AuditLogsTable from "./components/AuditLogsTable";
import { CompaniesTab } from "./components/CompaniesTab";
import { UsersTab } from "./components/UsersTab";
import { Building2, Shield, User } from "lucide-react";
import { userStore } from "../../store/UserStore";
import { useEffect } from "react";
type TabType = "system" | "companies" | "users" | "audit";

const Administration = observer(() => {
  const tabs: { key: TabType; label: string; icon: React.ReactElement }[] = [
    { key: "companies", label: "Companies", icon: <Building2 size={18} /> },
    { key: "users", label: "Users", icon: <User size={18} /> },
    { key: "audit", label: "Audit Logs", icon: <Shield size={18} /> },
  ];

  const handleClick = (key: TabType) => {
    userStore.setActiveAdminTab(key);
  };
  useEffect(() => {
      userStore.setActiveAdminTab("companies");
  }, []);
  return (
    <div className="flex flex-col  transition-all duration-300">
      <div className="mb-1 flex flex-col sm:flex-row justify-between items-center gap-4">
        <div>
          <h1 className="text-2xl text-gray-800 font-bold text-left">
            Administration
          </h1>
          <p className="text-gray-600 text-base text-left">
            Manage companies, users, and system configuration
          </p>
        </div>
      </div>
      <div className="flex justify-start mt-2 mb-6">
        <div className="relative flex bg-gray-100 border border-gray-300 rounded-md p-1 shadow-sm w-full overflow-x-auto">
          <div
            className="absolute top-1 bottom-1 rounded-md bg-[#166534] transition-all duration-300 ease-in-out"
            style={{
              width: `calc(${100 / tabs.length}% - 0.5rem)`,
              left: `calc(${
                (tabs.findIndex((t) => t.key === userStore.activeAdminTab) *
                  100) /
                tabs.length
              }% + 0.25rem)`,
            }}
          />
        {tabs.map((tab) => (
          <button
            key={tab.key}
            title={tab.key}
            onClick={() => handleClick(tab.key)}
            className={`relative z-10 flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-full font-semibold transition
            ${
              userStore.activeAdminTab === tab.key
                ? "text-white"
              : "text-gray-700 hover:text-green-700"
            }`}
          >
            {tab.icon}
            <span className="text-sm whitespace-nowrap">{tab.label}</span>
          </button>
        ))}
        </div>
      </div>
      {userStore.activeAdminTab === "companies" && (
        <CompaniesTab activeTab={userStore.activeAdminTab} />
      )}
      {userStore.activeAdminTab === "users" && (
        <UsersTab activeTab={userStore.activeAdminTab} />
      )}
      {userStore.activeAdminTab === "audit" && <AuditLogsTable />}
    </div>
  );
});

export default Administration;
