import { useState, useMemo, useEffect } from "react";
import moment from "moment";
import { Autocomplete, TextField } from "@mui/material";
import { DocTypes, formatFee, moneyFormat } from "../../../utils/constants";
import { toast } from "react-toastify";
import { loanStore } from "../../../store/LoanStore";
import api from "../../../api/axios";

interface ClientTemplateTabProps {
  client: any;
  clientLoans: any[];
  companies: any[];
}

const ClientTemplatesTab = ({
  client,
  clientLoans,
  companies,
}: ClientTemplateTabProps) => {

  const [selectedCompany, setSelectedCompany] = useState<any>(null);
  const [selectedLoan, setSelectedLoan] = useState<any>(null);
  const [selectedDocType, setSelectedDocType] = useState<any>(null);
  const [selectedDocument, setSelectedDocument] = useState<any>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  /* ---------------- Company Options ---------------- */

  const companyOptions = useMemo(() => {
    const map = new Map();

    clientLoans.forEach((loan: any) => {
      const id = loan.company?._id || loan.company;

      const name =
        loan.company?.companyName ||
        companies.find((c: any) => c._id === id)?.companyName ||
        "Unknown";

      if (!map.has(id)) map.set(id, { _id: id, companyName: name });
    });

    return Array.from(map.values());
  }, [clientLoans, companies]);

  /* ---------------- Filter Loans ---------------- */

  const companyLoans = useMemo(() => {
    if (!selectedCompany) return [];

    return clientLoans.filter((loan: any) => {
      const id = loan.company?._id || loan.company;
      return id === selectedCompany._id;
    });
  }, [selectedCompany, clientLoans]);

  /* ---------------- Company Name ---------------- */

  const companyName = useMemo(() => {
    if (!selectedLoan) return "";

    return (
      selectedLoan?.company?.companyName ||
      companies.find((c) => c._id === selectedLoan.company)?.companyName ||
      ""
    );
  }, [selectedLoan, companies]);

  /* ---------------- Company Address ---------------- */

  const companyObj = useMemo(() => {
    if (!selectedLoan) return null;

    const id = selectedLoan.company?._id || selectedLoan.company;

    return companies.find((c) => c._id === id);
  }, [selectedLoan, companies]);
 const companyData = useMemo(() => {
    if (!companyObj) return {};

    return {
      name: companyObj.companyName || "",
      address: `${companyObj.address || ""} ${companyObj.city || ""}`.trim(),
      email: companyObj.email || "",
      phone: companyObj.phone || "",
    };
  }, [companyObj]);

  /* ---------------- Filter Documents ---------------- */

  const companyDocs = useMemo(() => {
    if (!selectedDocType || !companyName) return [];

    return selectedDocType.companies.filter(
      (c: any) =>
        c.companyName.toLowerCase() === companyName.toLowerCase()
    );
  }, [selectedDocType, companyName]);

  /* ---------------- Merged From Loan ---------------- */

  const mergedFromLoan = useMemo(() => {
    if (!selectedLoan?.parentLoanId) return null;

    return clientLoans.find(
      (l) => l._id === selectedLoan.parentLoanId
    );
  }, [selectedLoan, clientLoans]);

  /* ---------------- Auto Select Logic ---------------- */

  useEffect(() => {
    if (!selectedLoan) return;

    const company =
      selectedLoan.company?.companyName ||
      companies.find((c) => c._id === selectedLoan.company)?.companyName;

    if (selectedLoan.status === "Merged") {

      const contractType = DocTypes.find((d) => d.key === "contract");

      setSelectedDocType(contractType);

      const docs =
        contractType?.companies.filter(
          (c) => c.companyName === company
        ) || [];

      const plusDoc =
        docs.find((d) =>
          d.fileName.toLowerCase().includes("plus")
        ) || docs[0];

      setSelectedDocument(plusDoc);

    } else if (selectedLoan.status === "Paid Off") {

      const payoffType = DocTypes.find((d) => d.key === "payoff");

      setSelectedDocType(payoffType);

      const payoffDoc = payoffType?.companies.find(
        (c) => c.companyName === company
      );

      setSelectedDocument(payoffDoc);

    } else {

      setSelectedDocType(null);
      setSelectedDocument(null);

    }

  }, [selectedLoan, companies]);

  /* ---------------- Reset ---------------- */

  const handleReset = () => {
    setSelectedCompany(null);
    setSelectedLoan(null);
    setSelectedDocType(null);
    setSelectedDocument(null);
    setIsGenerating(false);
  };

  /* ---------------- Generate ---------------- */

  const handleGenerate = async () => {

    if (!selectedLoan || !selectedDocument) {
      toast.error("Please select document");
      return;
    }

    try {

      setIsGenerating(true);

      const calculated = loanStore.calculateLoans(
        selectedLoan,
        clientLoans,
        "mergedDate"
      );

      if (!calculated) {
        toast.error("Loan calculation failed");
        return;
      }

const baseAmount = selectedLoan?.baseAmount || 0;
const previousLoanAmount = selectedLoan?.previousLoanAmount || 0;

const totalPrincipal = baseAmount + previousLoanAmount;

const brokerFee = selectedLoan?.fees?.brokerFee || {};
const otherFees = selectedLoan?.fees || {};

const brokerFeeCalculatedAmount =
  brokerFee?.type === "percentage"
    ? (totalPrincipal * brokerFee?.value) / 100
    : brokerFee?.value || 0;

const payload = {
  loanid: selectedLoan._id,
  document_title: selectedDocument.fileName,
  document_link: selectedDocument.value,

  document_data: {
    client_fullname: client?.fullName || "",
    client_address: client?.address || "",
    client_accidentDate: client?.accidentDate || "",
    company: companyData,

    today_date: moment().format("MMM DD, YYYY"),

    loan_issueDate: calculated?.issueDate?.format("MMM DD, YYYY"),

    loan_baseAmount: moneyFormat(baseAmount),
    loan_previousLoanAmount: moneyFormat(previousLoanAmount),
    loan_totalPrincipal: moneyFormat(totalPrincipal),

    loan_subTotal: moneyFormat(calculated?.subtotal),

    loan_interestType: selectedLoan?.interestType || "",
    loan_monthlyRate: selectedLoan?.monthlyRate || 0,

    loan_interestAmount: moneyFormat(calculated?.interestAmount),

    loan_totalAmount: moneyFormat(calculated?.total),
    loan_paidAmount: moneyFormat(calculated?.paidAmount),
    loan_remainingAmount: moneyFormat(calculated?.remaining),

    loan_dynamicTerm: calculated?.dynamicTerm || 0,

    loan_parentLoanId: selectedLoan?.parentLoanId || "",

    loan_mergedDate: calculated?.mergedDate
      ? calculated.mergedDate.format("MMM DD, YYYY")
      : "",

    loan_fee_type: brokerFee?.type || "",
    loan_fee_value: brokerFee?.value || 0,

    brokerFeeCalculatedAmount: moneyFormat(brokerFeeCalculatedAmount),

    loan_status: selectedLoan?.status || "",

    loan_allFees: otherFees,
  },
};

      const response = await api.post(
        "/templates/document/generate",
        payload,
        { responseType: "blob" }
      );

      const blob = new Blob([response.data], {
        type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      });

      const url = window.URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = url;
      link.download = `${selectedDocument.fileName}_${Date.now()}.docx`;

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success("Document generated successfully");

    } catch (error) {
      toast.error("Failed to generate document");
    } finally {
      setIsGenerating(false);
    }

  };

  /* ---------------- Calculated Loan ---------------- */

  const calculated = useMemo(() => {
    if (!selectedLoan) return null;

    return loanStore.calculateLoans(
      selectedLoan,
      clientLoans,
      "mergedDate"
    );
  }, [selectedLoan, clientLoans]);

  /* ---------------- UI ---------------- */

  return (
    <div className="p-6 space-y-6 bg-gray-50">

      {/* Dropdown Row */}

      <div className="flex gap-4 flex-wrap items-center">

        {/* Company */}

        <Autocomplete
          options={companyOptions}
          sx={{ width: 260 }}
          getOptionLabel={(o: any) => o.companyName}
          value={selectedCompany}
          //@ts-ignore
          onChange={(e, v) => {
            setSelectedCompany(v);
            setSelectedLoan(null);
          }}
          renderInput={(params) => (
            <TextField {...params} label="Select Company" size="small" />
          )}
        />

        {/* Loan */}

        {selectedCompany && (
          <Autocomplete
            options={companyLoans}
            sx={{ width: 350 }}
            getOptionLabel={(loan: any) =>
              `Issue Date: ${moment(loan.issueDate).format("MM/DD/YYYY")} - Base: $${moneyFormat(
                loan.baseAmount
              )} - (${loan.status})`
            }
            value={selectedLoan}
            //@ts-ignore
            onChange={(e, v) => setSelectedLoan(v)}
            renderInput={(params) => (
              <TextField {...params} label="Select Loan" size="small" />
            )}
          />
        )}

        {/* Document Type */}

        {selectedLoan && (
          <Autocomplete
            options={DocTypes}
            sx={{ width: 260 }}
            getOptionLabel={(o: any) => o.label}
            value={selectedDocType}
            //@ts-ignore
            onChange={(e, v) => {
              setSelectedDocType(v);
              setSelectedDocument(null);
            }}
            renderInput={(params) => (
              <TextField {...params} label="Document Type" size="small" />
            )}
          />
        )}

        {/* Document */}

        {companyDocs.length > 0 && (
          <Autocomplete
            options={companyDocs}
            sx={{ width: 320 }}
            getOptionLabel={(o: any) => o.fileName}
            value={selectedDocument}
            //@ts-ignore
            onChange={(e, v) => setSelectedDocument(v)}
            renderInput={(params) => (
              <TextField {...params} label="Document" size="small" />
            )}
          />
        )}

        {/* Buttons */}

        <div className="flex gap-2 font-semibold">

          {selectedDocument && (
            <button
              onClick={handleGenerate}
              disabled={isGenerating}
              className="px-4 py-2 bg-green-700 hover:bg-green-800 text-white text-sm   rounded-md"
            >
              {isGenerating ? "Generating..." : "Generate"}
            </button>
          )}

          <button
            onClick={handleReset}
            className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white text-sm rounded-md"
          >
            Reset
          </button>

        </div>

      </div>

      {/* Loan Preview */}

      {selectedLoan && calculated && (

        <div className="bg-white border rounded-lg p-5 grid grid-cols-4 gap-4">

          <Field label="Client Name" value={client?.fullName} />
          <Field label="Client Address" value={client?.address} />

          <Field label="Company Name" value={companyData.name} />
          <Field label="Company Address" value={companyData.address} />

          <Field label="Issue Date" value={moment(selectedLoan.issueDate).format("MM/DD/YYYY")} />
          <Field label="Loan Status" value={selectedLoan?.status} />

        <Field
            label="Merged From"
            value={
              mergedFromLoan
                ? `Issue: ${moment(mergedFromLoan.issueDate).format("MM/DD/YYYY")} | Base: $${moneyFormat(
                    mergedFromLoan.baseAmount
                  )} | Status: ${mergedFromLoan.status}`
                : "-"
            }
          />

          <Field label="Merged Date" value={calculated?.mergedDate?.format("MM/DD/YYYY") || "-"} />

          <Field label="Base Amount" value={moneyFormat(selectedLoan?.baseAmount)} />
          <Field label="Previous Loan Amount" value={moneyFormat(selectedLoan?.previousLoanAmount)} />

          <Field
            label="Total Principal"
            value={moneyFormat(
              (selectedLoan?.baseAmount || 0) +
                (selectedLoan?.previousLoanAmount || 0)
            )}
          />

          <Field label="Subtotal" value={moneyFormat(calculated?.subtotal)} />
          <Field label="Interest Type" value={selectedLoan?.interestType} />
          <Field label="Monthly Rate" value={selectedLoan?.monthlyRate} />
          <Field label="Interest Amount" value={moneyFormat(calculated?.interestAmount)} />

          <Field label="Loan Total" value={moneyFormat(calculated?.total)} />
          <Field label="Paid Amount" value={moneyFormat(calculated?.paidAmount)} />
          <Field label="Remaining Amount" value={moneyFormat(calculated?.remaining)} />
          <Field label="Loan Term" value={calculated?.dynamicTerm} />

          <Field label="Application Fee" value={formatFee(selectedLoan?.fees?.applicationFee, selectedLoan?.baseAmount)} />
          <Field label="Broker Fee" value={formatFee(selectedLoan?.fees?.brokerFee, selectedLoan?.baseAmount)} />
          <Field label="Administrative Fee" value={formatFee(selectedLoan?.fees?.administrativeFee, selectedLoan?.baseAmount)} />
          <Field label="Attorney Review Fee" value={formatFee(selectedLoan?.fees?.attorneyReviewFee, selectedLoan?.baseAmount)} />
          <Field label="Annual Maintenance Fee" value={formatFee(selectedLoan?.fees?.annualMaintenanceFee, selectedLoan?.baseAmount)} />

        </div>

      )}

    </div>
  );
};

/* ---------------- Field ---------------- */

const Field = ({ label, value }: any) => {

  const displayValue =
    value === undefined || value === null || value === ""
      ? "-"
      : value;

  return (
    <div className="flex flex-col">
      <label className="text-xs text-gray-700 font-semibold mb-1">
        {label}
      </label>

      <input
        disabled
        value={displayValue}
        className="border rounded-md px-3 py-2 bg-gray-100 text-sm"
      />
    </div>
  );
};

export default ClientTemplatesTab;