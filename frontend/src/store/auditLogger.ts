import { makeAutoObservable, runInAction } from "mobx";
import { fetchAuditLogs, type AuditLog } from "../services/AuditLogService";

class AuditLogStore {
    logs: AuditLog[] = [];
    loading = false;

    constructor() {
        makeAutoObservable(this);
    }


    async fetchLogs() {
        this.loading = true;
        try {
            const logs = await fetchAuditLogs();
            runInAction(() => {
                //@ts-ignore
                this.logs = logs;
            });
        } catch (err) {
            console.error("Failed to fetch audit logs:", err);
        } finally {
            runInAction(() => (this.loading = false));
        }
    }
}

export const auditLogStore = new AuditLogStore();
