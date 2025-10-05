// stores/LoanStore.ts
import { makeAutoObservable, runInAction } from "mobx";
import api from "../api/axios";

export interface Loan {
  _id?: string;
  issueDate: string;
  client: string;
  company: string;
  loanTerms: string;
  baseAmount: string;
  customFields?: any[];
  fees?: Record<string, number>;
  totalLoan?: number;
}

class LoanStore {
  loans: Loan[] = [];
  loading = false;
  error: string | null = null;

  constructor() {
    makeAutoObservable(this, {}, { autoBind: true });
  }

  // Fetch all loans
  async fetchLoans() {
    this.loading = true;
    this.error = null;
    try {
      const { data } = await api.get("/loans");
      runInAction(() => {
        this.loans = data;
      });
    } catch (err: any) {
      runInAction(() => {
        this.error = err.message || "Failed to fetch loans";
      });
    } finally {
      runInAction(() => {
        this.loading = false;
      });
    }
  }

  // Create a new loan
  async createLoan(payload: Loan) {
    this.loading = true;
    this.error = null;
    try {
      const { data } = await api.post("/loans", payload);
      runInAction(() => {
        this.loans.push(data);
      });
      return data;
    } catch (err: any) {
      runInAction(() => {
        this.error = err.response?.data?.error || "Failed to create loan";
      });
      throw err;
    } finally {
      runInAction(() => {
        this.loading = false;
      });
    }
  }

  // Update an existing loan
  async updateLoan(id: string, payload: Loan) {
    this.loading = true;
    this.error = null;
    try {
      const { data } = await api.put(`/loans/${id}`, payload);
      runInAction(() => {
        const idx = this.loans.findIndex((l) => l._id === id);
        if (idx !== -1) this.loans[idx] = data;
      });
      return data;
    } catch (err: any) {
      runInAction(() => {
        this.error = err.response?.data?.error || "Failed to update loan";
      });
      throw err;
    } finally {
      runInAction(() => {
        this.loading = false;
      });
    }
  }

  // Delete a loan
  async deleteLoan(id: string) {
    this.loading = true;
    this.error = null;
    try {
      await api.delete(`/loans/${id}`);
      runInAction(() => {
        this.loans = this.loans.filter((l) => l._id !== id);
      });
    } catch (err: any) {
      runInAction(() => {
        this.error = err.response?.data?.error || "Failed to delete loan";
      });
      throw err;
    } finally {
      runInAction(() => {
        this.loading = false;
      });
    }
  }

  // Computed: Get loans by company
  getLoansByCompany(companyId: string) {
    return this.loans.filter((loan) => loan.company === companyId);
  }

  // Computed: Get total loan amount for a company
  getTotalLoanForCompany(companyId: string) {
    return this.getLoansByCompany(companyId).reduce((acc, loan) => {
      return acc + (loan.totalLoan || 0);
    }, 0);
  }
}

export const loanStore = new LoanStore();
