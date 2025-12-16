import { makeAutoObservable, runInAction } from "mobx";
import { fetchDashboardStats, fetchDashboardStatsByDate, fetchFilteredDashboardStats, fetchPayoffStats } from "../services/DashboardService";

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
  payoffStats = {
        data: [],
        total: 0,
        page: 1,
        limit: 10,
        type: "week",
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
    async loadFilteredStats(filters: any) {
        this.loading = true;
        try {
            const data = await fetchFilteredDashboardStats(filters);
            runInAction(() => {
                this.stats = data;
                this.loading = false;
            });
        } catch (err) {
            console.error(err);
            this.loading = false;
        }
    }
     async loadPayoffStats(type = "week", page = 1, limit = 10) {
        this.loading = true;
        try {
            const data = await fetchPayoffStats(type, page, limit);
            runInAction(() => {
                this.payoffStats = {
                    data: data.data || [],
                    total: data.total || 0,
                    page: data.page || page,
                    limit: data.limit || limit,
                    type: type,
                };
                this.loading = false;
            });
        } catch (err) {
            console.error(err);
            this.loading = false;
        }
    }
}

export const dashboardStore = new DashboardStore();
