import api from "../api/axios";

// Payment payload type
export interface PaymentPayload {
  loanId: string;
  clientId: string;
  paidAmount: number;
  paidDate: string | Date;
  checkNumber?: string;
}

// Payment type returned from API
export interface Payment extends PaymentPayload {
  _id?: string;
}

// Fetch all payments for a specific loan
export const fetchPaymentsByLoan = async (loanId: string): Promise<Payment[]> => {
  const { data } = await api.get(`/payments/${loanId}`); // singular 'payment'
  return data.payments || []; // match backend JSON { success, payments }
};

// Add a new payment
export const addPayment = async (payload: PaymentPayload): Promise<Payment> => {
  const { data } = await api.post("/payments/store", payload);
  return data.payment; // matches your backend response
};
