/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useMemo } from "react";
import MaterialTable from "@material-table/core";
import { debounce } from "lodash";
import { Search, Pencil, Trash2 } from "lucide-react";

interface AttorneysDataTableProps {
  data: any[];
  loading: boolean;
  onSearch: (query: string) => void;
  onEdit: (attorney: any) => void;
  onDelete: (id: string) => void;
}

const AttorneysDataTable = ({
  data,
  loading,
  onSearch,
  onEdit,
  onDelete,
}: AttorneysDataTableProps) => {
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
    if (!text) return "-";
    return text.charAt(0).toUpperCase() + text.slice(1);
  };

  return (
    <div className="w-full">
      {/* Search */}
      <div className="mb-4 relative w-full">
        <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
          <Search className="w-5 h-5 text-gray-400" />
        </span>
        <input
          type="text"
          placeholder="Search by attorney name / email / phone"
          value={search}
          onChange={handleSearchChange}
          className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg shadow-sm text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition"
        />
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-lg border border-gray-200 shadow-sm bg-white">
        <MaterialTable
          isLoading={loading}
          title={null}
          columns={[
            {
              title: "Sr.no",
              width: "5%",
              render: (rowData: any) => (rowData.tableData?.id ?? 0) + 1,
            },
            {
              title: "Full Name",
              field: "fullName",
              render: (rowData: any) =>
                capitalizeFirst(rowData.fullName),
            },
            {
              title: "Email",
              field: "email",
              render: (rowData: any) =>
                rowData.email || "-",
            },
            {
              title: "Phone",
              field: "phone",
              render: (rowData: any) =>
                rowData.phone || "-",
            },
            // {
            //   title: "Firm",
            //   field: "firmName",
            //   render: (rowData: any) =>
            //     rowData.firmName || "-",
            // },
            // {
            //   title: "Status",
            //   render: (rowData: any) =>
            //     rowData.isActive ? (
            //       <span className="px-2 py-0.5 bg-green-600 text-white text-sm font-semibold rounded-md">
            //         Active
            //       </span>
            //     ) : (
            //       <span className="px-2 py-0.5 bg-red-500 text-white text-sm font-semibold rounded-md">
            //         Inactive
            //       </span>
            //     ),
            // },
          ]}
          data={data}
          actions={[
            {
              icon: () => <Pencil className="w-4 h-4 text-green-600" />,
              tooltip: "Edit",
              onClick: (_: any, rowData: any) => onEdit(rowData),
            },
            {
              icon: () => <Trash2 className="w-4 h-4 text-red-600" />,
              tooltip: "Delete",
              onClick: (_: any, rowData: any) =>
                onDelete(rowData._id),
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

            headerStyle: {
              fontWeight: "600",
              backgroundColor: "#f9fafb",
              color: "#374151",
              fontSize: "13px",
              borderBottom: "1px solid #e5e7eb",
              whiteSpace: "nowrap",
            },
            maxBodyHeight: "calc(100vh - 320px)",
            minBodyHeight: "calc(100vh - 370px)",
            rowStyle: {
              fontSize: "13px",
              height: 38,
              borderBottom: "1px solid #f1f1f1",
            },

            emptyRowsWhenPaging: false,
          }}
          localization={{
            body: {
              emptyDataSourceMessage: loading
                ? "Loading attorneys..."
                : search
                ? `No results found for "${search}"`
                : "No attorneys available.",
            },
          }}
        />
      </div>
    </div>
  );
};

export default AttorneysDataTable;