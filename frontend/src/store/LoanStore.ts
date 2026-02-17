import { makeAutoObservable, runInAction } from "mobx";
import {
  getLoansSearch,
  createLoan,
  deactivateLoan,
  updateLoan,
  recoverLoan,
  activeLoans,
  type LoanPayload,
  getLoanProfitByLoanId,
} from "../services/LoanService";
import { toast } from "react-toastify";
import moment from "moment";
import { ALLOWED_TERMS } from "../utils/constants";
import { convertToNumber } from "../utils/helpers";

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
  tableRef: any = null; //table Ref is for loans table screen
  loanDetails: any = null;
loanProfitMap: Record<string, any> = {};
  constructor() {
    makeAutoObservable(this, {}, { autoBind: true });
  }
  setLoanDetails(loanDetails: any) {
    this.loanDetails = loanDetails;
  }
  setTableRef(ref: any) {
    this.tableRef = ref;
  }
  async updateLoan(id: string, updates: any) {
    this.loading = true;
    try {
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
        loanStatus: filters.loanStatus || null,
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
      runInAction(() => (this.loading = false));
    }
  }
  async fetchActiveLoans(clientId: string) {
    this.loading = true;
    try {
      const data = await activeLoans(clientId);
      runInAction(() => {
        this.loans = data;
      });
    } catch (err) {
      console.error("Error fetching loans:", err);
    } finally {
      runInAction(() => {
        this.loading = false;
      });
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

  async deactivateLoan(id: string) {
    this.loading = true;
    try {
      const updated = await deactivateLoan(id);
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
async getLoanProfitByLoanId(id: string) {
  this.loading = true;
  try {
    const data = await getLoanProfitByLoanId(id);
    runInAction(() => {
      this.loanProfitMap[id] = data;
    });
  } catch (err) {
    console.error("Error fetching loan profit:", err);
  } finally {
    runInAction(() => {
      this.loading = false;
    });
  }
}
  getLoansByClient(clientId: string) {
    return this.loans.filter((l) => l.client === clientId);
  }

  getLoansByCompany(companyId: string) {
    return this.loans.filter((l) => l.company === companyId);
  }
  async refreshDataTable() {
    if (this.tableRef?.current) {
      this.tableRef.current.onQueryChange();
    } else {
      console.log('refresh table failed', this.tableRef)
    }
  }
  async calculateLoanAmounts({ loan = null, date = null, selectedTerm = null, prevLoanTotal = 0, calculate = false ,calcType = null}) {

    const interestType = loan?.interestType || "flat";
    const monthlyRate = loan?.monthlyRate || 0;
    const issueDate = moment(loan?.issueDate, "MM-DD-YYYY");
    const paidAmount = loan?.paidAmount || 0;
    let subtotal = loan?.subTotal || 0;
    let total = subtotal;
    let today = moment();
    if (date) {
      today = date ? moment(date, "MM-DD-YYYY") : moment();
    }
    let originalTerm = loan?.loanTerms || 0;
    let monthsPassed =  0;
    monthsPassed = Math.floor(today.diff(issueDate, "days") / 30) || 1;
    if (calcType == "prevLoans") {
       monthsPassed = today.diff(issueDate, "months") + 1;
    } 
    const dynamicTerm = ALLOWED_TERMS.find((t) => t >= monthsPassed && t <= originalTerm) || originalTerm;
    if (selectedTerm) {
      originalTerm = selectedTerm
    } else if (monthsPassed <=  dynamicTerm) {
      originalTerm = dynamicTerm;
    }
    let rate = null;
    if (calculate) {
      rate = monthlyRate;
    }
    else {
      rate = monthlyRate / 100;
    }
    const baseNum = convertToNumber(loan?.baseAmount);
    const prevLoan = convertToNumber(prevLoanTotal);
    let totalBase = baseNum + prevLoan;
    if (calcType === "prevLoans") {
      if (prevLoan == 0) {
        totalBase = totalBase + loan.previousLoanAmount;
      }
    }
    if (totalBase <= 0)
      return { subtotal: 0, interestAmount: 0, totalWithInterest: 0 };

    const rateNum = convertToNumber(rate);
    const termNum = Math.max(0, Math.floor(convertToNumber(originalTerm)));
    const feeKeys = [
      "administrativeFee",
      "applicationFee",
      "attorneyReviewFee",
      "brokerFee",
      "annualMaintenanceFee",
    ];

    const feeTotal = feeKeys.reduce((sum, key) => {
      const fee = loan?.fees[key];
      if (!fee) return sum;
      const value = convertToNumber(fee.value);
      return fee.type === "percentage"
        ? sum + (baseNum * value) / 100
        : sum + value;
    }, 0);

    if (calculate) {
      subtotal = totalBase + feeTotal;
      total = subtotal;
    }

    let interest = 0;
    let monthInt = 0;
    if (termNum > 0 && rateNum > 0) {
      if (interestType === "flat") {

        for (let i = 6; i <= termNum; i += 6) {
          const stepInterest = total * (rateNum / 100) * 6;
          monthInt = total * (rateNum / 100);
          total += stepInterest;
          if (i === 18 || i === 30) total += 200;
        }


        interest = total - subtotal;
      } else {
        for (let i = 1; i <= termNum; i++) {
          total *= 1 + rateNum / 100;
          if (i === 18 || i === 30) total += 200;
        }
        interest = total - subtotal;
        monthInt = interest / termNum;


      }
    }
    const remaining = Math.max(0, total - paidAmount);
    const obj = {
      baseNum,
      selectedTerm,
      calculate,
      monthInt: monthInt ?  parseFloat(monthInt.toFixed(2)) : 0 ,
      subtotal: subtotal ? parseFloat(subtotal.toFixed(2)) : 0 ,
      interestAmount: interest ?  parseFloat(interest.toFixed(2)): 0,
      totalWithInterest:total ?  parseFloat(total.toFixed(2)) : 0,
      total,
      paidAmount,
      remaining,
      monthsPassed,
      currentTerm: dynamicTerm,
      dynamicTerm,
      termNum,
      rateNum,
      interestType,
      monthlyRate,
      issueDate,
      prevLoan,
    }
    return obj;
  }
}

export const loanStore = new LoanStore();
