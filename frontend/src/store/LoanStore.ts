import { makeAutoObservable, runInAction } from "mobx";
import {
  fetchLoans,
  createLoan,
  deleteLoan,
  LoanPayload,
} from "../services/LoanService";

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
  status?: string;
}

class LoanStore {
  loans: Loan[] = [];
  loading = false;

  constructor() {
    makeAutoObservable(this, {}, { autoBind: true });
  }

  async fetchLoans() {
    this.loading = true;
    try {
      const data = await fetchLoans();
      runInAction(() => (this.loans = data));
    } catch (err: any) {
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
