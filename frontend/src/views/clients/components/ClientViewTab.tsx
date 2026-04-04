import { Skeleton } from "@mui/material";
import { Pencil, User } from "lucide-react";
import LoanSummary from "./LoanSummary";
import {
  Mail,
  Phone,
  MapPin,
  Scale,
  Shield,
} from "lucide-react";
import { formatSSN } from "../../../utils/helpers";

interface ClientViewTabProps {
  client: any;
  loadingClient: boolean;
  onEditClient: (client: any) => void;
  clientLoans: any[];
}

const ClientViewTab = ({
  client,
  loadingClient,
  onEditClient,
  clientLoans,
}: ClientViewTabProps) => {
  return (
<div className="flex flex-col h-[calc(92vh-90px)] overflow-hidden p-4 bg-gray-50">
<div className="grid grid-cols-1 lg:grid-cols-12 gap-4 flex-1 min-h-0">
      {/* LEFT SIDE */}
      <div className="flex flex-col min-h-0 lg:col-span-4">

        {loadingClient ? (
          <div className="p-3 space-y-3">
            <Skeleton variant="text" width={200} height={30} />
            <Skeleton variant="rectangular" height={80} />
            <Skeleton variant="rectangular" height={80} />
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm border flex flex-col h-full overflow-hidden">

            {/* Header */}
            <div className="flex justify-between items-center p-2 ">
                
                <h3 className="font-semibold text-gray-800 text-lg tracking-wide flex gap-2 items-center">
                <div className="bg-green-100 p-2 rounded-lg">
                  <User size={18} className="text-green-700" />
                </div> Customer Information
                </h3>
              <button
                onClick={() => onEditClient({ ...client })}
                className="bg-green-700 hover:bg-green-800 text-white text-xs font-semibold px-3 py-1.5 rounded-lg flex items-center gap-1"
              >
                <Pencil size={14} /> Edit
              </button>
            </div>

            {/* SCROLL AREA */}
            <div className="flex-1 overflow-auto p-4 space-y-4">

              {/* Profile Section */}
              {/* <div className="bg-gray-100 rounded-xl p-3 flex items-center gap-3">
                <div className="bg-green-700 text-white w-10 h-10 flex items-center justify-center rounded-lg font-bold">
                  {client.fullName?.charAt(0)}
                </div>
                <div>
                  <p className="font-semibold text-gray-800">
                    {client.fullName}
                  </p>
                </div>
              </div> */}

              {/* Main Info */}
              <div className="space-y-2 text-sm text-gray-700">
                <InfoRow icon={<Mail size={16} />} label="full Name" value={client.fullName} />
                <InfoRow icon={<Mail size={16} />} label="Email" value={client.email} />
                <InfoRow icon={<Phone size={16} />} label="Phone" value={client.phone} />
                <InfoRow icon={<MapPin size={16} />} label="Mailing Address"  value={
                  `${client.address || ""}, ${client.city || ""}, ${client.state || ""} ${client.zipCode || ""}`.trim()
                } />
                <InfoRow icon={<Scale size={16} />} label="Attorney" value={client.attorneyId?.fullName} />
                <InfoRow icon={<Shield size={16} />} label="SSN" value={formatSSN(client.ssn)} />
              </div>

              {/* Secondary Info */}
              <div className="border rounded-xl p-3 grid grid-cols-2 gap-3 text-xs">
                <MiniInfo label="DOB" value={client.dob} />
                <MiniInfo label="Accident Date" value={client.accidentDate} />
                {/* <MiniInfo label="Underwriter" value={client.underwriter} /> */}
                <MiniInfo label="Medical Paralegal" value={client.medicalParalegal} />
                {/* <MiniInfo label="Index #" value={client.indexNumber} /> */}
                <MiniInfo label="Case ID" value={client.caseId} />
                <MiniInfo label="Loan Type" value={client.loanType} />

                {/* <MiniInfo label="UCC Filed" value={client.uccFiled ? "Yes" : "No"} /> */}
              </div>

              {/* Custom Fields */}
               {client?.customFields?.length > 0 && client?.customFields[0]?.name?.length > 0  ? (
                <div>
                  <p className="text-xs font-semibold text-green-700 uppercase mb-2">
                    Custom Fields
                  </p>

                  <div className="flex flex-wrap gap-2">
                    {client.customFields.map((field: any, idx: number) => (
                      <span
                        key={idx}
                        className="bg-gray-200 text-gray-700 text-xs px-2 py-1 rounded-full"
                      >
                        <span className="text-green-600 font-semibold">
                          {field.name}
                        </span>:{" "}
                        <span className="text-gray-800 font-medium">
                          {field.value}
                        </span>
                      </span>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="text-xs text-gray-600 font-semibold italic">
                  No custom fields available.
                </p>
              )}

              {/* Memo */}
              <div>
                <p className="text-xs font-semibold text-green-700 uppercase mb-1">
                  Memo
                </p>
                <div className="bg-yellow-100 border-l-4 border-green-700 p-3 rounded text-sm text-gray-700">
                  {client.memo || "—"}
                </div>
              </div>

            </div>
          </div>
        )}
      </div>

      {/* RIGHT SIDE */}
     <div className="flex flex-col min-h-0 lg:col-span-8">
        <div className="flex-1 min-h-0">
          <LoanSummary client={client} clientLoans={clientLoans} />
        </div>
      </div>

    </div>
  </div>
);
};

const InfoRow = ({
  icon,
  label,
  value,
}: {
  icon: any;
  label: string;
  value: string;
}) => (
  <div className="flex items-start gap-3">
    <div className="bg-gray-100 p-2 rounded-lg text-green-700">
      {icon}
    </div>
    <div>
      <p className="text-xs text-gray-700 font-medium uppercase">{label}</p>
      <p className="font-semibold text-gray-800">{value || "—"}</p>
    </div>
  </div>
);

const MiniInfo = ({
  label,
  value,
}: {
  label: string;
  value: string;
}) => (
  <div>
    <p className="text-xs text-gray-700 font-medium uppercase">{label}</p>
    <p className="font-semibold text-gray-800">{value || "—"}</p>
  </div>
);

export default ClientViewTab;