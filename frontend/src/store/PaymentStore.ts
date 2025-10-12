import { makeAutoObservable, runInAction } from "mobx";
import { fetchPaymentsByLoan, addPayment } from "../services/LoanPaymentServices";

class PaymentStore {
  //@ts-ignore
  payments: Record<string, Payment[]> = {};
  loading = false;

  constructor() {
    makeAutoObservable(this, {}, { autoBind: true });
  }

  // Fetch all payments for a specific loan
  async fetchPayments(loanId: string) {
    this.loading = true;
    try {
      const data = await fetchPaymentsByLoan(loanId);
      runInAction(() => {
        this.payments[loanId] = data;
      });
    } catch (err) {
      console.error("Error fetching payments:", err);
    } finally {
      runInAction(() => (this.loading = false));
    }
  }

  // Add a new payment
  //@ts-ignore
  async addPayment(payload: PaymentPayload) {
    this.loading = true;
    try {
      const payment = await addPayment(payload);
      runInAction(() => {
        if (!this.payments[payload.loanId]) this.payments[payload.loanId] = [];
        this.payments[payload.loanId].push(payment);
      });
      return payment;
    } catch (err: any) {
      console.error("Error adding payment:", err);
      throw new Error(err?.message || "Payment failed");
    } finally {
      runInAction(() => (this.loading = false));
    }
  }

  // Optional helper: get payments by loan
  getPaymentsByLoan(loanId: string) {
    return this.payments[loanId] || [];
  }
}

export const paymentStore = new PaymentStore();
