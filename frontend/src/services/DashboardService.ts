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
