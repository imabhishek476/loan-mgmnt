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
export const getLoansSearch = async (params: any) => {
  const response = await api.get("/loans/search", { params });
  return response.data;
};
export const activeLoans = async (clientId?: string) => {
  const { data } = await api.get("/loans/activeLoans", {
    params: { clientId },
  });
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

export const deactivateLoan = async (id: string) => {
  const { data } = await api.delete(`/loans/${id}`);
  return data;
};
export const recoverLoan = async (id: string) => {
  const { data } = await api.put(`/loans/${id}/recover`);
  return data.data || data;
};
export const fetchLoanById = async (id: string) => {
  const { data } = await api.get(`/loans/edit/${id}`);
  return data.data || data;
};
export const deleteLoan = async (id: string) => {
  const { data } = await api.delete(`/loans/delete/${id}`);
  return data;
};
export const updateLoanStatus = async (id: string, status: string) => {
  console.log(status,'status');
  const { data } = await api.put(`/loans/${id}/status`, { status });
  return data.data || data;
};
export const getLoanProfitByLoanId = async (id: string) => {
  const { data } = await api.get(`/loans/${id}/profit`);
  return data.data || {};
};