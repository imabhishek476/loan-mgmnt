import { useState, useEffect } from "react";
import { observer } from "mobx-react-lite";
import { toast } from "react-toastify";
import Button from "@mui/material/Button";
import { Plus, Save } from "lucide-react";
import ClientsDataTable from "./components/clientDataTable";
import FormModal, { type FieldConfig } from "../../components/FormModal";
import { clientStore, type Client } from "../../store/ClientStore";
import { getClientLoans } from "../../services/ClientServices";
import Loans from "../loans/index";
import ClientViewModal from "../../views/clients/components/ClientViewModal";
const Clients = observer(() => {
  const [modalOpen, setModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState(null);
  const [loanModalOpen, setLoanModalOpen] = useState(false);
  const [selectedClientForLoan, setSelectedClientForLoan] = useState(null);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [viewClient, setViewClient] = useState(null);

  const handleViewClient = async (client: Client) => {
    try {
      const loans = await getClientLoans(client._id!);
      setViewClient({ ...client, loans });
      setViewModalOpen(true);
    } catch (error) {
      console.error("Failed to fetch client loans", error);
    }
  };


  const handleAddLoan = (client: any) => {
    setSelectedClientForLoan(client);
    setLoanModalOpen(true);
  };

  const clientFields: FieldConfig[] = [
    { label: "Full Name", key: "fullName", type: "text", required: true },
    { label: "Email", key: "email", type: "email" },
    { label: "Phone", key: "phone", type: "text" },
    { label: "SSN", key: "ssn", type: "text" },
    { label: "Date of Birth", key: "dob", type: "date" },
    { label: "Accident Date", key: "accidentDate", type: "date" },
    { label: "Attorney Name", key: "attorneyName", type: "text" },
    { label: "Memo", key: "memo", required: false ,type: "textarea" },
    { label: "Address", key: "address", type: "textarea" },
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
        await clientStore.updateClient(editingClient._id, data);
        toast.success("Client updated successfully 🎉");
        setEditingClient(null);
      } else {
        await clientStore.createClient(data);
        toast.success("New client added successfully 🎉");
      }
      setModalOpen(false);
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Failed to save client");
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this client?")) {
      await clientStore.deleteClient(id);
      toast.success("Client deleted successfully");
    }
  };

  useEffect(() => {
    clientStore.fetchClients();
  }, []);

  return (
    <div className="text-left flex flex-col bg-white transition-all duration-300">
      {/* Header */}
      <div className="mb-8 flex flex-col sm:flex-row justify-between items-center gap-4">
        <div>
          <h1 className="text-2xl  text-gray-800 font-bold ">Customer Management</h1>
          <p className="text-gray-600 text-base">Manage customer records and personal information</p>
        </div>

        <Button
          variant="contained"
          sx={{
            backgroundColor: "#145A32",
            fontWeight: 600,
            textTransform: "none",
            borderRadius: "8px",
            padding: "8px 10px",
            fontSize: "14px",
            boxShadow: "0 3px 6px rgba(0,0,0,0.2)",
            "&:hover": { backgroundColor: "#0f3f23" },
          }}
          startIcon={<Plus />}
          onClick={() => {
            setEditingClient(null);
            setModalOpen(true);
          }}
        >
          New Client
        </Button>
      </div>

      {/* Form Modal */}
      <FormModal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditingClient(null);
        }}
        title={editingClient ? "Edit Client" : "New Client"}
        fields={clientFields}
        //@ts-ignore 
        customFields={customFields}
        initialData={editingClient || {}}
        submitButtonText={editingClient ? "Update Client" : <>
          <Save size={16} className="inline mr-1" /> Create Client
        </>
        }

        onSubmit={handleSave}
      />
      {loanModalOpen && (
        <Loans
          defaultClient={selectedClientForLoan}
          onClose={() => setLoanModalOpen(false)}
          showTable={false}
          fromClientPage={true}
        />
      )}
      {viewModalOpen && viewClient && (
        <ClientViewModal
          open={viewModalOpen}
          onClose={() => setViewModalOpen(false)}
          client={viewClient}
          //@ts-ignore
          loans={viewClient.loans || []}
        />
      )}
      {/* Data Table */}
      <ClientsDataTable
        clients={clientStore.clients.slice()}
        loading={clientStore.loading}
        onSearch={(query: string) => clientStore.fetchClients(query)}
        onEdit={(client) => {
          setEditingClient(client);
          setModalOpen(true);
        }}
        onAddLoan={handleAddLoan}
        onViewClient={handleViewClient}
        onDelete={handleDelete}
      />
    </div>
  );
});

export default Clients;
