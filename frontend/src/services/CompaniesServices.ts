import api from "../api/axios";
export interface CompanyPayload {
  companyName: string;
  // companyCode: string;
  description?: string;
  phone?: string;
  email?: string;
  website?: string;
  address?: string;
  ActiveCompany?: boolean;

  interestRate?: {
    monthlyRate: number;
    interestType: "compound" | "flat";
  };

  fees?: {
    administrativeFee?: { value: number; type: "flat" | "percentage" };
    applicationFee?: { value: number; type: "flat" | "percentage" };
    attorneyReviewFee?: { value: number; type: "flat" | "percentage" };
    brokerFee?: { value: number; type: "flat" | "percentage" };
    annualMaintenanceFee?: { value: number; type: "flat" | "percentage" };
  };


  loanTerms?: number[];

  freshLoanRules?: {
    enabled: boolean;
    minMonthsBetweenLoans?: number;
    allowOverlappingLoans?: boolean;
    requireFullPayoff?: boolean;
  };

  payoffSettings?: {
    allowEarlyPayoff?: boolean;
    earlyPayoffPenalty?: number;
    earlyPayoffDiscount?: number;
  };

  customFields?: Record<string, unknown>[];
}



export const createCompany = async (company: any) => {
  try {
    const res = await api.post("/companies/store", company);
    return res.data;
  } catch (err: any) {
    if (err.response?.data?.message) {
      throw err;
    }
    throw new Error("Failed to create company");
  }
};

export const fetchCompanies = async (query?: string) => {
  try {
    const url = query
      ? `/companies/allcompanies?search=${encodeURIComponent(query)}`
      : "/companies/allcompanies";
    const res = await api.get(url);
    return res.data.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || "Failed to fetch companies");
  }
};
export const deleteCompany = async (id: string) => {
  const { data: response } = await api.delete(`/companies/delete/${id}`);
  return response;
};