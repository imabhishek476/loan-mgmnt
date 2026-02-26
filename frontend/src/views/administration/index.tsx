import { observer } from "mobx-react-lite";
import AuditLogsTable from "./components/AuditLogsTable";
import { CompaniesTab } from "./components/CompaniesTab";
import { UsersTab } from "./components/UsersTab";
import { Building2, FileText, Scale, Settings, Shield, User } from "lucide-react";
import { userStore } from "../../store/UserStore";
import { useEffect } from "react";
import AttorneysTab from "./components/AttorneysTab";
import TemplatesTab from "./components/TemplatesTab";
import { Autocomplete, TextField } from "@mui/material";
type TabType = "system" | "companies" | "attorneys" | "templates" | "users" | "audit";

const Administration = observer(() => {
  const tabs: { key: TabType; label: string; icon: React.ReactElement }[] = [
    { key: "companies", label: "Companies", icon: <Building2 size={18} /> },
      { key: "attorneys", label: "Manage Attorney", icon: <Scale size={18} /> },
      { key: "templates", label: "Manage Templates", icon: < FileText size={18} /> },
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
          <h1 className="text-2xl text-gray-800 font-bold flex items-center gap-1">
              <Settings size={25} className="text-green-600" />
                  Administration
          </h1>
          <p className="text-gray-600 text-base text-left">
            Manage companies, users, and system configuration
          </p>
        </div>
      </div>
    <div className="mt-2 mb-6">

    <div className="sm:hidden">
      <Autocomplete
        size="small"
        options={tabs}
        getOptionLabel={(option) => option.label}
        value={tabs.find((t) => t.key === userStore.activeAdminTab) || null}
        onChange={(_, newValue) => {
          if (newValue) {
            handleClick(newValue.key as TabType);
          }
        }}
        renderInput={(params) => (
          <TextField
            {...params}
            label="Select Tab"
            variant="outlined"
          />
        )}
      />
    </div>
    {/* ✅ Desktop Sliding Tabs */}
    <div className="hidden sm:flex justify-start">
        <div
          className="relative grid bg-gray-100 border border-gray-300 rounded-lg p-1 shadow-sm w-full"
          style={{ gridTemplateColumns: `repeat(${tabs.length}, minmax(0, 1fr))` }}
        >
          {/* Active Slider */}
          <div
            className="absolute top-1 bottom-1 rounded-lg bg-green-700 transition-all duration-300 ease-in-out"
            style={{
              width: `calc(100% / ${tabs.length})`,
              transform: `translateX(${
                tabs.findIndex((t) => t.key === userStore.activeAdminTab) * 100
              }%)`,
            }}
          />

        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => handleClick(tab.key)}
            className={`relative z-10 flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-semibold transition ${
              userStore.activeAdminTab === tab.key
                ? "text-white"
                : "text-gray-700 hover:text-green-700"
            }`}
          >
            {tab.icon}
            <span className="text-sm whitespace-nowrap">
              {tab.label}
            </span>
          </button>
        ))}
      </div>
    </div>

</div>
      {userStore.activeAdminTab === "companies" && (
        <CompaniesTab activeTab={userStore.activeAdminTab} />
      )}
      {userStore.activeAdminTab === "attorneys" && <AttorneysTab />}
      {userStore.activeAdminTab === "templates" && <TemplatesTab />}

      {userStore.activeAdminTab === "users" && (
        <UsersTab activeTab={userStore.activeAdminTab} />
      )}
      {userStore.activeAdminTab === "audit" && <AuditLogsTable />}
    </div>
  );
});

export default Administration;
