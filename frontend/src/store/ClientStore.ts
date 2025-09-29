import { makeAutoObservable, runInAction } from "mobx";
import { getClientsSearch, createClient, updateClient, deleteClient } from "../services/ClientServices";

export interface Client {
  _id?: string;
  fullName: string;
  email: string;
  phone: string;
  ssn?: string;
  dob?: string;
  accidentDate?: string;
  address?: string;
  attorneyName?: string;
}

class ClientStore {
  clients: Client[] = [];
  loading = false;

  constructor() {
    makeAutoObservable(this);
  }

  async fetchClients(query: string = "") {
    this.loading = true;
    try {
      const data = await getClientsSearch({ query });
      runInAction(() => {
        this.clients = data || [];
      });
    } catch (error) {
      console.error("Error fetching clients:", error);
    } finally {
      runInAction(() => {
        this.loading = false;
      });
    }
  }

  async createClient(client: Client) {
    this.loading = true;
    try {
      const { client: newClient } = await createClient(client);
      runInAction(() => {
        this.clients.push(newClient);
      });
      console.log(client,'client')
    } finally {
      runInAction(() => (this.loading = false));
    }
  }

  async updateClient(id: string, client: Client) {
    this.loading = true;
    try {
      const { client: updatedClient } = await updateClient(id, client);
      runInAction(() => {
        const index = this.clients.findIndex((c) => c._id === id);
        if (index !== -1) this.clients[index] = updatedClient;
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
}

export const clientStore = new ClientStore();
