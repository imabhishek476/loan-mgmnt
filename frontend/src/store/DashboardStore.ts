import { makeAutoObservable, runInAction } from "mobx";
import { fetchDashboardStats, fetchDashboardStatsByDate } from "../services/DashboardService";

class DashboardStore {
    stats = {
        totalClients: 0,
        totalLoans: 0,
        totalCompanies: 0,
        totalLoanAmount: 0,
        totalPaymentsAmount: 0,
        totalPayments: 0,
        loansByCompany: [],
        loanByClient: [],
        totalPaidOffLoans: 0, 
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
            console.error(err);
            this.loading = false;
        }
    }
    async loadStatsByDate(from, to) {
        this.loading = true;
        try {
            const data = await fetchDashboardStatsByDate(from, to);
            runInAction(() => {
                this.stats = data;
                this.loading = false;
            });
        } catch (err) {
            console.error(err);
            this.loading = false;
        }
    }
}

export const dashboardStore = new DashboardStore();
