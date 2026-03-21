import { useState, useMemo, useEffect } from "react";
import moment from "moment";
import { Autocomplete, TextField } from "@mui/material";
import { DocTypes, formatFee, formatUSPhone, getAllowedTerms, LOAN_TERMS, moneyFormat } from "../../../utils/constants";
import { toast } from "react-toastify";
import { loanStore } from "../../../store/LoanStore";
import api from "../../../api/axios";
import { DatePicker, LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterMoment } from "@mui/x-date-pickers/AdapterMoment";
import { convertToNumber, formatPhone, usd } from "../../../utils/helpers";
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
  const [runningTenureEndDate, setRunningTenureEndDate] = useState<moment.Moment | null>(null);

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
      (c: any) =>c.companyName?.toLowerCase().includes(companyName?.toLowerCase())
    );
  }, [selectedDocType, companyName]);
  useEffect(() => {

    if (companyOptions.length === 1 && !selectedCompany) {
      setSelectedCompany(companyOptions[0]);
    }
    if (companyLoans.length === 1 && !selectedLoan) {
      setSelectedLoan(companyLoans[0]);
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
  Number(editableLoan?.baseAmount || 0) +
  Number(editableLoan?.previousLoanAmount || 0),
  Number(editableLoan?.previousLoanAmount)
]);
useEffect(() => {

  if (!calculatedLoan) return;

  setEditableLoan(prev => ({
    ...prev,
    interestAmount: Number(calculatedLoan.interestAmount).toFixed(2),
    total: Number(calculatedLoan.total).toFixed(2),
    remaining: Number(calculatedLoan.remaining).toFixed(2),
    previousLoanAmount: Number(editableLoan?.previousLoanAmount || 0).toFixed(2),
    totalPrincipal: (
      Number(editableLoan?.baseAmount || 0) +
      Number(editableLoan?.previousLoanAmount || 0)
    ).toFixed(2)

  }));
const endDate = calculatedLoan.issueDate
  .clone()
  .add(calculatedLoan.dynamicTerm * 30, "days");

setRunningTenureEndDate(endDate);
}, [calculatedLoan]);
  useEffect(() => {
    if (!selectedLoan) return;

    const company =
      selectedLoan.company?.companyName ||
      companies.find((c) => c._id === selectedLoan.company)?.companyName;

    let docKey = "";
    const prevAmount = Number(selectedLoan?.previousLoanAmount || 0);
      if (selectedLoan.status === "Paid Off") {
        docKey = "payoff";
      } else {
        docKey = prevAmount > 0 ? "plus_contract" : "contract";
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
const updateFee = (key:string,value:any)=>{
  const numericValue = Number(value) || 0;
  setEditableLoan({
    ...editableLoan,
    fees:{
      ...editableLoan.fees,
      [key]:{
        ...editableLoan.fees[key],
        value: numericValue
      }
    }
  })
}
  /* ---------------- Generate ---------------- */
const mergedData = useMemo(() => {

  if (!selectedLoan) return null;

  return clientLoans.find(
    (l:any) => l.parentLoanId === selectedLoan._id
  );

}, [selectedLoan, clientLoans]);
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
        prevLoanTotal: editableLoan?.previousLoanAmount || 0,
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
        tenureMap[`loan_${t.tenure}_interest`] = usd(t.interestAmount);
        tenureMap[`loan_${t.tenure}_total`] = usd(t.totalAmount);
      });
      if (!calculated) {
        toast.error("Loan calculation failed");
        return;
      }
      const totalPrincipal = editableLoan?.totalPrincipal || 0;
      const brokerFee = editableLoan?.fees?.brokerFee || {};
      const final_total = editableLoan?.total || calculatedLoan.total || 0;
      const reductionNum = convertToNumber(reductionAmount);
      const finalTotalNum = convertToNumber(final_total);
     

      const payload = {
        loanid: editableLoan?._id ?? "-",
        document_title: selectedDocument?.fileName ?? "-",
        document_link: selectedDocument?.value ?? "-",

        document_data: {
          client_fullname: editableClient?.fullName ?? "-",
          client_address: editableClient?.address ?? "-",
          client_ssn: editableClient?.ssn ?? "-",
          client_phone: formatPhone(editableClient?.phone),
          client_accidentDate: editableClient?.accidentDate
            ? moment(editableClient.accidentDate).format("MM/DD/YYYY")
            : "-",
          client_attorney_name: editableClient?.attorneyName ?? "-",
          client_attorney_firm_name: editableClient?.attorneyFirmName ?? "-",
          company: {
            name: editableCompany?.name ?? "-",
            address: editableCompany?.address ?? "-",
            email: companyData?.email ?? "-",
            phone: formatPhone(companyData?.phone ?? "-"),
          },
          today_date: moment().format("MM/DD/YYYY"),
          loan_end_date: runningTenureEndDate
            ? runningTenureEndDate.format("MM/DD/YYYY")
            : "-",
          reduction_amount:
            reductionAmount != null ? usd(reductionNum) : usd(0),
          after_reduction_amount:
            reductionAmount != null
              ? usd(finalTotalNum - reductionNum)
              : usd(finalTotalNum),
          selected_date: todayDate
            ? todayDate.format("MM/DD/YYYY")
            : "-",
          loan_issueDate: calculated?.issueDate
            ? calculated.issueDate.format("MM/DD/YYYY")
            : "-",
          loan_baseAmount: usd(
            convertToNumber(editableLoan?.baseAmount) +
            convertToNumber(editableLoan?.previousLoanAmount)
          ),
          loan_previousLoanAmount: usd(editableLoan?.previousLoanAmount),
          loan_totalPrincipal: usd(totalPrincipal),
          loan_subTotal: usd(editableLoan?.subTotal),
          loan_interestAmount: usd(editableLoan?.interestAmount),
          loan_totalAmount: usd(editableLoan?.total),
          loan_paidAmount: usd(editableLoan?.paidAmount),
          loan_remainingAmount: usd(editableLoan?.remaining),
          loan_monthlyRate: editableLoan?.monthlyRate ?? "-",
          loan_dynamicTerm: calculated?.dynamicTerm ?? "-",
          loan_parentLoanId: editableLoan?.parentLoanId ?? "-",
          loan_mergedDate: calculated?.mergedDate
            ? calculated.mergedDate.format("MM/DD/YYYY")
            : "-",
          loan_fee_type: brokerFee?.type ?? "-",
          loan_fee_value: usd(brokerFee?.value) ?? "-",
          loan_status: editableLoan?.status ?? "-",
          loan_allTenure: allTenureData ?? "-",
          ...tenureMap,
          application_fee: usd(calculated?.feeBreakdown?.applicationFee),
          broker_fee: usd(calculated?.feeBreakdown?.brokerFee),
          administrative_fee: usd(calculated?.feeBreakdown?.administrativeFee),
          attorney_review_fee: usd(calculated?.feeBreakdown?.attorneyReviewFee),
          annual_maintenance_fee: usd(
            calculated?.feeBreakdown?.annualMaintenanceFee
          ),
          merged_loan_issueDate:
            mergedData?.issueDate
              ? moment(mergedData.issueDate).format("MM/DD/YYYY")
              : "-",
          merged_loan_baseAmount:
            mergedData?.baseAmount
              ? usd(mergedData.baseAmount)
              : "-",
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
      phone: client?.phone || "",
      accidentDate: client?.accidentDate || "",
      attorneyName: client?.attorneyId?.fullName || "",
      ssn: client?.ssn || "",
      attorneyFirmName: client?.attorneyId?.firmName || "",
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

    const prevAmount = Number(selectedLoan?.previousLoanAmount || 0);
      const contractType = prevAmount > 0 ? "plus_contract" : "contract";

    if (
      selectedLoan.status === "Active" ||
      selectedLoan.status === "Partial Payment" ||
      selectedLoan.status === "Merged"
    ) {

      return DocTypes.filter((d) =>
        [contractType, "payoff", "reduction"].includes(d.key)
      );
    }

    if (selectedLoan.status === "Paid Off") {
      return DocTypes.filter((d) =>
    [contractType, "payoff", "reduction"].includes(d.key)
        );
    }

    return DocTypes;
  }, [selectedLoan]);
  useEffect(() => {
  if (filteredDocTypes.length === 1) {
    setSelectedDocType(filteredDocTypes[0]);
    setReductionAmount(null);
  }
}, [filteredDocTypes]);
useEffect(() => {
  if (companyDocs.length === 1) {
    setSelectedDocument(companyDocs[0]);
  }
}, [companyDocs]);
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

 
            <button
              onClick={handleGenerate}
              disabled={isGenerating}
              className="px-4 py-2 bg-green-700 hover:bg-green-800 text-white text-sm   rounded-md"
            >
              {isGenerating ? "Generating..." : "Generate"}
            </button>
          

          <button
            onClick={handleReset}
            className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white text-sm rounded-md"
          >
            Reset
          </button>

        </div>
      </div>
    {editableLoan && selectedLoan && calculatedLoan && (

    <div className="bg-white rounded-md p-0 grid grid-cols-1 xl:grid-cols-2 gap-2 ">
    <div className="flex flex-col gap-2">
      {/* CLIENT DETAILS */}
      <div className="p-4 border rounded-lg shadow-sm bg-white ">
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
          <Field
            label="Client SSN"
            value={editableClient?.ssn}
            onChange={(v:any)=>setEditableClient({...editableClient,ssn:v})}
          />
           <Field
            label="Client Phone"
            value={editableClient?.phone}
            onChange={(v:any)=>setEditableClient({...editableClient,phone: formatUSPhone(v), })}
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
         <Field
            label="Attorney Firm"
            value={editableClient?.attorneyFirmName}
            onChange={(v:any)=>setEditableClient({
              ...editableClient,
              attorneyFirmName: v
            })}
          />
        </div>
      </div>


      {/* COMPANY DETAILS */}
      <div className="p-4 border rounded-lg shadow-sm bg-white">
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
            onChange={(v:any)=>setEditableCompany({...editableCompany,phone:formatUSPhone(v)})}
          />
           <Field
            label="Company Email"
            value={editableCompany?.email}
            onChange={(v:any)=>setEditableCompany({...editableCompany,email:v})}
          />
        </div>
      </div>
      </div>

    <div className="flex flex-col gap-2">
   {(selectedDocType?.key === "payoff" || selectedDocType?.key === "reduction") && (
      <div className="border rounded-lg shadow-sm bg-white p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          
          {/* Select Date */}
          <div className="flex flex-col">
            <label className="text-sm font-semibold text-gray-700 mb-1">
              Select Date
            </label>

            <LocalizationProvider dateAdapter={AdapterMoment}>
              <DatePicker
                value={todayDate}
                onChange={(date: any) => setTodayDate(date)}
                slotProps={{
                  textField: {
                    size: "small",
                    fullWidth: true
                  }
                }}
              />
            </LocalizationProvider>
          </div>
      {selectedDocType?.key === "reduction" && (
        <div className="flex flex-col">
          <label className="text-sm font-semibold text-gray-700 mb-1">
            Reduction Amount
          </label>
            <input
            type="text"
            value={reductionAmount ?? ""}
            onChange={(e) => {
              const v = e.target.value;
              if (v === "") {
                setReductionAmount(null);
                return;
              }
              const num = (parseInt(v.replace(/\D/g, ""), 10) / 100).toFixed(2);
              setReductionAmount(Number(num));
            }}
            className="border rounded-md px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-green-600 outline-none"
            placeholder="Enter amount"
          />
        </div>
      )}

    </div>
  </div>
)}
      <div className="border rounded-lg shadow-md bg-gray-50 p-4">
            <div className="flex items-center justify-between mb-4">

            <h3 className="font-semibold text-gray-800 text-lg">
              Loan Details
            </h3>

            <div className="flex gap-4 text-sm ">

              <span className="bg-gray-200 px-3 py-1 rounded-md  font-semibold text-gray-700">
              Loan Term: {calculatedLoan?.dynamicTerm} Months ({runningTenureEndDate?.format("MMM DD, YYYY")})
              </span>

              <span className="bg-green-700 text-white px-3 py-1 rounded-md  font-semibold">
                Total: $ {moneyFormat( editableLoan?.total || calculatedLoan.total || 0)}
              </span>

            </div>

          </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 ">
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
        label="Base Amount"
         type="number"
        value={editableLoan?.baseAmount}
        onChange={(v:any)=>setEditableLoan({...editableLoan,baseAmount:v})}
      />

      <Field
        label="Monthly Rate"
        type="number"
        value={editableLoan?.monthlyRate}
        onChange={(v:any)=>setEditableLoan({...editableLoan,monthlyRate:v})}
      />

      <Field
        label="Interest Amount"
        type="number"
        value={editableLoan?.interestAmount}
        onChange={(v:any)=>
          setEditableLoan({
            ...editableLoan,
            interestAmount:v
          })
        }
      />
       <Field
        label="Subtotal"
        type="number"
        value={editableLoan?.subtotal || calculatedLoan?.subtotal}
        onChange={(v:any)=>setEditableLoan({...editableLoan,subtotal:v})}
      />
      <Field
        label="Previous Loan Amount"
        type="number"
        value={editableLoan?.previousLoanAmount}
        onChange={(v:any)=>setEditableLoan({...editableLoan,previousLoanAmount:v})}
      />
       <Field
        label="Total Principal"
        type="number"
        value={editableLoan?.totalPrincipal}
        onChange={(v:any)=>
          setEditableLoan({
            ...editableLoan,
            totalPrincipal:v
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
            total:v
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
            paidAmount: v
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
            remaining:v
          })
        }
      />
      <Field
        label="Loan Status"
        type="text"
        value={editableLoan?.status}
        onChange={(v:any)=>setEditableLoan({...editableLoan,status:v})}
      />
      {mergedFromLoan && (
        <div className="col-span-full border rounded-lg shadow-md bg-gray-50 p-4 mt-1">
          <h3 className="text-sm font-semibold text-gray-800 mb-3">
            Merged Loan Details
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field
              label="Merged From"
              value={`Issue: ${moment(mergedFromLoan.issueDate).format("MM/DD/YYYY")} | Base: $${moneyFormat(mergedFromLoan.baseAmount)}`}
            />

            {calculatedLoan?.mergedDate && (
              <Field
                label="Merged Date"
                value={calculatedLoan.mergedDate.format("MM/DD/YYYY")}
              />
            )}
          </div>
        </div>
      )}
      {/* <Field
        label="Interest Type"
        type="number"
        value={editableLoan?.interestType}
        onChange={(v:any)=>setEditableLoan({...editableLoan,interestType:v})}
      /> */}
  <div className="col-span-full border rounded-lg shadow-sm bg-white p-4 mt-1">
    <h3 className="text-sm font-semibold text-gray-800 mb-3">
      Additional Fees
    </h3>

    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
      
      <Field
        type="number"
        label="Application Fee"
        value={editableLoan?.fees?.applicationFee?.value}
        onChange={(v:any)=>updateFee("applicationFee",v)}
        preview={formatFee(
          editableLoan?.fees?.applicationFee,
          Number(editableLoan?.baseAmount || 0) +
          Number(editableLoan?.previousLoanAmount || 0)
        )}
      />
      <Field
        type="number"
        label="Broker Fee"
        value={editableLoan?.fees?.brokerFee?.value}
        onChange={(v:any)=>updateFee("brokerFee",v)}
        preview={formatFee(
          editableLoan?.fees?.brokerFee,
         Number (editableLoan?.baseAmount || 0) +
          Number(editableLoan?.previousLoanAmount || 0)
        )}
      />
      <Field
        type="number"
        label="Administrative Fee"
        value={editableLoan?.fees?.administrativeFee?.value}
        onChange={(v:any)=>updateFee("administrativeFee",v)}
        preview={formatFee(
          editableLoan?.fees?.administrativeFee,
          Number(editableLoan?.baseAmount || 0) +
          Number(editableLoan?.previousLoanAmount || 0)
        )}
      />
      <Field
        type="number"
        label="Attorney Review Fee"
        value={editableLoan?.fees?.attorneyReviewFee?.value}
        onChange={(v:any)=>updateFee("attorneyReviewFee",v)}
        preview={formatFee(
          editableLoan?.fees?.attorneyReviewFee,
          Number(editableLoan?.baseAmount || 0) +
          Number(editableLoan?.previousLoanAmount || 0)
        )}
      />
      <Field
        type="number"
        label="Annual Maintenance Fee"
        value={editableLoan?.fees?.annualMaintenanceFee?.value}
        onChange={(v:any)=>updateFee("annualMaintenanceFee",v)}
        preview={formatFee(
          editableLoan?.fees?.annualMaintenanceFee,
          Number(editableLoan?.baseAmount || 0) +
          Number(editableLoan?.previousLoanAmount || 0)
        )}
      />
    </div>
    </div>
  </div>
    </div>
  </div>

        </div>

      )}

    </div>
  );
};

/* ---------------- Field ---------------- */

const Field = ({ label, value, onChange, type = "text", preview, readOnly = false ,formatMoney = false }: any) => {
const handleChange = (e:any) => {
  if (readOnly) return;

  let v = e.target.value;

  // ✅ remove spaces (fix your main bug)
  v = v.replace(/\s/g, "");

  if (type === "number") {

    if (v === "") {
      onChange("");
      return;
    }

    // ✅ ONLY apply /100 logic when needed
    if (formatMoney) {
      const num = (parseInt(v.replace(/\D/g, ""), 10) / 100).toFixed(2);
      onChange(num);
      return;
    }

    // ✅ NORMAL number (like baseAmount)
    if (!/^\d*\.?\d*$/.test(v)) return;

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
        value={value ?? ""}
        readOnly={readOnly}
        onChange={handleChange}
        className={`border rounded-md px-3 py-2 text-sm ${
          readOnly ? "bg-gray-100 cursor-not-allowed" : "bg-white"
        }`}
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