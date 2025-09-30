import { useState, useEffect } from "react";
import { observer } from "mobx-react-lite";
import { toast } from "react-toastify";
import Button from "@mui/material/Button";
import { Plus, Save } from "lucide-react";
import ClientsDataTable from "./components/clientDataTable";
import FormModal, { FieldConfig } from "../../components/FormModal";
import { clientStore } from "../../store/ClientStore";

const Clients = observer(() => {
  const [modalOpen, setModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<any | null>(null);

  const clientFields: FieldConfig[] = [
    { label: "Full Name", key: "fullName", type: "text", required: true },
    { label: "Email", key: "email", type: "email", required: true },
    { label: "Phone", key: "phone", type: "text", required: true },
    { label: "SSN", key: "ssn", type: "text", required: true },
    { label: "Date of Birth", key: "dob", type: "date", required: true },
    { label: "Accident Date", key: "accidentDate", type: "date", required: true },
    { label: "Attorney Name", key: "attorneyName", type: "text", required: true },
    { label: "Address", key: "address", type: "textarea", fullWidth: true, required: true },
  ];

  const customFields: FieldConfig[] = clientStore.customFields || [];

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
          <h1 className="text-2xl font-bold ">Client Management</h1>
          <p className="text-gray-600 text-base">Manage client records and personal information</p>
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
        customFields={customFields}  // <-- Pass custom fields here
        initialData={editingClient || {}}
        submitButtonText={editingClient ? "Update Client" : <>
          <Save size={16} className="inline mr-1" /> Create Client
        </>
        }

        onSubmit={handleSave}
      />

      {/* Data Table */}
      <ClientsDataTable
        clients={clientStore.clients.slice()}
        loading={clientStore.loading}
        onSearch={(query: string) => clientStore.fetchClients(query)}
        onEdit={(client) => {
          setEditingClient(client);
          setModalOpen(true);
        }}
        onDelete={handleDelete}
      />
    </div>
  );
});

export default Clients;
