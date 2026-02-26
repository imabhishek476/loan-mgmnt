import React, { useState, useMemo } from "react";
import MaterialTable from "@material-table/core";
import { debounce } from "lodash";
import { Search, Pencil, Trash2 } from "lucide-react";

interface TemplatesDataTableProps {
  data: any[];
  loading: boolean;
  onSearch: (query: string) => void;
  onEdit: (template: any) => void;
  onDelete: (id: string) => void;
}

const TemplatesDataTable = ({
  data,
  loading,
  onSearch,
  onEdit,
  onDelete,
}: TemplatesDataTableProps) => {
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
      {/* 🔎 Search */}
      <div className="mb-4 relative w-full">
        <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
          <Search className="w-5 h-5 text-gray-400" />
        </span>
        <input
          type="text"
          placeholder="Search templates..."
          value={search}
          onChange={handleSearchChange}
          className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg shadow-sm text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition"
        />
      </div>

      {/* 📋 Material Table */}
      <div className="overflow-x-auto rounded-lg border border-gray-200 shadow-sm bg-white">
        <MaterialTable
          isLoading={loading}
          title={null}
          columns={[
            {
              title: "Sr.no",
              width: "5%",
              render: (rowData: any) =>
                (rowData.tableData?.id ?? 0) + 1,
            },
            {
              title: "Title",
              field: "title",
              cellStyle: {
                padding: "6px 8px",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              },
           
            },
            {
              title: "Updated",
              render: (rowData: any) =>
                new Date(rowData.createdAt).toLocaleDateString(),
              cellStyle: {
                padding: "6px 8px",
              },
            },
          ]}
          data={data}
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
              position: "sticky",
              fontWeight: "600",
              backgroundColor: "#f9fafb",
              color: "#374151",
              fontSize: "13px",
              height: 36,
              padding: "6px 8px",
              borderBottom: "1px solid #e5e7eb",
              whiteSpace: "nowrap",
              zIndex: 30,
            },
            maxBodyHeight: "calc(100vh - 320px)",
            minBodyHeight: "calc(100vh - 370px)",
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
              emptyDataSourceMessage: loading
                ? "Loading templates..."
                : search
                ? `No results found for "${search}"`
                : "No templates available.",
            },
          }}
        />
      </div>
    </div>
  );
};

export default TemplatesDataTable;