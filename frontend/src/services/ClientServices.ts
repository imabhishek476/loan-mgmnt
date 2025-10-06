import api from "../api/axios";

export interface ClientPayload {
  fullName: string;
  email: string;
  phone: string;
  ssn?: string;
  dob?: string;
  accidentDate?: string;
  address?: string;
  attorneyName?: string;
  customFields?: Record<string, unknown>[];
}

export const createClient = async (data: ClientPayload) => {
  const { data: response } = await api.post("/client/store", data);
  return response;
};

export const getClientsSearch = async (filters: { query?: string } = {}) => {
  const { data } = await api.get("/client/search", { params: filters });
  return data.clients || [];
};

export const updateClient = async (id: string, data: ClientPayload) => {
  const { data: response } = await api.put(`/client/${id}`, data);
  return response;
};

export const deleteClient = async (id: string) => {
  const { data: response } = await api.delete(`/client/${id}`);
  return response;
};

export const getClientLoans = async (id: string) => {
  const { data } = await api.get(`/client/loans/${id}`);
  return data.loans || [];
};
