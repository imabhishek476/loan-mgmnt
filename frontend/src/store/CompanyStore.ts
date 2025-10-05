// stores/CompanyStore.ts
import { makeAutoObservable, runInAction } from "mobx";
import { createCompany, fetchCompanies } from "../services/CompaniesServices";
import api from "../api/axios";

export interface Company {
  _id?: string;
  companyName: string;
  companyCode: string;
  description?: string;
  phone?: string;
  email?: string;
  website?: string;
  ActiveCompany: boolean;
  address?: string;

  interestRate?: {
    monthlyRate: number;
    interestType: "flat" | "compound";
  };

  fees?: {
    administrativeFee?: { amount: number; type: "flat" | "percentage" };
    applicationFee?: { amount: number; type: "flat" | "percentage" };
    attorneyReviewFee?: { amount: number; type: "flat" | "percentage" };
    brokerFee?: { amount: number; type: "flat" | "percentage" };
    annualMaintenanceFee?: { amount: number; type: "flat" | "percentage" };
  };

  backgroundColor?: string;
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
}


class CompanyStore {
  companies: Company[] = [];
  filteredCompanies: Company[] = [];
  loading = false;

  constructor() {
    makeAutoObservable(this);
  }

  async createCompany(company: Company) {
    this.loading = true;
    try {
      const res = await createCompany(company);
      const newCompany = res.data;

      const companyWithId = { ...newCompany, id: newCompany._id };

      runInAction(() => {
        this.companies.push(companyWithId);
        this.filteredCompanies = [...this.companies];
      });

      return companyWithId;
    } finally {
      runInAction(() => (this.loading = false));
    }
  }
  async fetchCompany() {
    this.loading = true;
    try {
      const { data } = await api.get("/companies/allcompanies");
      runInAction(() => {
        const validCompanies = (data.data || data.companies || []).filter(Boolean); // removes undefined/null
        this.companies = validCompanies;
        this.filteredCompanies = validCompanies;
      });
    } catch (err) {
      console.error("Failed to fetch companies:", err);
    } finally {
      runInAction(() => (this.loading = false));
    }
  }

  async searchCompanies(query: string) {
    this.loading = true;
    try {
      const companies = await fetchCompanies(query);
      runInAction(() => {
        this.filteredCompanies = companies;
      });
    } catch (err) {
      console.error("Search failed:", err);
    } finally {
      runInAction(() => (this.loading = false));
    }
  }

  async updateCompany(id: string, data: Company) {
    this.loading = true;
    try {
      const res = await api.put(`/companies/update/${id}`, data);

      runInAction(() => {
        const index = this.companies.findIndex((c) => c._id === id);
        if (index !== -1) {
          this.companies[index] = res.data.data;
          this.filteredCompanies = [...this.companies];
        }
      });

      return res.data.data;
    } catch (err) {
      console.error("Failed to update company:", err);
      throw err;
    } finally {
      runInAction(() => {
        this.loading = false;
      });
    }
  }

  async deleteCompany(id: string) {
    this.loading = true;
    try {
      await api.delete(`/companies/delete/${id}`);

      runInAction(() => {
        this.companies = this.companies.filter((c) => c._id !== id);
        this.filteredCompanies = this.companies;
      });
    } catch (err) {
      console.error("Failed to delete company:", err);
      throw err;
    } finally {
      runInAction(() => {
        this.loading = false;
      });
    }
  }

}

export const companyStore = new CompanyStore();
