import api from "../api/axios";

export interface UserPayload {
  name: string;
  email: string;
  userRole: string;
  password?: string;
}

export interface UserResponse extends UserPayload {
  active: boolean;
  _id: string;
  createdAt?: string;
  updatedAt?: string;
}

export const UserService = {
  async fetchUsers(query = ""): Promise<{ data: UserResponse[] }> {
    const res = await api.get(query ? `/users/allusers?search=${query}` : `/users/allusers`);
    return { data: Array.isArray(res.data.data) ? res.data.data : [] };
  },


  async createUser(payload: UserPayload) {
    const res = await api.post("/users", payload);
    return { data: res.data };
  },

  async updateUser(id: string, payload: Partial<UserPayload>) {
    const res = await api.put(`/users/${id}`, payload);
    return { data: res.data };
  },

  async deleteUser(id: string) {
    const res = await api.delete(`/users/${id}`);
    return res.data;
  },

  async getUserById(id: string) {
    const res = await api.get(`/users/${id}`);
    return { data: res.data };
  },
};
