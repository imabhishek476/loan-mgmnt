import api from "../api/axios";


export const fetchClientNotes = async (clientId: string) => {
  const { data } = await api.get(`/client-notes/${clientId}`);
  return data.notes;
};

export const addClientNote = async (payload: {
  clientId: string;
  text: string;
  date?: Date;
}) => {
  const { data } = await api.post(`/client-notes/store`, payload);
  return data.note;
};

export const deleteClientNote = async (id: string) => {
  await api.delete(`/client-notes/${id}`);
};