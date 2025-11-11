
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


    export const fetchAuditLogs = async (page = 0, limit = 10, query = ""): Promise<{
    data: AuditLog[];
    total: number;
    }> => {
    try {
        const { data } = await api.get("/logs/audit-logs", {
        params: { page, limit, query },
        withCredentials: true,
        });
        return { data: data.data || [], total: data.total || 0 };
    } catch (error) {
        console.error("Failed to fetch audit logs:", error);
        throw error;
    }
};
