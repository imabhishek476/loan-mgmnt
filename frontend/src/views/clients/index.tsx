import { useAppSelector } from "../../hooks/user";
import Button from "@mui/material/Button";
import { Plus } from "lucide-react";
import { useState, useEffect } from "react";
import ClientsDataTable from "./components/clientDataTable";
import { getClientsSearch, createClient, updateClient, deleteClient } from "../../services/ClientServices";
import FormModal, { FieldConfig } from "../../components/FormModal";
import { toast } from "react-toastify";
const Clients = () => {
  const [modalOpen, setModalOpen] = useState(false);
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingClient, setEditingClient] = useState<any | null>(null);

  const fetchClients = async (query = "") => {
    setLoading(true);
    try {
      const data = await getClientsSearch({ query });
      setClients(data || []);
    } catch (error) {
      console.error("Error fetching clients:", error);
      setClients([]);
    } finally {
      setLoading(false);
    }
  };


  useEffect(() => {
    fetchClients();
  }, []);

  const clientFields: FieldConfig[] = [
    { label: "Full Name", key: "fullName", type: "text", required: true },
    { label: "Email", key: "email", type: "email", required: true },
    { label: "Phone", key: "phone", type: "text", required: true },
    { label: "SSN", key: "ssn", type: "text" },
    { label: "Date of Birth", key: "dob", type: "date" },
    { label: "Accident Date", key: "accidentDate", type: "date" },
    { label: "Attorney Name", key: "attorneyName", type: "text" },
    { label: "Address", key: "address", type: "textarea", fullWidth: true },
  ];
  const handleSave = async (data: any) => {
    if (editingClient) {
      const response = await updateClient(editingClient._id, data);
      setClients((prev) =>
        prev.map((c) => (c._id === editingClient._id ? response.client : c))
      );
      setEditingClient(null);
      return response;
    } else {
      const response = await createClient(data);
      setClients((prev) => [...prev, response.client]);
      return response;
    }
  };
  const handleDelete = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this client?")) {
      await deleteClient(id);
      setClients((prev) => prev.filter((c) => c._id !== id));
      toast.success("Client deleted successfully");
    }
  };

  return (
    <div className="text-left flex bg-white transition-all duration-300 pl-[70px] lg:pl-0">
      <div className="w-full flex flex-col mx-auto">
        <div className="mb-8 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div>
            <h1 className="text-xl font-bold text-gray-700">Client Management</h1>
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
              "&:hover": { backgroundColor: "#0f3f23", boxShadow: "0 4px 8px rgba(0,0,0,0.3)" },
            }}
            startIcon={<Plus />}
            onClick={() => {setEditingClient(null);setModalOpen(true);
            }}
          >
            New Client
          </Button>
        </div>

        <FormModal
          open={modalOpen}
          onClose={() => {
          setModalOpen(false);
          setEditingClient(null);
        }}
          title={editingClient ? "Edit Client" : "Add New Client"}
          fields={clientFields}
          initialData={editingClient || {}}
          onSubmit={handleSave}
        />
        <ClientsDataTable
          clients={clients}
          loading={loading}
          onSearch={fetchClients}
          onEdit={(client) => {
            setEditingClient(client);
            setModalOpen(true);
          }}
          onDelete={handleDelete}
        />
      </div>
    </div>
  );
};


export default Clients;
