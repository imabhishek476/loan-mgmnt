import { useState, useEffect, useCallback } from "react";
import { Building2, FileText, StickyNote, User } from "lucide-react";
import { clientStore } from "../../../store/ClientStore";
import { companyStore } from "../../../store/CompanyStore";
import { toast } from "react-toastify";
import ClientNotes from "./ClientNotes";
import ClientViewTab from "./ClientViewTab";
import LoansTab from "./LoansTab";
import { fetchLoanByClientId } from "../../../services/LoanService";
import SummaryCards from "./SummaryCards";
import { loanStore } from "../../../store/LoanStore";
import ClientTemplatesTab from "./ClientTemplatesTab";

interface ClientViewScreenProps {
  open: boolean;
  onClose: () => void;
  client: any;
  onEditClient: (client: any) => void;
  initialEditingLoan?: any;
}

// eslint-disable-next-line react-refresh/only-export-components
const ClientViewScreen = ({ client, onEditClient }: ClientViewScreenProps) => {
  const [clientLoans, setClientLoans] = useState<any[]>([]);
  const [loadingClient, setLoadingClient] = useState(true);
  const [, setLoadingLoans] = useState(true);
  const [activeTab, setActiveTab] = useState<"client" | "loans" | "notes" | "templates">("client");
  const [loanRefreshKey, setLoanRefreshKey] = useState(0);
  const companies = companyStore.companies;
  const loadInitialData = async () => {
    try {
      setLoadingClient(true);
      setLoadingLoans(true);

      const promises = [];

      if (companyStore.companies.length === 0)
        promises.push(companyStore.fetchCompany());

      if (clientStore.clients.length === 0)
        promises.push(clientStore.fetchClients());

      await Promise.all(promises);

    } finally {
      setLoadingClient(false);
      setLoadingLoans(false);
    }
  };

  const loadData = useCallback(async () => {
    if (!client?._id) return;
    
    try {

      if (activeTab === "client" || activeTab === "loans") {
        const loans = await fetchLoanByClientId(client._id);
        setClientLoans(loans || []);
        loanStore.setLoans(loans || []);
      }

    } catch (err) {
      console.error(err);
      toast.error("Failed to load loans");
    } 
  }, [activeTab, client?._id]);

  useEffect(() => {
    if (!client?._id) return;
    loadInitialData();
  }, [client?._id]);

useEffect(() => {
  if (!client?._id) return;
  loadData();
}, [activeTab, client?._id, loanRefreshKey]);
  const tabs = [
  { key: "client", label: "Client Info", icon: <User size={16} /> },
  { key: "loans", label: "Loan History", icon: <Building2 size={16} /> },
  { key: "notes", label: "Notes", icon: <StickyNote size={16} /> },
  { key: "templates", label: "Templates", icon: <FileText size={16} /> },
];
const getInitials = (fullName?: string) => {
  if (!fullName) return "";

  const names = fullName.trim().split(" ");
  
  if (names.length === 1) {
    return names[0].charAt(0).toUpperCase();
  }

  return (
    names[0].charAt(0) +
    names[names.length - 1].charAt(0)
  ).toUpperCase();
};
return (
  <div className="flex-col ">
<div className="sticky top-0 z-20 bg-gray-50 pb-2">
  <SummaryCards clientLoans={clientLoans} />
  <div className="flex items-center justify-between px-4 mt-2 gap-4">
<h1 className="flex items-center gap-3 font-bold text-xl text-gray-800 border-b-2 border-green-700 pb-1">
  
  <div className="bg-green-700 text-white w-10 h-10 flex items-center justify-center rounded-lg font-bold">
    {getInitials(client?.fullName)}
  </div>

  <span className="whitespace-nowrap">
    {client?.fullName}
  </span>

</h1>

    <div className="flex-1 max-w-6xl">
      <div className="relative flex bg-gray-200 border border-gray-300 rounded-md p-1 shadow-sm">

        <div
          className="absolute top-1 bottom-1 rounded-md bg-[#166534] transition-all duration-300 ease-in-out"
          style={{
            width: `calc(${100 / tabs.length}% - 0.5rem)`,
            left: `calc(${
              (tabs.findIndex((t) => t.key === activeTab) * 100) /
              tabs.length
            }% + 0.25rem)`,
          }}
        />

        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as any)}
            className={`relative z-10 flex-1 py-2 text-sm font-semibold rounded-md transition ${
              activeTab === tab.key
                ? "text-white"
                : "text-gray-700 hover:text-green-700"
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <span className="text-lg">{tab.icon}</span>
              <span className="hidden md:inline text-sm">
                {tab.label}
              </span>
            </div>
          </button>
        ))}
      </div>
    </div>

  </div>
</div>
    
    <div className="flex-1  overflow-hidden ">
      {activeTab === "client" && (
            <ClientViewTab
              client={client}
              loadingClient={loadingClient}
              onEditClient={onEditClient}
              clientLoans={clientLoans} />  )}
      {activeTab === "loans" && (
        <>
        <LoansTab client = {client} clientLoans={clientLoans}  refreshKey={loanRefreshKey}  onDataChanged={() => setLoanRefreshKey(prev => prev + 1)}/>
        </>
      )}
      {activeTab === "notes" && (
        <ClientNotes
          clientId={client?._id}
          clientName={client?.fullName}
        />
      )}
      {activeTab === "templates" && (
            <ClientTemplatesTab
              client={client}
              clientLoans={clientLoans}
              companies={companies}
            /> 
        )}
    </div>
  </div>
  );
};
export default ClientViewScreen;
