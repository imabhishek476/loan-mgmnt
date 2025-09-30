import api from "../api/axios";
export interface CompanyPayload {
  companyName: string;
  companyCode: string;
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
    administrativeFee?: number;
    applicationFee?: number;
    attorneyReviewFee?: number;
    brokerFee?: number;
    annualMaintenanceFee?: number;
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
    gracePeriodDays?: number;
    lateFeeAmount?: number;
    lateFeeGraceDays?: number;
  };

  customFields?: Record<string, unknown>[];
}



export const createCompany = async (company: CompanyPayload) => {
  try {
    const res = await api.post("/companies/store", company);
    return res.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.error || "Failed to create company");
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