import { makeAutoObservable, runInAction } from "mobx";
import { fetchDashboardStats } from "../services/DashboardService";

class DashboardStore {
    stats = {
        totalClients: 0,
        totalLoans: 0,
        totalCompanies: 0,
        totalLoanAmount: 0,
        totalPayments: 0,
        loansByCompany: [],
        loanByClient: [],
    };
    loading = false;

    constructor() {
        makeAutoObservable(this);
    }

    async loadStats() {
        this.loading = true;
        try {
            const data = await fetchDashboardStats();
            runInAction(() => {
                this.stats = data;
                this.loading = false;
            });
        } catch (err) {
            this.loading = false;
            console.error(err);
        }
    }
}

export const dashboardStore = new DashboardStore();
