import { makeAutoObservable, runInAction } from "mobx";
import {
  getClientsSearch,
  createClient,
  updateClient,
  deleteClient,
  getClientLoans,
  toggleClientStatus,
} from "../services/ClientServices";

export interface Loan {
  _id: string;
  company: string;
  baseAmount: number;
  loanTerms: number;
  interestType: string;
  totalLoan?: number;
}

export interface Client {
  isActive: boolean;
  _id?: string;
  fullName: string;
  email: string;
  phone: string;
  ssn?: string;
  dob?: string;
  accidentDate?: string;
  address?: string;
  attorneyName?: string;
  memo?:string;
  loans?: Loan[];
}

class ClientStore {
  clients: Client[] = [];
  selectedClientLoans: Loan[] = [];
  loading = false;
  customFields:[];
  refreshTable = false;
  toggleLoan = false;
  constructor() {
    makeAutoObservable(this);
  }

  async fetchClients(filters: { query?: string; page?: number; limit?: number; issueDate?: string } = {}) {
    this.loading = true;
    try {
      const data = await getClientsSearch(filters);
      runInAction(() => (this.clients = data.clients));
      return data.total;
    } catch (error) {
      console.error("Error fetching clients:", error);
      return 0;
    } finally {
      runInAction(() => (this.loading = false));
    }
  }

  async createClient(client: Client) {
    this.loading = true;
    try {
      const { client: newClient } = await createClient(client);
      runInAction(() => this.clients.push(newClient));
    } finally {
      runInAction(() => (this.loading = false));
    }
  }

  async updateClient(id: string, client: Client) {
    this.loading = true;
    try {
      const { client: updatedClient } = await updateClient(id, client);
      runInAction(() => {
        const idx = this.clients.findIndex((c) => c._id === id);
        if (idx !== -1) this.clients[idx] = updatedClient;
      });
    } finally {
      runInAction(() => (this.loading = false));
    }
  }

  async deleteClient(id: string) {
    this.loading = true;
    try {
      await deleteClient(id);
      runInAction(() => {
        this.clients = this.clients.filter((c) => c._id !== id);
      });
    } finally {
      runInAction(() => (this.loading = false));
    }
  }
  async fetchClientLoans(id: string) {
    this.loading = true;
    try {
      const loans = await getClientLoans(id);
      runInAction(() => (this.selectedClientLoans = loans));
    } catch (err) {
      console.error("Error fetching client loans:", err);
    } finally {
      runInAction(() => (this.loading = false));
    }
  }
  async toggleClientStatus(id: string) {
    this.loading = true;
    try {
      const { client } = await toggleClientStatus(id);
      runInAction(() => {
        const idx = this.clients.findIndex((c) => c._id === id);
        if (idx !== -1) this.clients[idx] = client;
      });
    } catch (err) {
      console.error("Error toggling client status:", err);
    } finally {
      runInAction(() => (this.loading = false));
    }
  }
  async refreshDataTable() {
    runInAction(() => (this.refreshTable = !this.refreshTable));
  }
  async toggleLoanModel() {
    runInAction(() => (this.toggleLoan = !this.toggleLoan));
  }
}

export const clientStore = new ClientStore();
