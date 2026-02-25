import { observer } from "mobx-react-lite";
import { clientStore, type Client } from "../../../store/ClientStore";
import { useParams } from "react-router-dom";
import ClientViewModal from "./ClientViewModal";
import { useEffect, useState } from "react";
import FormModal, { type FieldConfig } from "../../../components/FormModal";
import { toast } from "react-toastify";
import { getAttorney } from "../../../services/AttorneyServices";
import ClientDetailsSkeleton from "../../components/ClientDetailsSkeleton";

const ClientDetailsPage = observer(() => {
  const { id } = useParams();

  const [modalOpen, setModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [attorneyOptions, setAttorneyOptions] = useState<any[]>([]);

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
    // { label: "Attorney Name", key: "attorneyName", type: "text" },
      {
  label: "Attorneya",
  key: "attorneyId",
  type: "select",
  options: attorneyOptions.map((attorney) => ({
    label: attorney.fullName,
    value: attorney._id,
  })),
},
    { label: "Medical Paralegal", key: "medicalParalegal", type: "text" },
    { label: "Case ID", key: "caseId", type: "text" },
    { label: "Index #", key: "indexNumber", type: "text" },
    { label: "Case Type", key: "caseType", type: "text" },
    { label: "Address", key: "address", type: "text" },
    { label: "Date of Birth", key: "dob", type: "date" },
    { label: "Accident Date", key: "accidentDate", type: "date" },
    { label: "Memo", key: "memo", type: "textarea" },
  ];

  const customFields: { id: number; name: string; value: string | number | boolean; type: "string" | "number"; }[] =
    (clientStore.customFields || []).map((field: FieldConfig, idx: number) => ({
      id: idx,
      name: field.key,
      value: "",
      type: field.type === "text" || field.type === "textarea" ? "string" : field.type === "number" ? "number" : "string",
    }));
  useEffect(() => {
    if (id) {
      clientStore.fetchClientById(id);
    }
  }, [id]);


  const client = clientStore.selectedClient;

const loadAttorneys = async () => {
  try {
    const res = await getAttorney();
    setAttorneyOptions(res.data || []);
  } catch (err) {
    console.error("Failed to load attorneys", err);
  }
};
useEffect(() => {
  if (modalOpen) {
    loadAttorneys();
  }
}, [modalOpen]);
if (!client) return <ClientDetailsSkeleton />;
  return (
    <div className="w-full text-left flex flex-col">

      <ClientViewModal
        open={true}
                onClose={() => {
  setModalOpen(false);
  setEditingClient(null);

  if (id) clientStore.fetchClientById(id);
}}
        client={client}
        onEditClient={(clientData: Client) => {
          setEditingClient(clientData);
          setModalOpen(true);
        }}
      />

      <FormModal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditingClient(null);
        }}
        title="Edit Client"
        fields={clientFields}
        //@ts-ignore
        customFields={customFields}
           initialData={editingClient || {}}

        onSubmit={async (data:any) => {
          if (!editingClient) return;

          await clientStore.updateClient(editingClient._id, data);
          toast.success("Client updated successfully");

          await clientStore.fetchClientById(editingClient._id);

          setModalOpen(false);
          setEditingClient(null);
        }}
      />
    </div>
  );
});

export default ClientDetailsPage;