import { Skeleton } from "@mui/material";
import { Pencil } from "lucide-react";
import LoanSummary from "./LoanSummary";

interface ClientViewTabProps {
    client: any;
    loadingClient: boolean;
    onEditClient: (client: any) => void;
    clientLoans: any[];
}

const ClientViewTab = (
    ({ client, loadingClient, onEditClient, clientLoans, }: ClientViewTabProps) => {

     return (
            <div className="h-[calc(90vh-80px)] overflow-hidden">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-2 h-full min-h-0">
                    <div className="overflow-hidden min-h-0 flex flex-col">

  {/* Header */}
  <div className="flex items-center mb-2 gap-3 border-b border-green-700 pt-2 shrink-0">
    <h3 className="font-bold text-gray-800">
      Client Information
    </h3>
    <Pencil
      size={18}
      className="text-green-700 cursor-pointer hover:text-green-900"
      onClick={() => onEditClient({ ...client })}
    />
  </div>

  {/* Body */}
  {loadingClient ? (
    <div className="p-3 space-y-3">
      <Skeleton variant="text" width={200} height={30} />
      <Skeleton variant="rectangular" height={80} />
      <Skeleton variant="rectangular" height={80} />
    </div>
  ) : (
    <div className="flex-1 overflow-y-auto pr-2">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-gray-700">

        <Info label="Full Name" value={client.fullName} />
        <Info label="Email" value={client.email} />
        <Info label="Phone" value={client.phone} />
        <Info label="DOB" value={client.dob} />
        <Info label="Accident Date" value={client.accidentDate} />
        <Info label="Attorney" value={client.attorneyId?.fullName || "—"} />
        <Info label="SSN" value={client.ssn} />
        <Info label="Underwriter" value={client.underwriter} />
        <Info label="Medical Paralegal" value={client.medicalParalegal} />
        <Info label="Case ID" value={client.caseId} />
        <Info label="Case Type" value={client.caseType} />
        <Info label="Index #" value={client.indexNumber} />
        <Info label="UCC Filed" value={client.uccFiled ? "Yes" : "No"} />
        <Info label="Address" value={client.address} />

        {/* Custom Fields */}
        {client?.customFields?.length > 0 && (
          <div className="sm:col-span-2 mt-2">
            <p className="text-xs uppercase text-gray-500 font-medium mb-2">
              Custom Fields
            </p>

            <div className="grid grid-cols-2 gap-1 bg-gray-50 p-2">
              {client.customFields.map((field, idx) => (
                <div className="col-span-1 flex text-gray-500 items-center gap-2 text-xs uppercase  font-medium ">
                  <p className="">
                    {field.name} :
                  </p>
                  <p className="font-semibold text-sm text-gray-700">{field.value || "—"}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Memo */}
        <div className="sm:col-span-2">
          <p className="text-xs uppercase text-gray-500 font-medium">
            Memo
          </p>
          <div className="bg-yellow-100 border-l-4 border-yellow-600 p-3 rounded text-sm">
            {client.memo || "—"}
          </div>
        </div>

      </div>
    </div>
  )}
</div>
                   <LoanSummary
                   client = {client}
                    clientLoans={clientLoans}/>
                </div>
            </div>
        );   
    });

const Info = ({ label, value }: { label: string; value: string }) => (
    <div>
        <p className="text-xs uppercase text-gray-500 font-medium">{label}</p>
        <p className="font-semibold text-sm">{value || "—"}</p>
    </div>
);
export default ClientViewTab;