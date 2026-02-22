import { makeAutoObservable, runInAction } from "mobx";
import { fetchPaymentsByLoan, addPayment, deletePayment, editPayment } from "../services/LoanPaymentServices";

class PaymentStore {
  //@ts-ignore
  payments: Record<string, Payment[]> = {};
  loading = false;
  profitMap: Record<string, any> = {};
  constructor() {
    makeAutoObservable(this, {}, { autoBind: true });
  }

  // Fetch all payments for a specific loan
  async fetchPayments(loanId: string) {
    this.loading = true;
    try {
      const { payments, profit } = await fetchPaymentsByLoan(loanId);
      runInAction(() => {
        this.payments[loanId] = payments;
        this.profitMap[loanId] = profit; 
      });
    } catch (err) {
      console.error("Error fetching payments:", err);
    } finally {
      runInAction(() => {
        this.loading = false;
      });
    }
  }

  async addPayment(payload) {
    this.loading = true;
    try {
      const payment = await addPayment(payload);
      runInAction(() => {
        if (!this.payments[payload.loanId]) this.payments[payload.loanId] = [];
        this.payments[payload.loanId].push(payment);
      });
      return payment;
    } catch (err) {
      console.error("Error adding payment:", err);
      throw err;
    } finally {
      runInAction(() => (this.loading = false));
    }
  }
  async editPayment(paymentId: string, payload) {
    this.loading = true;
    try {
      const updated = await editPayment(paymentId, payload); 

      runInAction(() => {
        const loanId = payload.loanId;

        if (!this.payments[loanId]) return;

        this.payments[loanId] = this.payments[loanId].map((p) =>
          p._id === paymentId ? updated : p
        );
      });

      return updated;
    } catch (err) {
      console.error("Error editing payment:", err);
      throw err;
    } finally {
      runInAction(() => (this.loading = false));
    }
  }
  async deletePayment(paymentId: string) {
    this.loading = true;
    try {
      await deletePayment(paymentId);

      runInAction(() => {
        for (const loanId in this.payments) {
          this.payments[loanId] = this.payments[loanId].filter(
            (p) => p._id !== paymentId
          );
        }
      });
    } catch (err) {
      console.error("Error deleting payment:", err);
      throw err;
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
