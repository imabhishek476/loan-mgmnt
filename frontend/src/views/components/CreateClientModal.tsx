import { observer } from "mobx-react-lite";
import { useEffect, useState, useMemo, useCallback } from "react";
import type { FieldConfig } from "../../components/FormModal";
import { getLoanTypeOptions } from "../../utils/helpers";
import { clientStore } from "../../store/ClientStore";
import { getAttorney } from "../../services/AttorneyServices";
import FormModal from "../../components/FormModal";
import { toast } from "react-toastify";

const ClientClientModal = observer(() => {
  const [attorneyOptions, setAttorneyOptions] = useState<any[]>([]);
  const [requestedBy, setRequestedBy] = useState("");

  const clientFields: FieldConfig[] = useMemo(() => [
    { label: "Full Name", key: "fullName", type: "text", required: true },
    { label: "Email", key: "email", type: "email" },
    { label: "Phone", key: "phone", type: "text" },
    { label: "SSN / TIN (Last 4 Digits)", key: "ssn", type: "text" },
    {
      label: "Attorney",
      key: "attorneyId",
      type: "select",
      options: attorneyOptions.map((a) => ({
        label: a.fullName,
        value: a._id,
      })),
    },
    {
        label: "Medical Paralegal Type",
        key: "requestedBy",
        type: "select",
        options: [
          { label: "Applicant", value: "applicant" },
          { label: "Law Office", value: "law_office" },
        ],
        onChange: (value: string) => setRequestedBy(value),
      },
      {
        label:
          requestedBy === "law_office"
            ? "Law Office Name"
            : "Applicant Name",
        key: "medicalParalegal",
        type: "text",
      },
    {
      label: "Loan Type",
      key: "loanType",
      type: "select",
      options: getLoanTypeOptions(),
    },
    { label: "Address", key: "address", type: "text" },
    { label: "Date of Birth", key: "dob", type: "date" },
    { label: "Accident Date", key: "accidentDate", type: "date" },
    { label: "Memo", key: "memo", type: "textarea" },
  ], [attorneyOptions]);

  const customFields = useMemo(() => {
    return (clientStore.customFields || []).map((field: FieldConfig, idx: number) => ({
      id: idx,
      name: field.key,
      value: "",
      type: field.type === "number" ? "number" : "string",
    }));
  }, [clientStore.customFields]);

  const loadAttorneys = useCallback(async () => {
    const res = await getAttorney();
    setAttorneyOptions(res.data || []);
  }, []);
  const handleSave = async (data: any) => {
    try {

        await clientStore.createClient(data);       
        toast.success("New Client added successfully");
        try {
        await clientStore.refreshDataTable();
        } catch (refreshError) {
          console.error("Refresh error:", refreshError);
        }
        clientStore.createClientModalOpen; 
    } catch (error: any) {
      console.error("Save error:", error);
      const backendMessage =
        error?.response?.data?.message ||  
        error?.response?.data?.error ||  
        error?.message ||      
        "Failed to save Client";
      toast.error(backendMessage);
    }
  };
  useEffect(() => {
    if (clientStore.createClientModalOpen) {
      loadAttorneys();
    }
  }, [clientStore.createClientModalOpen, loadAttorneys]);

  return (
    <div className="text-left flex flex-col transition-all duration-300">
      <FormModal
        open={clientStore.createClientModalOpen}
        onClose={() => clientStore.toggleCreateClientModal(false)}
        title="New Client"
        fields={clientFields}
        //@ts-ignore
        customFields={customFields}
        onSubmit={handleSave}
      />
    </div>
  );
});

export default ClientClientModal;