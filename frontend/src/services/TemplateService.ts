import api from "../api/axios";

// ✅ GET ALL
export const getTemplates = async (search = "") => {
  const res = await api.get(`/templates?search=${search}`);
  return res.data;
};

// ✅ GET BY ID
export const getTemplateById = async (id: string) => {
  const res = await api.get(`/templates/${id}`);
  return res.data;
};

// ✅ CREATE
export const createTemplate = async (data: any) => {
  const res = await api.post(`/templates`, data);
  return res.data;
};

// ✅ UPDATE
export const updateTemplate = async (id: string, data: any) => {
  const res = await api.put(`/templates/${id}`, data);
  return res.data;
};

// ✅ DELETE
export const deleteTemplate = async (id: string) => {
  const res = await api.delete(`/templates/${id}`);
  return res.data;
};