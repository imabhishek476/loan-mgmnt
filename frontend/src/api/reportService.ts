import api from "./axios";
import type { AxiosResponse } from "axios";

export interface ReportFilters {
  company?: string;
  status?: string;
  year?: string;
  years?: string[];
  startDate?: string;
  endDate?: string;
  page?: number;
  pageSize?: number;
}

export interface ReportData {
  success: boolean;
  data: any[];
  pagination?: {
    page: number;
    pageSize: number;
    totalRecords: number;
    totalPages: number;
  };
}

export interface Company {
  _id: string;
  companyName: string;
}

class ReportService {
  // Fraudulent Report
  async getFraudulentReport(
    filters: ReportFilters
  ): Promise<AxiosResponse<ReportData>> {
    const params = new URLSearchParams();
    if (filters.company) params.append("company", filters.company);
    if (filters.status) params.append("status", filters.status);
    if (filters.year) params.append("year", filters.year);
    if (filters.page) params.append("page", filters.page.toString());
    if (filters.pageSize) params.append("pageSize", filters.pageSize.toString());

    return api.get(`/reports/fraudulent?${params.toString()}`);
  }

  async exportFraudulentReportExcel(filters: ReportFilters): Promise<void> {
    const params = new URLSearchParams();
    if (filters.company) params.append("company", filters.company);
    if (filters.status) params.append("status", filters.status);
    if (filters.year) params.append("year", filters.year);

    const response = await api.get(
      `/reports/fraudulent/export/excel?${params.toString()}`,
      { responseType: "blob" }
    );

    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute(
      "download",
      `Fraudulent_Loans_${new Date().getTime()}.xlsx`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  }

  async exportFraudulentReportPdf(filters: ReportFilters): Promise<void> {
    const params = new URLSearchParams();
    if (filters.company) params.append("company", filters.company);
    if (filters.status) params.append("status", filters.status);
    if (filters.year) params.append("year", filters.year);

    const response = await api.get(
      `/reports/fraudulent/export/pdf?${params.toString()}`,
      { responseType: "blob" }
    );

    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute(
      "download",
      `Fraudulent_Loans_${new Date().getTime()}.pdf`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  }

  // Yearly Report
  async getYearlyReport(
    filters: ReportFilters
  ): Promise<AxiosResponse<ReportData>> {
    const params = new URLSearchParams();
    if (filters.company) params.append("company", filters.company);
    if (filters.years && filters.years.length > 0) {
      filters.years.forEach((year) => params.append("years", year));
    }
    if (filters.page) params.append("page", filters.page.toString());
    if (filters.pageSize) params.append("pageSize", filters.pageSize.toString());

    return api.get(`/reports/yearly?${params.toString()}`);
  }

  async exportYearlyReportExcel(filters: ReportFilters): Promise<void> {
    const params = new URLSearchParams();
    if (filters.company) params.append("company", filters.company);
    if (filters.years && filters.years.length > 0) {
      filters.years.forEach((year) => params.append("years", year));
    }

    const response = await api.get(
      `/reports/yearly/export/excel?${params.toString()}`,
      { responseType: "blob" }
    );

    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `Yearly_Report_${new Date().getTime()}.xlsx`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  }

  async exportYearlyReportPdf(filters: ReportFilters): Promise<void> {
    const params = new URLSearchParams();
    if (filters.company) params.append("company", filters.company);
    if (filters.years && filters.years.length > 0) {
      filters.years.forEach((year) => params.append("years", year));
    }

    const response = await api.get(
      `/reports/yearly/export/pdf?${params.toString()}`,
      { responseType: "blob" }
    );

    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `Yearly_Report_${new Date().getTime()}.pdf`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  }

  // Broker Fee Report
  async getBrokerFeeReport(
    filters: ReportFilters
  ): Promise<AxiosResponse<ReportData>> {
    const params = new URLSearchParams();
    if (filters.company) params.append("company", filters.company);
    if (filters.startDate) params.append("startDate", filters.startDate);
    if (filters.endDate) params.append("endDate", filters.endDate);
    if (filters.page) params.append("page", filters.page.toString());
    if (filters.pageSize) params.append("pageSize", filters.pageSize.toString());

    return api.get(
      `/reports/broker-fees?${params.toString()}`
    );
  }

  async exportBrokerFeeReportExcel(filters: ReportFilters): Promise<void> {
    const params = new URLSearchParams();
    if (filters.company) params.append("company", filters.company);
    if (filters.startDate) params.append("startDate", filters.startDate);
    if (filters.endDate) params.append("endDate", filters.endDate);

    const response = await api.get(
      `/reports/broker-fees/export/excel?${params.toString()}`,
      { responseType: "blob" }
    );

    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute(
      "download",
      `Broker_Fee_Report_${new Date().getTime()}.xlsx`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  }

  async exportBrokerFeeReportPdf(filters: ReportFilters): Promise<void> {
    const params = new URLSearchParams();
    if (filters.company) params.append("company", filters.company);
    if (filters.startDate) params.append("startDate", filters.startDate);
    if (filters.endDate) params.append("endDate", filters.endDate);

    const response = await api.get(
      `/reports/broker-fees/export/pdf?${params.toString()}`,
      { responseType: "blob" }
    );

    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute(
      "download",
      `Broker_Fee_Report_${new Date().getTime()}.pdf`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  }

  // Get filter options
  async getCompanies(): Promise<AxiosResponse<{ success: boolean; data: Company[] }>> {
    return api.get(`/reports/filter/companies`);
  }

  async getYears(): Promise<AxiosResponse<{ success: boolean; data: number[] }>> {
    return api.get(`/reports/filter/years`);
  }
}

export default new ReportService();
