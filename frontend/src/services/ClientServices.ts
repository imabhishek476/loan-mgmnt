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
  return response;
};

export const getClientsSearch = async (filters: { query?: string } = {}) => {
  const { data } = await axios.get("/client/search", {
    params: filters,
  });
  return data.clients || [];
};