import api from "../api/axios";

interface LoginData {
  email: string;
  password: string;
}

export const login = async (data: LoginData) => {
  const { data: response } = await api.post("/auth/login", data);
  console.log("data");
  return response.user;
};

export const logout = async () => {
  await api.post("/auth/logout");
};
