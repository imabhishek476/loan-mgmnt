import React, { useState, useMemo } from "react";
import MaterialTable from "@material-table/core";
import { debounce } from "lodash";
import { Search, Pencil, Trash2 } from "lucide-react";
import { companyStore } from "../../../store/CompanyStore";

interface CompaniesDataTableProps {
  onSearch: (query: string) => void;
  onEdit: (company: any) => void;
  onDelete: (id: string) => void;
}

const CompaniesDataTable = ({
  onSearch,
  onEdit,
  onDelete,
}: CompaniesDataTableProps) => {
  const [search, setSearch] = useState("");

  const debouncedSearch = useMemo(
    () => debounce((value: string) => onSearch(value), 300),
    [onSearch]
  );

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearch(value);
    debouncedSearch(value);
  };

  const capitalizeFirst = (text?: string) => {
    if (!text) return "";
    return text.charAt(0).toUpperCase() + text.slice(1);
  };
const renderFee = (fee: any) => {
  if (!fee || fee.value == null) return "-";

  const isPercentage = fee.type === "percentage";
  const displayValue = isPercentage
    ? `${Number(fee.value).toFixed(2)}%`
    : `$${Number(fee.value).toFixed(2)}`;

  return `${displayValue} (${capitalizeFirst(fee.type)})`;
};
  return (
    <div className="w-full">
      {/* Search Input */}
      <div className="mb-4 relative w-full">
        <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
          <Search className="w-5 h-5 text-gray-400" />
        </span>
        <input
          type="text"
          placeholder="Search by company name or code"
          value={search}
          onChange={handleSearchChange}
          className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg shadow-sm text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition"
        />
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-lg border border-gray-200 shadow-sm bg-white">
        <MaterialTable
          isLoading={companyStore.loading}
          title={null}
          columns={[
            {
              title: "Sr.no",
              width: "5%",
              render: (rowData:any) => (rowData.tableData?.id ?? 0) + 1,
            },
            {
              title: "Company Name",
              field: "companyName",
              render: (rowData) => capitalizeFirst(rowData.companyName),
              cellStyle: {
                padding: "6px 8px",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              },
            },
            {
              title: "Interest",
              render: (rowData) => {
                const interest = rowData.interestRate;
                if (!interest || interest.monthlyRate == null) return "-";

                const monthlyRate = Number(interest.monthlyRate).toFixed(2);
                const interestType = capitalizeFirst(
                  interest.interestType || "-"
                );
                return `${monthlyRate}% (${interestType})`;
              },
              cellStyle: { width: 140, padding: "6px 8px" },
            },
            {
              title: "Administrative Fee",
              render: (rowData) => renderFee(rowData.fees?.administrativeFee),
              cellStyle: { width: 160, textAlign: "left", padding: "6px 8px" },
            },
            {
              title: "Application Fee",
              render: (rowData) => renderFee(rowData.fees?.applicationFee),
              cellStyle: { width: 160, textAlign: "left", padding: "6px 8px" },
            },
            {
              title: "Status",
              render: (rowData) =>
                rowData.activeCompany ? (
                  <span className="px-2 py-0.5 bg-green-600 text-white text-sm font-semibold rounded-md">
                    Active
                  </span>
                ) : (
                  <span className="px-2 py-0.5 bg-red-500 text-white text-sm font-semibold rounded-md">
                    Inactive
                  </span>
                ),
              cellStyle: { width: 100, textAlign: "left", padding: "6px" },
            },
          ]}
          data={companyStore.filteredCompanies}
          actions={[
            {
              icon: () => <Pencil className="w-4 h-4 text-green-600" />,
              tooltip: "Edit",
              //@ts-ignore
              onClick: (event, rowData: any) => onEdit(rowData),
            },
            {
              icon: () => <Trash2 className="w-4 h-4 text-red-600" />,
              tooltip: "Delete",
              //@ts-ignore
              onClick: (event, rowData: any) => onDelete(rowData._id),
            },
          ]}
          options={{
            paging: true,
            pageSize: 10,
            pageSizeOptions: [5, 10, 20],
            sorting: true,
            search: false,
            actionsColumnIndex: -1,
            padding: "dense",
            toolbar: false,
            paginationType: "stepped",
            tableLayout: "auto",
            headerStyle: {
              fontWeight: "600",
              backgroundColor: "#f9fafb",
              color: "#374151",
              fontSize: "13px",
              height: 36,
              padding: "6px 8px",
              borderBottom: "1px solid #e5e7eb",
            },
            rowStyle: {
              fontSize: "13px",
              height: 38,
              borderBottom: "1px solid #f1f1f1",
              transition: "background 0.2s",
            },
            emptyRowsWhenPaging: false,
          }}
          localization={{
            body: {
              emptyDataSourceMessage: companyStore.loading
                ? "Loading companies..."
                : search
                  ? `No results found for "${search}"`
                  : "No companies available.",
            },
          }}
        />
      </div>
    </div>
  );
};

export default CompaniesDataTable;