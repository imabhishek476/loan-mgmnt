import { makeAutoObservable, runInAction } from "mobx";
import { fetchLoans, createLoan, updateLoan, deleteLoan, LoanPayload } from "../services/LoanService";

export interface Loan {
  status: any;
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

class LoanStore {
  loans: Loan[] = [];
  loading = false;
  error: string | null = null;

  constructor() {
    makeAutoObservable(this, {}, { autoBind: true });
  }

  async fetchLoans() {
    this.loading = true;
    try {
      const data = await fetchLoans();
      runInAction(() => { this.loans = data; });
    } catch (err: any) {
      runInAction(() => { this.error = err.message; });
    } finally { runInAction(() => { this.loading = false; }); }
  }

  async createLoan(payload: LoanPayload) {
    this.loading = true;
    try {
      const data = await createLoan(payload);
      runInAction(() => { this.loans.push(data); });
      return data;
    } finally { runInAction(() => { this.loading = false; }); }
  }

  async deleteLoan(id: string) {
    this.loading = true;
    try {
      await deleteLoan(id);
      runInAction(() => { this.loans = this.loans.filter(l => l._id !== id); });
    } finally { runInAction(() => { this.loading = false; }); }
  }

  getLoansByCompany(companyId: string) {
    return this.loans.filter(l => l.company === companyId);
  }

  getTotalLoanForCompany(companyId: string) {
    return this.getLoansByCompany(companyId).reduce((acc, loan) => acc + (loan.totalLoan || 0), 0);
  }
}

export const loanStore = new LoanStore();
