import { makeAutoObservable, runInAction } from "mobx";
import {
  getClientsSearch,
  createClient,
  updateClient,
  deleteClient,
  getClientLoans,
  toggleClientStatus,
  getClientById,
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
  toggleLoan = false;
  tableRef: any = null; //table Ref is for customers table screen
  clientFilters: any = {};
  filtersOpen: boolean = false;   
  constructor() {
    makeAutoObservable(this);
  }
  setTableRef(ref: any) {
    this.tableRef = ref;
  }
  setClients(data: any) {
    runInAction(() => (this.clients = data));
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
        const idx = this.clients.findIndex((c) => c?._id === id);
        if (idx !== -1) this.clients[idx] = updatedClient;
      });
    } finally {
      runInAction(() => (this.loading = false));
    }
  } 
async fetchClientById(id: string) {
  try {
    const client = await getClientById(id);
    runInAction(() => {
      const exists = this.clients.some(c => c._id === id);
      if (!exists && client) this.clients.push(client);
    });
    return client; 
  } catch (error) {
    console.error("Error fetching client by id:", error);
    return null;
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
  // eslint-disable-next-line no-unused-vars, @typescript-eslint/no-unused-vars
  async toggleClientStatus(id: string, _p0: boolean) {
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
    if (this.tableRef?.current) {
      this.tableRef.current.onQueryChange();
    } else {
      console.log('refresh table failed', this.tableRef)
    }
  }
  async toggleLoanModel() {
    runInAction(() => (this.toggleLoan = !this.toggleLoan));
  }
  setClientFilters(filters: any) {
    runInAction(() => (this.clientFilters = filters || {}));
  }
  setFiltersOpen(value: boolean) {
    runInAction(() => (this.filtersOpen = value));
  }
  toggleFiltersOpen() {
    runInAction(() => (this.filtersOpen = !this.filtersOpen));
  }
}

export const clientStore = new ClientStore();
