import { makeAutoObservable, runInAction } from "mobx";
import {
  fetchLoans,
  createLoan,
  deleteLoan,
  updateLoan,
  type LoanPayload,
} from "../services/LoanService";

export interface Loan {
  tableData: any;
  _id?: string;
  issueDate: string;
  client: string;
  company: string;
  loanTerms: number;
  baseAmount: number;
  fees?: Record<string, number>;
  interestType?: "flat" | "compound";
  monthlyRate?: number;
  totalLoan?: number;
  checkNumber?: string;
  status?: string;
}

class LoanStore {
  loans: Loan[] = [];
  loading = false;

  constructor() {
    makeAutoObservable(this, {}, { autoBind: true });
  }


  // Add this method to LoanStore class
  async updateLoan(id: string, updates: Partial<Loan>) {
    this.loading = true;
    try {
      // @ts-ignore
      const updatedLoan = await updateLoan(id, updates);
      runInAction(() => {
        const index = this.loans.findIndex((l) => l._id === id);
        if (index !== -1) {
          this.loans[index] = { ...this.loans[index], ...updatedLoan };
        }
      });
      return updatedLoan;
    } finally {
      runInAction(() => (this.loading = false));
    }
  }

  async fetchLoans() {
    this.loading = true;
    try {
      const data = await fetchLoans();
      runInAction(() => (this.loans = data));
    } catch (err) {
      console.error("Error fetching loans:", err);
    } finally {
      runInAction(() => (this.loading = false));
    }
  }

  async createLoan(payload: LoanPayload) {
    this.loading = true;
    try {
      const data = await createLoan(payload);
      runInAction(() => this.loans.push(data));
      return data;
    } finally {
      runInAction(() => (this.loading = false));
    }
  }

  async deleteLoan(id: string) {
    this.loading = true;
    try {
      await deleteLoan(id);
      runInAction(() => {
        this.loans = this.loans.filter((l) => l._id !== id);
      });
    } catch (err) {
      console.error("Error deleting loan:", err);
    } finally {
      runInAction(() => (this.loading = false));
    }
  }

  getLoansByClient(clientId: string) {
    return this.loans.filter((l) => l.client === clientId);
  }

  getLoansByCompany(companyId: string) {
    return this.loans.filter((l) => l.company === companyId);
  }
}

export const loanStore = new LoanStore();
