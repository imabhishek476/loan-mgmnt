import React, { useState, useEffect, useRef } from "react";
import { X, FileText, DollarSign } from "lucide-react";
import LoanTable from "../../loans/components/LoanTable";
import { loanStore } from "../../../store/LoanStore";
import { clientStore } from "../../../store/ClientStore";
import { companyStore } from "../../../store/CompanyStore";
import { toast } from "react-toastify";
interface ClientViewModalProps {
    open: boolean;
    onClose: () => void;
    client: any;
}

const ClientViewModal = ({ open, onClose, client }: ClientViewModalProps) => {
    const [activeTab, setActiveTab] = useState<"details" | "history">("details");
    const hasLoaded = useRef(false);
    const loadInitialData = async () => {
        try {
            await Promise.all([
                companyStore.fetchCompany(),
                clientStore.fetchClients(),
                loanStore.fetchLoans(),
            ]);
        } catch (error) {
            console.error(error);
            toast.error("Failed to load data");
        }
    };

    useEffect(() => {
        if (!hasLoaded.current) {
            loadInitialData();
            hasLoaded.current = true;
        }
    }, []);
    if (!open) return null;

    const tabs = [
        { key: "details", label: "Personal Info", icon: <FileText size={18} /> },
        { key: "history", label: "Loan History", icon: <DollarSign size={18} /> },
    ];

    const handleDeleteLoan = async (id: string) => {
        try {
            await loanStore.deleteLoan(id);
            toast.success("Loan deleted successfully!");
        } catch (error) {
            console.error("Error deleting loan:", error);
            toast.error("Failed to delete loan");
        }
    };


    return (
        <div className="fixed inset-0 z-50 flex justify-center items-start pt-10 bg-black/50 overflow-auto">
            <div className="bg-white rounded-lg w-full max-w-6xl shadow-lg relative mx-4 sm:mx-6 max-h-[90vh] flex flex-col">
                {/* Header */}
                <div className="flex justify-between items-center p-4 border-b sticky top-0 bg-white z-10">
                    <h2 className="text-2xl font-bold text-gray-800">{client.fullName}</h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-800">
                        <X className="w-6 h-6" />
                    </button>
                </div>
                <div className="flex bg-gray-100 p-1 rounded-lg mx-4 my-4">
                    {tabs.map((tab) => (
                        <button
                            key={tab.key}
                            onClick={() => setActiveTab(tab.key as any)}
                            className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-md font-medium transition-all
                ${activeTab === tab.key
                                    ? "bg-white text-green-800 shadow-sm border border-gray-200"
                                    : "text-gray-600 hover:text-green-700 hover:bg-white"
                                }`}
                        >
                            {tab.icon} {tab.label}
                        </button>
                    ))}
                </div>
                <div className="flex-1 overflow-y-auto p-6 bg-white">
                    {activeTab === "details" && (
                        <div className="grid sm:grid-cols-2 gap-4 text-gray-700">
                            <div><span className="font-semibold">Full Name:</span> {client.fullName}</div>
                            <div><span className="font-semibold">Email:</span> {client.email}</div>
                            <div><span className="font-semibold">Phone:</span> {client.phone}</div>
                            <div><span className="font-semibold">DOB:</span> {client.dob}</div>
                            <div><span className="font-semibold">Accident Date:</span> {client.accidentDate}</div>
                            <div><span className="font-semibold">Attorney:</span> {client.attorneyName}</div>
                            <div><span className="font-semibold">SSN:</span> {client.ssn}</div>
                            <div className="sm:col-span-2"><span className="font-semibold">Address:</span> {client.address}</div>
                        </div>
                    )}

                    {activeTab === "history" && (
                        <LoanTable
                            clientId={client._id}
                            onDelete={handleDeleteLoan}
                        />
                    )}
                </div>
            </div>
        </div>
    );
};

export default ClientViewModal;
