import { makeAutoObservable, runInAction } from "mobx";
import api from "../api/axios";

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
}

class UserStore {
  user: User | null = null;
  loading = false;

  constructor() {
    makeAutoObservable(this);
    this.loadUser(); // 
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

  async loadUser() {
    this.loading = true;
    try {
      const { data } = await api.get("/auth/me");
      runInAction(() => {
        this.user = data;
      });
    } catch {
      runInAction(() => {
        this.user = null;
      });
    } finally {
      runInAction(() => {
        this.loading = false;
      });
    }
  }
}

export const userStore = new UserStore();
