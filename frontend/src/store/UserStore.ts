import { makeAutoObservable, runInAction } from "mobx";
import { UserService, type UserPayload, type UserResponse } from "../services/UserService";

import api from "../api/axios";


interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: string;
}

class UserStore {
  searchUsers(query: string) {
    runInAction(() => {
      if (!query.trim()) {
        this.filteredUsers = this.users;
        return;
      }

      const lowerQuery = query.toLowerCase();
      this.filteredUsers = this.users.filter(
        (user) =>
          user.name?.toLowerCase().includes(lowerQuery) ||
          user.email?.toLowerCase().includes(lowerQuery)
      );
    });
  }
  user: AuthUser | null = null;
  users: UserResponse[] = [];
  filteredUsers: UserResponse[] = [];
  selectedUser: UserResponse | null = null;
  loading = false;
  searchLoading = false;
  isUsersFetched = false;
  isFetching = false; 
  activeAdminTab: "companies" | "attorneys" | "users" | "system" | "audit" = "companies";
  constructor() {
    makeAutoObservable(this);
  }

  async fetchUsers() {

    if (this.isUsersFetched || this.isFetching) return;

    // this.isFetching = true;
    // this.loading = true;
    if (this.users.length > 0) {
      runInAction(() => {
        this.loading = false;
        this.isFetching = false;
      });
      return;
    }

    try {
      const { data } = await UserService.fetchUsers();
      runInAction(() => {
        this.users = data;
        this.filteredUsers = data;
        this.isUsersFetched = true;
      });
    } catch (err) {
      console.error("Failed to fetch users:", err);
    } finally {
      runInAction(() => {
        this.loading = false;
        this.isFetching = false; 
      });
    }
  }


  async createUser(payload: UserPayload) {
    this.loading = true;
    try {
      const { data } = await UserService.createUser(payload);
      runInAction(() => {
        this.users.unshift(data);
        this.filteredUsers.unshift(data);
      });
    } finally {
      runInAction(() => (this.loading = false));
    }
  }

  async updateUser(id: string, payload: Partial<UserPayload>) {
    this.loading = true;
    try {
      const { data } = await UserService.updateUser(id, payload);

      runInAction(() => {
        const index = this.users.findIndex(u => u._id === id);
        if (index >= 0) this.users[index] = data;

        const fIndex = this.filteredUsers.findIndex(u => u._id === id);
        if (fIndex >= 0) this.filteredUsers[fIndex] = data;
        if (this.user && this.user.id === data._id) {
          this.user = {
            ...this.user,
            name: data.name,
            email: data.email,
            role: data.userRole,
          };
          const fIndex = this.filteredUsers.findIndex(u => u._id === id);
          const uIndex = this.users.findIndex(u => u._id === id);
          if (fIndex >= 0){
            this.filteredUsers[fIndex] = data;
          }
          if (uIndex >= 0){
            this.users[uIndex] = data;
          }
        }
      });
    } finally {
      runInAction(() => (this.loading = false));
    }
  }


  async deleteUser(id: string) {
    this.loading = true;
    try {
      await UserService.deleteUser(id);
      runInAction(() => {
        this.users = this.users.filter(u => u._id !== id);
        this.filteredUsers = this.filteredUsers.filter(u => u._id !== id);
      });
    } finally {
      runInAction(() => (this.loading = false));
    }
  }

  async login(email: string, password: string) {
    this.loading = true;
    try {
      const { data } = await api.post("/auth/login", { email, password });
      runInAction(() => {
        this.user = data.user;
      });
      return data.user;
    } finally {
      runInAction(() => {
        this.loading = false;
      });
    }
  }

  async logout() {
    this.loading = true;
    try {
      await api.post("/auth/logout");
      runInAction(() => {
        this.user = null;
      });
    } finally {
      runInAction(() => {
        this.loading = false;
      });
    }
  }

  async loadUser(force = false) {
 
    if (this.user && !force) return;

    if (this.isFetching) return;
    this.isFetching = true;
    this.loading = true;

    try {
      const { data } = await api.get("/auth/me");
      runInAction(() => {
        this.user = data;
      });
    } catch (err) {
      console.error("Failed to load user:", err);
      runInAction(() => {
        this.user = null;
      });
    } finally {
      runInAction(() => {
        this.loading = false;
        this.isFetching = false;
      });
    }
  }
  setActiveAdminTab(tab: "companies" | "attorneys" | "users" | "system" | "audit") {
    this.activeAdminTab = tab;
  }
}

export const userStore = new UserStore();

export type { UserPayload };
