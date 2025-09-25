import { useAppSelector } from "../../hooks/user";
import Button from "@mui/material/Button";
import { Plus } from "lucide-react";
import { useState, useEffect } from "react";
import ClientsDataTable from "./components/clientDataTable";
import { getClientsSearch, createClient } from "../../services/ClientServices";
import FormModal, { FieldConfig } from "../../components/FormModal";
const Clients = () => {
  const [modalOpen, setModalOpen] = useState(false);
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

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
            onClick={() => setModalOpen(true)}
          >
            New Client
          </Button>
        </div>
        <FormModal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          title="Add New Client"
          fields={clientFields}
          onSubmit={async (data) => {
            const response = await createClient(data);
            setClients((prev) => [...prev, response.client]);
            return response;
          }}
        />
        <ClientsDataTable
          clients={clients}
          loading={loading}
          onSearch={fetchClients}
        />
      </div>
    </div>
  );
};


export default Clients;
