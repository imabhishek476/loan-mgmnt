import { makeAutoObservable, runInAction } from "mobx";
import { createCompany, fetchCompanies } from "../services/CompaniesServices";
import api from "../api/axios";

export interface Company {
  _id?: string;
  companyName: string;
  description?: string;
  phone?: string;
  email?: string;
  website?: string;
  activeCompany: boolean;
  address?: string;
  interestRate?: {
    monthlyRate: number;
    interestType: "flat" | "compound";
  };
  fees?: {
    administrativeFee?: { value: number; type: "flat" | "percentage" };
    applicationFee?: { value: number; type: "flat" | "percentage" };
    attorneyReviewFee?: { value: number; type: "flat" | "percentage" };
    brokerFee?: { value: number; type: "flat" | "percentage" };
    annualMaintenanceFee?: { value: number; type: "flat" | "percentage" };
  };
  backgroundColor?: string;
  loanTerms?: number[];
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
  activeCompany: Company | null = null;
  // isCompanyFetched = false;
  // isFetching = false; 
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
    } catch (err) {
      console.error("Failed to create company:", err);
      throw err; 
    } finally {
      runInAction(() => {
        this.loading = false;
      });
    }
  }
  async fetchCompany() {
    // if (this.isCompanyFetched || this.isFetching) return;

    // this.isFetching = true;
    this.loading = true;

    try {
      const  companies  = await  fetchCompanies();
      runInAction(() => {
        const validCompanies = (companies || []).filter(Boolean);
        this.companies = validCompanies;
        this.filteredCompanies = validCompanies;
        // this.isCompanyFetched = true;
      });
    } catch (err) {
      console.error("Failed to fetch companies:", err);
    } finally {
      runInAction(() => {
        this.loading = false;
        // this.isFetching = false;
      });
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
