import api from "../api/axios";

export const fetchDashboardStats = async () => {
    const res = await api.get("/dashboard/stats");
    return res.data;
};
export const fetchDashboardStatsByDate = async (from, to) => {
  const res = await api.get("/dashboard/stats/filter", {
    params: { from, to },
  });
  return res.data;
};
export const fetchPayoffStats = async (type, page = 1, limit = 10) => {
  const res = await api.get("/dashboard/payoff-stats", {
    params: { type, page, limit },
  });
  return res.data;
};
export const fetchFilteredDashboardStats = async (filters: any) => {
  const res = await api.get("/dashboard/stats/filtered", {
    params: filters,
  });
  return res.data;
};
