import { useState, useMemo, useEffect } from "react";
import moment from "moment";
import { Autocomplete, TextField } from "@mui/material";
import { DocTypes, formatFee, LOAN_TERMS, moneyFormat } from "../../../utils/constants";
import { toast } from "react-toastify";
import { loanStore } from "../../../store/LoanStore";
import api from "../../../api/axios";
import { DatePicker, LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterMoment } from "@mui/x-date-pickers/AdapterMoment";

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
const [editableClient, setEditableClient] = useState<any>(null);
const [editableCompany, setEditableCompany] = useState<any>(null);
const [editableLoan, setEditableLoan] = useState<any>(null);
const [todayDate, setTodayDate] = useState(moment());
const [calculatedLoan,setCalculatedLoan] = useState<any>(null);
const [reductionAmount, setReductionAmount] = useState<number | null>(null);
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
  useEffect(() => {

    if (companyOptions.length === 1 && !selectedCompany) {
      setSelectedCompany(companyOptions[0]);
    }
    if (companyLoans.length === 1 && !selectedLoan) {
      setSelectedLoan(companyLoans[0]);
    }
    if (companyDocs.length === 1 && !selectedDocument) {
      setSelectedDocument(companyDocs[0]);
    }

  }, [
    companyOptions,
    companyLoans,
    companyDocs,
    selectedCompany,
    selectedLoan,
    selectedDocument
  ]);
  /* ---------------- Merged From Loan ---------------- */

  const mergedFromLoan = useMemo(() => {
    if (!selectedLoan?.parentLoanId) return null;

    return clientLoans.find(
      (l) => l._id === selectedLoan.parentLoanId
    );
  }, [selectedLoan, clientLoans]);

  /* ---------------- Auto Select Logic ---------------- */
useEffect(() => {

  if(!editableLoan) return;
  const result = loanStore.calculateLoans(
    editableLoan,
    clientLoans,
    "mergedDate",
    todayDate
  );

  setCalculatedLoan(result);

},[
  editableLoan?.issueDate,
  todayDate,
 (editableLoan?.baseAmount || 0) + (editableLoan?.previousLoanAmount || 0),
  editableLoan?.previousLoanAmount
]);
useEffect(() => {

  if (!calculatedLoan) return;

  setEditableLoan(prev => ({
    ...prev,
    interestAmount: calculatedLoan.interestAmount,
    total: calculatedLoan.total,
    remaining: calculatedLoan.remaining,
    totalPrincipal :
      (editableLoan?.baseAmount || 0) +
      (editableLoan?.previousLoanAmount || 0)  }));

}, [calculatedLoan]);
  useEffect(() => {
    if (!selectedLoan) return;

    const company =
      selectedLoan.company?.companyName ||
      companies.find((c) => c._id === selectedLoan.company)?.companyName;

    let docKey = "";
    if (
      selectedLoan.status === "Active" ||
      selectedLoan.status === "Partial Payment"
    ) {
      docKey = "contract";
    }
    if (selectedLoan.status === "Merged") {
      docKey = "plus_contract";
    }
      if (selectedLoan.status === "Paid Off") {
        docKey = "payoff";
      }
      const docType = DocTypes.find((d) => d.key === docKey);

      setSelectedDocType(docType);

      const doc = docType?.companies.find(
        (c) => c.companyName === company
      );

  setSelectedDocument(doc || null);

}, [selectedLoan, companies]);
  /* ---------------- Reset ---------------- */
  const handleReset = () => {
    setEditableClient(null);
    setEditableCompany(null);
    setSelectedCompany(null);
    setSelectedLoan(null);
    setSelectedDocType(null);
    setSelectedDocument(null);
    setIsGenerating(false);
    setEditableLoan(null);     
    setCalculatedLoan(null)
  };
