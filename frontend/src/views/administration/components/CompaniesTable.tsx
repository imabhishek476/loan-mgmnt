import React, { useState, useMemo } from "react";
import MaterialTable from "@material-table/core";
import { debounce } from "lodash";
import { Search, Pencil, Trash2 } from "lucide-react";
import CircularProgress from "@mui/material/CircularProgress";

interface CompaniesDataTableProps {
  companies?: any[];
  onSearch: (query: string) => void;
  onEdit: (company: any) => void;
  onDelete: (id: string) => void;
  loading: boolean;
}

const CompaniesDataTable = ({
  companies = [],
  onSearch,
  onEdit,
  onDelete,
  loading,
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
      <div className="overflow-hidden rounded-lg border border-gray-200 shadow-sm bg-white">
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <CircularProgress className="text-green-700" />
            <span className="ml-3 text-gray-700 font-medium">
              Loading companies...
            </span>
          </div>
        ) : companies.length > 0 ? (
          <MaterialTable
            isLoading={loading}
            title={null}
            columns={[
              {
                title: "Sr.no",
                width: "5%",
                render: (rowData) => rowData?.tableData?.id + 1,
              },

              {
                title: "Company Name",
                field: "companyName",
                cellStyle: { padding: "6px 8px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" },
              },
              {
                title: "Code",
                field: "companyCode",
                cellStyle: { width: 100, maxWidth: 100, padding: "6px 8px", whiteSpace: "nowrap" },
              },
              {
                title: "Interest",
                render: (rowData) =>
                  rowData.interestRate
                    ? `${rowData.interestRate.monthlyRate}% (${rowData.interestRate.interestType})`
                    : "-",
                cellStyle: { width: 120, padding: "6px 8px" },
              },
              {
                title: "Admin Fee",
                render: (rowData) =>
                  rowData.fees?.administrativeFee !== undefined
                    ? `$${rowData?.fees.administrativeFee.toFixed(2)}`
                    : "$0.00",
                cellStyle: { width: 110, textAlign: "left", padding: "6px 8px" },
              },
              {
                title: "Application Fee",
                render: (rowData) =>
                  rowData.fees?.applicationFee !== undefined
                    ? `$${rowData.fees.applicationFee.toFixed(2)}`
                    : "$0.00",
                cellStyle: { width: 130, textAlign: "left", padding: "6px 8px" },
              },
              {
                title: "Status",
                render: (rowData) =>

                  rowData.activeCompany ? (
                    <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full">
                      Active
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs rounded-full">
                      Inactive
                    </span>
                  ),
                cellStyle: { width: 100, textAlign: "left", padding: "6px" },

              },
            ]}
            data={companies}
            actions={[
              {
                icon: () => <Pencil className="w-4 h-4 text-green-600" />,
                tooltip: "Edit",
                onClick: (event, rowData: any) => onEdit(rowData),
              },
              {
                icon: () => <Trash2 className="w-4 h-4 text-red-600" />,
                tooltip: "Delete",
                onClick: (event, rowData: any) => onDelete(rowData._id),
              },
            ]}
            options={{
              paging: true,
              pageSize: 5,
              pageSizeOptions: [5, 10, 20],
              sorting: true,
              search: false,
              actionsColumnIndex: -1,
              padding: "dense",
              toolbar: false,
              paginationType: "stepped",
              tableLayout: "fixed",
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
            }}
          />
        ) : (
          <div className="text-center py-10 bg-gray-50 rounded-lg">
            <p className="text-gray-700 font-semibold mb-2">
              {search
                ? `No results found for "${search}"`
                : "No companies available."}
            </p>
            <p className="text-gray-500 text-sm">
              Add a new company to get started.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CompaniesDataTable;
