import { useState } from "react";
import { Building2, User, Shield } from "lucide-react";

type TabType = "system" | "companies" | "users" | "audit";
interface SubTabsProps {
  onTabChange: (tab: TabType) => void;
}
const SubTabs = ({ onTabChange }: SubTabsProps) => {
  const [activeTab, setActiveTab] = useState<TabType>("companies");

  const tabs: { key: TabType; label: string; icon: React.ReactElement }[] = [
    { key: "companies", label: "Companies", icon: <Building2 size={18} /> },
    { key: "users", label: "Users", icon: <User size={18} /> },
    // { key: "system", label: "System", icon: <Settings size={18} /> },
    { key: "audit", label: "Audit Logs", icon: <Shield size={18} /> },
  ];

  const handleClick = (key: TabType) => {
    setActiveTab(key);
    onTabChange(key);
  };

  return (
    <div className="flex bg-gray-100 rounded-lg p-1 w-full mx-auto mb-6 flex-wrap">
      {tabs.map((tab) => (
        <button
          key={tab.key}
          title={tab.key}
          onClick={() => handleClick(tab.key)}
          className={`flex-1 flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 py-2 px-3 rounded-md text-sm transition-all 
            ${activeTab === tab.key
              ? "bg-white text-green-800 shadow-sm border border-gray-200"
              : "text-gray-600 hover:text-green-700 hover:bg-white"
            }`}
        >
          <div className="flex-shrink-0">{tab.icon}</div>
          <span className="text-[13px] sm:text-[14px]">{tab.label}</span>
        </button>
      ))}
    </div>
  );
};

export default SubTabs;
