import api from "../api/axios";

export interface AttorneyPayload {
  fullName: string;
  email?: string;
  phone?: string;
  firmName?: string;
  address?: string;
  memo?: string;
  isActive?: boolean;
}

export const createAttorney = async (data: AttorneyPayload) => {
  const { data: response } = await api.post("/attorneys/add", data);
  return response;
};

export const getAttorney = async (search = "") => {
  const { data } = await api.get("/attorneys", {
    params: search ? { search } : {},
  });
  return data;
};

export const updateAttorney = async (id: string, data: AttorneyPayload) => {
  const { data: response } = await api.put(`/attorneys/${id}`, data);
  return response;
};

export const deleteAttorney = async (id: string) => {
  const { data: response } = await api.delete(`/attorneys/${id}`);
  return response;
};