
import api from "../api/axios";

export interface AuditLog {
    message: string;
    _id: string;
    userId?: { _id: string; name: string; email: string ,userRole:string} | null;
    action: string;
    entity: string;
    data?: any;
    createdAt: string;
}


export const fetchAuditLogs = async (): Promise<AuditLog[]> => {
    try {
        const { data } = await api.get("/logs/audit-logs", { withCredentials: true });
        return data.data || [];
    } catch (error) {
        console.error("Failed to fetch audit logs:", error);
        throw error;
    }
};
