import axios from "../api/axios";

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
  const { data: response } = await axios.post("/client/store", data, {
  });
  // console.log("create data:", response);
  return response;
};

export const getClientsSearch = async (filters: { query?: string } = {}) => {
  const { data } = await axios.get("/client/search", {
    params: filters,
  });
  return data.clients || [];
};
export const updateClient = async (id: string, data: ClientPayload) => {
  const { data: response } = await axios.put(`/client/${id}`, data);
  console.log("update data:", response);
  return response;
};

export const deleteClient = async (id: string) => {
  const { data: response } = await axios.delete(`/client/${id}`);
  return response;
};