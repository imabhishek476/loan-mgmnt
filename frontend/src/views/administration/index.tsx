import { observer } from "mobx-react-lite";
import AuditLogsTable from "./components/AuditLogsTable";
import { CompaniesTab } from "./components/CompaniesTab";
import { UsersTab } from "./components/UsersTab";
import { Building2, Shield, User } from "lucide-react";
import { userStore } from "../../store/UserStore";
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
  return (
    <div className="flex flex-col  transition-all duration-300">
      <div className="mb-8 flex flex-col sm:flex-row justify-between items-center gap-4">
        <div>
          <h1 className="text-2xl text-gray-800 font-bold text-left">
            Administration
          </h1>
          <p className="text-gray-600 text-base text-left">
            Manage companies, users, and system configuration
          </p>
        </div>
      </div>
      <div className="flex bg-gray-100 rounded-lg p-1 w-full mx-auto mb-6 flex-wrap">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => handleClick(tab.key)}
            className={`flex-1 flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 py-2 px-3 rounded-md text-sm transition-all 
            ${
              userStore.activeAdminTab === tab.key
                ? "bg-white text-green-800 shadow-sm border border-gray-200"
                : "text-gray-600 hover:text-green-700 hover:bg-white"
            }`}
          >
            <div className="flex-shrink-0">{tab.icon}</div>
            <span className="text-[13px] sm:text-[14px]">{tab.label}</span>
          </button>
        ))}
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
