import api from "../api/axios";

export interface LoanPayload {
  issueDate: string;
  client: string;
  company: string;
  loanTerms: number;
  baseAmount: number;
  fees?: {
    administrativeFee?: { value: number; type: "flat" | "percentage" };
    applicationFee?: { value: number; type: "flat" | "percentage" };
    attorneyReviewFee?: { value: number; type: "flat" | "percentage" };
    brokerFee?: { value: number; type: "flat" | "percentage" };
    annualMaintenanceFee?: { value: number; type: "flat" | "percentage" };
  };
  interestType?: "flat" | "compound";
  monthlyRate?: number;
  totalLoan?: number;
  checkNumber?: string;
  previousLoanAmount?: number;
  subTotal?: number;
  endDate?: string;
  status?: string;
}

export interface Loan extends LoanPayload {
  _id?: string;
}

export const fetchLoans = async () => {
  const { data } = await api.get("/loans");
  return data.data || data;
};
export const activeLoans = async () => {
  const { data } = await api.get("/loans/activeLoans");
  return data.data || data;
};
export const createLoan = async (payload: LoanPayload) => {
  const { data } = await api.post("/loans", payload);
  return data.data || data;
};

export const updateLoan = async (id: string, payload: LoanPayload) => {
  const { data } = await api.put(`/loans/${id}`, payload);
  return data.data || data;
};

export const deleteLoan = async (id: string) => {
  const { data } = await api.delete(`/loans/${id}`);
  return data;
};
export const recoverLoan = async (id: string) => {
  const { data } = await api.put(`/loans/${id}/recover`);
  return data.data || data;
};
