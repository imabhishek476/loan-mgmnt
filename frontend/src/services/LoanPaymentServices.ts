import api from "../api/axios";

// Payment payload type
export interface PaymentPayload {
  loanId: string;
  clientId: string;
  paidAmount: number;
  paidDate: string | Date;
  checkNumber?: string;
  payments: Payment[];
  rootLoanId: string;
  totalBaseAmount: number;
  totalPaid: number;
  totalProfit: number;
}

// Payment type returned from API
export interface Payment extends PaymentPayload {
  _id?: string;
}

// Fetch all payments for a specific loan
export const fetchPaymentsByLoan = async (
  loanId: string
): Promise<{ payments: Payment[]; profit: any }> => {
  const { data } = await api.get(`/payments/${loanId}`);

  return {
    payments: data.payments || [],
    profit: data.profit || null,
  };
};
// Add a new payment
export const addPayment = async (payload: PaymentPayload): Promise<Payment> => {
  const { data } = await api.post("/payments/store", payload);
  return data.payment; // matches your backend response
};
export const editPayment = async (  paymentId: string,  payload: PaymentPayload): Promise<Payment> => {
  const { data } = await api.put(`/payments/edit/${paymentId}`, payload);
  return data.payment; 
};

export const deletePayment = async (paymentId: string) => {
  const { data } = await api.delete(`/payments/delete/${paymentId}`);
  return data;
};
export const getLastPaymentDate = async (loanId: string): Promise<string | null> => {
  const { data } = await api.get(`/payments/${loanId}`); 
  const payments = data.payments || [];
  if (payments.length === 0) return null;
  return payments[0].paidDate;
};
