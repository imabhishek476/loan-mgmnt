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
  customFields?: Record<string, unknown>[];
}

export interface Loan {
  _id?: string;
  issueDate: string;
  client: string;
  company: string;
  loanTerms: number;
  baseAmount: number;
  fees?: Record<string, any>;
  interestType?: "flat" | "compound";
  monthlyRate?: number;
  totalLoan?: number;
  checkNumber?: string;
  
}

export const fetchLoans = async () => {
  try {
    const { data } = await api.get("/loans");
    return data.data || data;
  } catch (error: any) {
    throw new Error(error.response?.data?.error || "Failed to fetch loans");
  }
};

export const createLoan = async (payload: LoanPayload) => {
  try {
    const { data } = await api.post("/loans", payload);
    return data;
  } catch (error: any) {
    throw new Error(error.response?.data?.error || "Failed to create loan");
  }
};

export const updateLoan = async (id: string, payload: LoanPayload) => {
  try {
    const { data } = await api.put(`/loans/${id}`, payload);
    return data;
  } catch (error: any) {
    throw new Error(error.response?.data?.error || "Failed to update loan");
  }
};


export const deleteLoan = async (id: string) => {
  try {
    const { data } = await api.delete(`/loans/${id}`);
    return data;
  } catch (error: any) {
    throw new Error(error.response?.data?.error || "Failed to delete loan");
  }
};
