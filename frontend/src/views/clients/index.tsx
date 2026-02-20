import React, { useState} from "react";
import { observer } from "mobx-react-lite";
import { toast } from "react-toastify";
import Button from "@mui/material/Button";
import { Plus, Save } from "lucide-react";
import ClientsDataTable from "./components/clientDataTable";
import { type FieldConfig } from "../../components/FormModal";
import { clientStore, type Client } from "../../store/ClientStore";
// import { activeLoans } from "../../services/LoanService";
import Loans from "../loans/index";
import { useNavigate } from "react-router-dom";
// import { loanStore } from "../../store/LoanStore";
const FormModal = React.lazy(()=> import("../../components/FormModal"))
const Clients = observer(() => {
  const [modalOpen, setModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState(null);
  const [selectedClientForLoan, setSelectedClientForLoan] = useState(null);
  const [viewClient, setViewClient] = useState(null);
  const navigate = useNavigate();
  const handleViewClient = (client: Client) => {
    navigate(`/client/${client._id}`);
  };
  const handleAddLoan = (client: any) => {
    // loanStore.fetchActiveLoans(client._id); //active loan
    setSelectedClientForLoan(client);
    clientStore.toggleLoanModel();
  };

const clientFields: FieldConfig[] = [
  { label: "Full Name", key: "fullName", type: "text", required: true },
  { label: "Email", key: "email", type: "email" },
  { label: "Phone", key: "phone", type: "text" },
  { label: "SSN / TIN (Last 4 Digits)", key: "ssn", type: "text" },
  { label: "Underwriter", key: "underwriter", type: "text" },
  { 
    label: "UCC Filed", 
    key: "uccFiled", 
    type: "select",
    options: [
      { label: "Yes", value: true },
      { label: "No", value: false },
    ],
  },
  { label: "Attorney Name", key: "attorneyName", type: "text" },
  { label: "Medical Paralegal", key: "medicalParalegal", type: "text" },
  { label: "Case ID", key: "caseId", type: "text" },
  { label: "Index #", key: "indexNumber", type: "text" },
  { label: "Case Type", key: "caseType", type: "text" },
  { label: "Address", key: "address", type: "text" },
  { label: "Date of Birth", key: "dob", type: "date" },
  { label: "Accident Date", key: "accidentDate", type: "date" },
  { label: "Memo", key: "memo", type: "textarea", required: false },
];

  const customFields: { id: number; name: string; value: string | number | boolean; type: "string" | "number"; }[] =
    (clientStore.customFields || []).map((field: FieldConfig, idx: number) => ({
      id: idx,
      name: field.key,
      value: "",
      type: field.type === "text" || field.type === "textarea" ? "string" : field.type === "number" ? "number" : "string",
    }));

const handleSave = async (data: any) => {
  try {
    if (editingClient) {
      await clientStore.updateClient(editingClient?._id, data);

      toast.success("Customer updated successfully");

      // refresh data safely
      try {
        await clientStore.refreshDataTable();
        const refreshedClient = clientStore.clients.find(
          (c) => c?._id === editingClient?._id
        );
        if (refreshedClient) setViewClient(refreshedClient);
      } catch (refreshError) {
        console.error("Refresh error:", refreshError);
      }

      setEditingClient(null);
      setModalOpen(false);
    } else {
      await clientStore.createClient(data);
       
      toast.success("New Customer added successfully");

      try {
       await clientStore.refreshDataTable();
      } catch (refreshError) {
        console.error("Refresh error:", refreshError);
      }

      setModalOpen(false);
    }
  } catch (error: any) {
    console.error("Save error:", error);
    toast.error(error.response?.data?.error || "Failed to save Customer");
  }
};


  return (
    <div className="text-left flex flex-col transition-all duration-300">
      {/* Header */}
      <div className="mb-2 flex flex-col sm:flex-row justify-between items-left gap-4 ">
        <div>
          <h1 className="text-2xl  text-gray-800 font-bold ">
            Client Management
          </h1>
          {/* <p className="text-gray-600 text-base">
            Manage customer records and personal information
          </p> */}
        </div>

        <Button
          variant="contained"
          sx={{
            backgroundColor: "#15803d",
            "&:hover": { backgroundColor: "#166534" },
            textTransform: "none",
            fontWeight: 600,
            borderRadius: 1,
            px: 3,
            py: 1,
          }}
          title="New Customer"
          startIcon={<Plus />}
          onClick={() => {
            setEditingClient(null);
            setModalOpen(true);
          }}
        >
          New Customer
        </Button>
      </div>

      {/* Form Modal */}
      <FormModal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditingClient(null);
        }}
        title={editingClient ? "Edit Customer" : "New Customer"}
        fields={clientFields}
        //@ts-ignore
        customFields={customFields}
        initialData={editingClient || {}}
        submitButtonText={
          editingClient ? (
            "Update Customer"
          ) : (
            <>
              <Save size={16} className="inline mr-1" /> Create Customer
            </>
          )
        }
        onSubmit={handleSave}
      />
        <Loans
          defaultClient={selectedClientForLoan}
          showTable={false}
          fromClientPage={true}
        />   
      {/* {viewModalOpen && viewClient && (
        <ClientViewModal
          open={viewModalOpen}
          onClose={() => setViewModalOpen(false)}
          client={viewClient}
          //@ts-ignore
          loans={viewClient.loans || []}
          onEditClient={(client) => {
            setEditingClient(client);
            setModalOpen(true);
          }}
        />
      )} */}
      {/* Data Table */}
      <ClientsDataTable
        onAddLoan={handleAddLoan}
        onViewClient={handleViewClient}
      />
    </div>
  );
});

export default Clients;
