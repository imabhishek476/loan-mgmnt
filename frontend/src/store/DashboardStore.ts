import { makeAutoObservable, runInAction } from "mobx";
import {
    fetchDashboardStats,
    fetchFilteredDashboardStats,
    fetchPayoffStats,
} from "../services/DashboardService";

class DashboardStore {
    globalStats = {
        totalClients: 0,
        totalLoans: 0,
        totalCompanies: 0,
        totalLoanAmount: 0,
        totalPaymentsAmount: 0,
        totalPaidOffLoans: 0,
        totalProfit: 0,
    };

    filteredStats = {
        loansByCompany: [],
        stats: {
            totalLoanAmount: 0,
            totalPaymentsAmount: 0,
            totalProfit: 0,
            totalLoans: 0,
        },
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
                this.globalStats = data;
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
                this.filteredStats = data;
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
                    type,
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
