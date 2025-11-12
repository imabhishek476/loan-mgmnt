import { makeAutoObservable, runInAction } from "mobx";
import {
  getLoansSearch,
  createLoan,
  deleteLoan,
  updateLoan,
  recoverLoan,
  activeLoans,
  type LoanPayload,
} from "../services/LoanService";
import { toast } from "react-toastify";

export interface Loan {
  paidAmount: number;
  subTotal: any;
  // paidAmount: number;
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
  loanStatus: string;
  parentLoanId?: string | null;
}

class LoanStore {
  loans: any[] = [];
  total: number = 0;
  loading: boolean = false;
  currentPage: number = 0;
  limit: number = 10;
  refreshTable = false;

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

  async fetchLoans(filters: any = {}) {
    this.loading = true;
    try {
      const params = {
        query: filters.query || "",
        issueDate: filters.issueDate || null,
        clientId: filters.clientId || null,
        page: filters.page ?? this.currentPage,
        limit: filters.limit ?? this.limit,
      };
      const response = await getLoansSearch(params);
      runInAction(() => {
        this.loans = response.loans || [];
        this.total = response.total || 0;
        this.currentPage = Number(response.currentPage ?? params.page);
        this.limit = Number(params.limit);
      });
    } catch (error: any) {
      console.error("Failed to fetch loans:", error);
      toast.error("Failed to load loans");
    } finally {
      runInAction(() => {
        this.loading = false;
      });
    }
  }
  async fetchActiveLoans() {
    this.loading = true;
    try {
      const data = await activeLoans();
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
      const updated = await deleteLoan(id);
      runInAction(() => {
        const index = this.loans.findIndex((l) => l._id === id);
        if (index !== -1) {
          this.loans[index].loanStatus = "Deactivated";
        }
      });
      return updated;
    } catch (err) {
      console.error("Error deactivating loan:", err);
    } finally {
      runInAction(() => (this.loading = false));
    }
  }

  async recoverLoan(id: string) {
    this.loading = true;
    try {
      const recovered = await recoverLoan(id);
      runInAction(() => {
        const index = this.loans.findIndex((l) => l._id === id);
        if (index !== -1) {
          this.loans[index].loanStatus = "Active";
        }
      });
      return recovered;
    } catch (err) {
      console.error("Error recovering loan:", err);
      throw new Error(err?.response?.data?.message || "Failed to recover loan");
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
  async refreshDataTable() {
    runInAction(() => (this.refreshTable = !this.refreshTable));
  }
}

export const loanStore = new LoanStore();