const updateFee = (key:string,value:number)=>{
  setEditableLoan({
    ...editableLoan,
    fees:{
      ...editableLoan.fees,
      [key]:{
        ...editableLoan.fees[key],
        value
      }
    }
  })
}
  /* ---------------- Generate ---------------- */

  const handleGenerate = async () => {

    if (!editableLoan || !selectedDocument) {
      toast.error("Please select document");
      return;
    }

    try {

      setIsGenerating(true);
      const calculated: any = await loanStore.calculateLoanAmounts({
        loan: editableLoan,
        date: todayDate,
        calculate: true
      });
      const allTenureData = LOAN_TERMS.map((term: number) => {

        const termLoan = JSON.parse(JSON.stringify(editableLoan));

        const newIssueDate = moment(editableLoan.issueDate, "MM-DD-YYYY")
          .subtract(term, "months")
          .format("MM-DD-YYYY");

        termLoan.issueDate = newIssueDate;
        termLoan.loanTerms = term;

        const termCalculation = loanStore.calculateLoans(
          termLoan,
          clientLoans,
          "mergedDate",
          todayDate
        );

        return {
          tenure: term,
          interestAmount: moneyFormat(termCalculation?.interestAmount || 0),
          totalAmount: moneyFormat(termCalculation?.total || 0)
        };

      });
      const tenureMap: any = {};

      allTenureData.forEach((t: any) => {
        tenureMap[`loan_${t.tenure}_interest`] = t.interestAmount;
        tenureMap[`loan_${t.tenure}_total`] = t.totalAmount;
      });
      if (!calculated) {
        toast.error("Loan calculation failed");
        return;
      }
      const totalPrincipal = editableLoan?.totalPrincipal || 0;
      const brokerFee = editableLoan?.fees?.brokerFee || {};
      const final_total = editableLoan?.total || calculatedLoan.total || 0;

      const payload = {
        loanid: editableLoan?._id ?? "-",
        document_title: selectedDocument?.fileName ?? "-",
        document_link: selectedDocument?.value ?? "-",

        document_data: {
          client_fullname: editableClient?.fullName ?? "-",
          client_address: editableClient?.address ?? "-",
          client_accidentDate: editableClient?.accidentDate
            ? moment(editableClient.accidentDate).format("MMM DD, YYYY")
            : "-",
          client_attorney_name: editableClient?.attorneyName ?? "-",
          company: {
            name: editableCompany?.name ?? "-",
            address: editableCompany?.address ?? "-",
            email: companyData?.email ?? "-",
            phone: companyData?.phone ?? "-",
          },
          reduction_amount: reductionAmount ?? "-",
          after_reduction_amount: reductionAmount != null ? final_total - reductionAmount : final_total,
          selected_date: todayDate ? todayDate.format("MMM DD, YYYY") : "-",
          loan_issueDate: calculated?.issueDate
            ? calculated.issueDate.format("MMM DD, YYYY")
            : "-",
          loan_baseAmount: moneyFormat(
            (editableLoan?.baseAmount ?? 0) +
            (editableLoan?.previousLoanAmount ?? 0)
          ),
          loan_previousLoanAmount: moneyFormat(editableLoan?.previousLoanAmount ?? 0),
          loan_totalPrincipal: moneyFormat(totalPrincipal ?? 0),
          loan_subTotal: moneyFormat(editableLoan?.subTotal ?? 0),
          loan_interestType: editableLoan?.interestType ?? "-",
          loan_monthlyRate: editableLoan?.monthlyRate ?? "-",
          loan_interestAmount: moneyFormat(editableLoan?.interestAmount ?? 0),
          loan_totalAmount: moneyFormat(editableLoan?.total ?? 0),
          loan_paidAmount: moneyFormat(editableLoan?.paidAmount ?? 0),
          loan_remainingAmount: moneyFormat(editableLoan?.remaining ?? 0),
          loan_dynamicTerm: calculated?.dynamicTerm ?? "-",
          loan_parentLoanId: editableLoan?.parentLoanId ?? "-",
          loan_mergedDate: calculated?.mergedDate
            ? calculated.mergedDate.format("MMM DD, YYYY")
            : "-",
          loan_fee_type: brokerFee?.type ?? "-",
          loan_fee_value: brokerFee?.value ?? "-",
          loan_status: editableLoan?.status ?? "-",
          loan_allTenure: allTenureData ?? "-",
          ...tenureMap,
          application_fee: calculated?.feeBreakdown?.applicationFee ?? "-",
          broker_fee: calculated?.feeBreakdown?.brokerFee ?? "-",
          administrative_fee: calculated?.feeBreakdown?.administrativeFee ?? "-",
          attorney_review_fee: calculated?.feeBreakdown?.attorneyReviewFee ?? "-",
          annual_maintenance_fee: calculated?.feeBreakdown?.annualMaintenanceFee ?? "-",
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
      } catch (error:any) {
    console.error("Generate error:", error);
    console.error("Response:", error?.response);
    toast.error(
      error?.response?.data?.message || "Failed to generate document"
    );
  }finally {
      setIsGenerating(false);
    }

  };

  /* ---------------- Calculated Loan ---------------- */
  useEffect(() => {
    if (!selectedLoan) return;
    setEditableLoan({
      ...selectedLoan
    });
    setEditableClient({
      fullName: client?.fullName || "",
      address: client?.address || "",
      accidentDate: client?.accidentDate || "",
      attorneyName: client?.attorneyId?.fullName || "",
    });

    const company =
      selectedLoan.company?._id || selectedLoan.company;

    const companyObj = companies.find((c:any)=>c._id === company);

    setEditableCompany({
      name: companyObj?.companyName || "",
      address: `${companyObj?.address || ""} ${companyObj?.city || ""}`.trim(),
      phone: companyObj?.phone || "",
      email: companyObj?.email || "",
    });

  }, [selectedLoan, client, companies]);
  /* ---------------- UI ---------------- */
  const filteredDocTypes = useMemo(() => {
    if (!selectedLoan) return DocTypes;

    if (selectedLoan.status === "Merged") {
      // show only Plus Contract, Payoff, Reduction
      return DocTypes.filter((d) =>
        ["plus_contract", "payoff", "reduction"].includes(d.key)
      );
    }

    if (
      selectedLoan.status === "Active" ||
      selectedLoan.status === "Partial Payment"
    ) {
      // show only normal Contract + Reduction
      return DocTypes.filter((d) =>
        ["contract", "reduction"].includes(d.key)
      );
    }

    if (selectedLoan.status === "Paid Off") {
      // show only payoff
      return DocTypes.filter((d) => d.key === "payoff");
    }

    return DocTypes;
  }, [selectedLoan]);
  useEffect(() => {
  if (filteredDocTypes.length === 1) {
    setSelectedDocType(filteredDocTypes[0]);
    setReductionAmount(null);
  }
}, [filteredDocTypes]);
  return (
    <div className="p-2 space-y-6 bg-gray-50">

      {/* Dropdown Row */}

      <div className="flex gap-2 flex-wrap items-center">

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
              ` $${moneyFormat(
                loan.baseAmount
              )} - ${moment(loan.issueDate).format("MM/DD/YYYY")} - (${loan.status})`
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
            options={filteredDocTypes}
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

        {companyDocs.length > 1 && (
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
    {editableLoan && selectedLoan && calculatedLoan && (

    <div className="bg-white rounded-md p-2 grid grid-cols-1 xl:grid-cols-2 gap-2 mt-0">
    <div className="flex flex-col gap-2">
      {/* CLIENT DETAILS */}
      <div className="p-2 pb-0">
        <h3 className="font-semibold text-gray-800 mb-4">Client Details</h3>

        <div className="grid grid-cols-2 gap-2">

          <Field
            label="Client Name"
            value={editableClient?.fullName}
            onChange={(v:any)=>setEditableClient({...editableClient,fullName:v})}
          />

          <Field
            label="Client Address"
            value={editableClient?.address}
            onChange={(v:any)=>setEditableClient({...editableClient,address:v})}
          />
          <div className="flex flex-col">
          <label className="text-xs text-gray-700 font-semibold mb-1">
            Accident Date
          </label>

          <LocalizationProvider dateAdapter={AdapterMoment}>
            <DatePicker
              value={
                editableClient?.accidentDate
                  ? moment(editableClient.accidentDate)
                  : null
              }
              onChange={(date: any) =>
                setEditableClient({
                  ...editableClient,
                  accidentDate: date ? moment(date) : null
                })
              }
              slotProps={{
                textField: {
                  size: "small",
                  fullWidth: true
                }
              }}
            />
          </LocalizationProvider>
        </div>

          <Field
            label="Attorney Name"
            value={editableClient?.attorneyName}
            onChange={(v:any)=>setEditableClient({...editableClient, attorneyName:v})}
          />

        </div>
      </div>


      {/* COMPANY DETAILS */}
      <div className="p-2 pt-0">
        <h3 className="font-semibold text-gray-800 mb-2">Company Details</h3>

        <div className="grid grid-cols-2 gap-2">

          <Field
            label="Company Name"
            value={editableCompany?.name}
            onChange={(v:any)=>setEditableCompany({...editableCompany,name:v})}
          />

          <Field
            label="Company Address"
            value={editableCompany?.address}
            onChange={(v:any)=>setEditableCompany({...editableCompany,address:v})}
          />
            <Field
            label="Telephone No."
            value={editableCompany?.phone}
            onChange={(v:any)=>setEditableCompany({...editableCompany,phone:v})}
          />
           <Field
            label="Company Email"
            value={editableCompany?.email}
            onChange={(v:any)=>setEditableCompany({...editableCompany,email:v})}
          />
        </div>
      </div>
      </div>

      <div className="border-l p-4">
            <div className="flex items-center justify-between mb-4">

            <h3 className="font-semibold text-gray-800 text-lg">
              Loan Details
            </h3>

            <div className="flex gap-4 text-sm">

              <span className="bg-gray-200 px-3 py-1 rounded-md  font-semibold text-gray-700">
              Loan Term: {calculatedLoan?.dynamicTerm} Months
              </span>

              <span className="bg-green-700 text-white px-3 py-1 rounded-md  font-semibold">
                Total: $ {moneyFormat( editableLoan?.total || calculatedLoan.total || 0)}
              </span>

            </div>

          </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {(selectedDocType?.key === "payoff" || selectedDocType?.key === "reduction") && (
              <div className="flex flex-col">
                <label className="text-xs font-semibold text-gray-700 mb-1">
                  Select Date
                </label>

                <LocalizationProvider dateAdapter={AdapterMoment}>
                  <DatePicker
                    value={todayDate}
                    onChange={(date: any) => setTodayDate(date)}
                    slotProps={{ textField: { size: "small" } }}
                  />
                </LocalizationProvider>
              </div>
            )}
            {selectedDocType?.key === "reduction" && (
              <Field
                label="Reduction Amount"
                type="number"
                value={reductionAmount}
                onChange={(v:any)=>setReductionAmount(Number(v))}
              />
            )}
          <div className="flex flex-col">
            <label className="text-xs font-semibold text-gray-700 mb-1">
              Issue Date
            </label>

            <LocalizationProvider dateAdapter={AdapterMoment}>
              <DatePicker
                value={editableLoan?.issueDate ? moment(editableLoan.issueDate) : null}
                onChange={(date:any)=>setEditableLoan({
                  ...editableLoan,
                  issueDate: date ? moment(date).format("MM-DD-YYYY") : ""
                })}
                slotProps={{ textField:{size:"small"} }}
              />
            </LocalizationProvider>
      </div>

      <Field
        label="Loan Status"
        value={editableLoan?.status}
        onChange={(v:any)=>setEditableLoan({...editableLoan,status:v})}
      />

      <Field
        label="Base Amount"
         type="number"
        value={editableLoan?.baseAmount}
        onChange={(v:any)=>setEditableLoan({...editableLoan,baseAmount:Number(v)})}
      />

      <Field
        label="Previous Loan Amount"
        type="number"
        value={editableLoan?.previousLoanAmount}
        onChange={(v:any)=>setEditableLoan({...editableLoan,previousLoanAmount:Number(v)})}
      />

      <Field
        label="Total Principal"
        type="number"
        value={editableLoan?.totalPrincipal}
        onChange={(v:any)=>
          setEditableLoan({
            ...editableLoan,
            totalPrincipal:Number(v)
          })
        }
      />

        <Field
            label="Merged From"
            value={
              mergedFromLoan
                ? `Issue: ${moment(mergedFromLoan.issueDate).format("MM/DD/YYYY")} | Base: $${moneyFormat(mergedFromLoan.baseAmount)}`
                : "-"
            }
          />

      <Field
        label="Merged Date"
        value={calculatedLoan?.mergedDate?.format("MM/DD/YYYY") || "-"}
      />

      <Field
        label="Subtotal"
        type="number"
        value={editableLoan?.subtotal || calculatedLoan?.subtotal}
        onChange={(v:any)=>setEditableLoan({...editableLoan,subtotal:v})}
      />
      {/* <Field
        label="Interest Type"
        type="number"
        value={editableLoan?.interestType}
        onChange={(v:any)=>setEditableLoan({...editableLoan,interestType:v})}
      /> */}

      <Field
        label="Monthly Rate"
        type="number"
        value={editableLoan?.monthlyRate}
        onChange={(v:any)=>setEditableLoan({...editableLoan,monthlyRate:Number(v)})}
      />

     <Field
        label="Interest Amount"
        type="number"
        value={editableLoan?.interestAmount}
        onChange={(v:any)=>
          setEditableLoan({
            ...editableLoan,
            interestAmount:Number(v)
          })
        }
      />

      <Field
        label="Loan Total"
        type="number"
        value={editableLoan?.total}
        onChange={(v:any)=>
          setEditableLoan({
            ...editableLoan,
            total:Number(v)
          })
        }
      />
          <Field
        label="Paid Amount"
        type="number"
        value={editableLoan?.paidAmount}
        onChange={(v:any)=>
          setEditableLoan({
            ...editableLoan,
            paidAmount: Number(v)
          })
        }
      />

        <Field
        label="Remaining Amount"
        type="number"
        value={editableLoan?.remaining}
        onChange={(v:any)=>
          setEditableLoan({
            ...editableLoan,
            remaining:Number(v)
          })
        }
      />
       <Field
        type="number"
        label="Application Fee"
        value={editableLoan?.fees?.applicationFee?.value}
        onChange={(v:any)=>updateFee("applicationFee",(v))}
        preview={formatFee(
          editableLoan?.fees?.applicationFee,
          (editableLoan?.baseAmount || 0) + (editableLoan?.previousLoanAmount || 0)
        )}
      />
      <Field
        type="number"
        label="Broker Fee"
        value={editableLoan?.fees?.brokerFee?.value}
        onChange={(v:any)=>updateFee("brokerFee",(v))}
        preview={formatFee(
          editableLoan?.fees?.brokerFee,
          (editableLoan?.baseAmount || 0) + (editableLoan?.previousLoanAmount || 0)
        )}
      />
      <Field
        type="number"
        label="Administrative Fee"
        value={editableLoan?.fees?.administrativeFee?.value}
        onChange={(v:any)=>updateFee("administrativeFee",(v))}
        preview={formatFee(
          editableLoan?.fees?.administrativeFee,
          (editableLoan?.baseAmount || 0) + (editableLoan?.previousLoanAmount || 0)
        )}
        />
      <Field
        type="number"
        label="Attorney Review Fee"
        value={editableLoan?.fees?.attorneyReviewFee?.value}
        onChange={(v:any)=>updateFee("attorneyReviewFee",(v))}
        preview={formatFee(
          editableLoan?.fees?.attorneyReviewFee,
          (editableLoan?.baseAmount || 0) + (editableLoan?.previousLoanAmount || 0)
        )}
      />
    <Field
        type="number"
        label="Annual Maintenance Fee"
        value={editableLoan?.fees?.annualMaintenanceFee?.value}
        onChange={(v:any)=>updateFee("annualMaintenanceFee",(v))}
        preview={formatFee(
          editableLoan?.fees?.annualMaintenanceFee,
          (editableLoan?.baseAmount || 0) + (editableLoan?.previousLoanAmount || 0)
        )}
      />
    </div>
  </div>

        </div>

      )}

    </div>
  );
};

/* ---------------- Field ---------------- */

const Field = ({ label, value, onChange, type = "text", preview }: any) => {

  const handleChange = (e:any) => {

    let v = e.target.value;
    if(type === "number"){
      if(v === ""){
        onChange("");
        return;
      }
      if(!/^\d*\.?\d*$/.test(v)) return;
      onChange(v);
      return;
    }
    onChange(v);
  };

  return (
    <div className="flex flex-col">
      <label className="text-xs text-gray-700 font-semibold mb-1">
        {label}
      </label>

      <input
        type="text"
        value={type === "number" && value !== "" && value !== null
          ? !isNaN(Number(value))
            ? Number(value).toFixed(2)
            : ""
          : value ?? ""}
        onChange={handleChange}
        className="border rounded-md px-3 py-2 bg-white text-sm"
      />
      {preview && (
        <span className="text-xs text-gray-500 mt-1">
          {preview}
        </span>
      )}
    </div>
  );
};

export default ClientTemplatesTab;