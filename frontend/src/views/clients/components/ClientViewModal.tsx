import { useState, useEffect, useCallback } from "react";
import { Building2, FileText, StickyNote, User } from "lucide-react";
import { clientStore } from "../../../store/ClientStore";
import { companyStore } from "../../../store/CompanyStore";
import { toast } from "react-toastify";
import ClientNotes from "./ClientNotes";
import ClientViewTab from "./ClientViewTab";
import LoansTab from "./LoansTab";
import { activeLoansData } from "../../../services/LoanService";

interface ClientViewModalProps {
  open: boolean;
  onClose: () => void;
  client: any;
  onEditClient: (client: any) => void;
  initialEditingLoan?: any;
}

// eslint-disable-next-line react-refresh/only-export-components
const ClientViewModal = ({ client, onEditClient }: ClientViewModalProps) => {
  const [clientLoans, setClientLoans] = useState<any[]>([]);
  const [loadingClient, setLoadingClient] = useState(true);
  const [, setLoadingLoans] = useState(true);
  const [activeTab, setActiveTab] = useState<"client" | "loans" | "notes" | "templates">("client");
  const [loading, setLoading] = useState(true);

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
      setLoading(true);

      if (activeTab === "client" || activeTab === "loans") {
        const loans = await activeLoansData(client._id);
        setClientLoans(loans || []);
      }

    } catch (err) {
      console.error(err);
      toast.error("Failed to load loans");
    } finally {
      setLoading(false);
    }
  }, [activeTab, client?._id]);

  useEffect(() => {
    if (!client?._id) return;
    loadInitialData();
  }, [client?._id]);

  useEffect(() => {
    if (!client?._id) return;
    loadData();
  }, [activeTab, client?._id]);
  const tabs = [
  { key: "client", label: "Client Info", icon: <User size={16} /> },
  { key: "loans", label: "Loan History", icon: <Building2 size={16} /> },
  { key: "notes", label: "Notes", icon: <StickyNote size={16} /> },
  { key: "templates", label: "Templates", icon: <FileText size={16} /> },
];
return (
  <div className="flex-col">
    <div className=" sticky top-0 z-20">
      <div className="border-b  py-1 my-2 sticky top-0 z-20  flex justify-between items-left">
        <h1 className="font-bold text-xl text-gray-800">
          {client.fullName}
        </h1>
        </div>
       <div className="sticky top-[48px] z-20 px-3">
        <div className="flex items-center gap-3 w-ful my-2l">
          <div className="flex-1">
            <div className="relative flex bg-gray-100 border border-gray-300 rounded-md p-1 shadow-sm w-full">
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
                  <div className="flex flex-col md:flex-row items-center justify-center gap-1 md:gap-2">
                            <span className="text-lg">{tab.icon}</span>
                    <span className="text-xs md:text-sm">{tab.label}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
    {/* Content */}
    <div className="flex-1  overflow-hidden ">
      {/* ✅ Client TAB */}
      {activeTab === "client" && (
            <ClientViewTab
              client={client}
              loadingClient={loadingClient}
              onEditClient={onEditClient}
              clientLoans={clientLoans} />  )}
      {/* ✅ LOANS TAB */}
      {activeTab === "loans" && (
        <>
        <LoansTab client = {client} clientLoans={clientLoans} />
        </>
      )}
      {activeTab === "notes" && (
        // <div className="h-[calc(80vh-53px)] overflow-y-auto p-3">
        <ClientNotes
          clientId={client._id}
          clientName={client.fullName}
        />
        // </div>
      )}
      {activeTab === "templates" && (
        <div className="flex flex-col items-center justify-center py-12 text-gray-500">
          <FileText size={28} className="mb-2 text-gray-400" />
          <p className="text-sm font-semibold">No Templates Available</p>
          <p className="text-xs mt-1">
            You haven’t created any templates yet.
          </p>
          </div>
        )}
    </div>
  </div>
  );
};
export default ClientViewModal;
