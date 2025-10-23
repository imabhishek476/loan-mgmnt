import React, { useState, useMemo, useEffect } from "react";
import MaterialTable from "@material-table/core";
import { debounce } from "lodash";
import { Search, Pencil, Trash2 } from "lucide-react";

interface User {
  _id: string;
  name: string;
  email: string;
  userRole: string;
}

interface UsersDataTableProps {
  users?: User[];
  onSearch: (query: string) => void;
  onEdit: (user: User) => void;
  onDelete: (id: string) => void;
  loading: boolean;
}

const UsersDataTable = ({
  users = [],
  onSearch,
  onEdit,
  onDelete,
  loading,
}: UsersDataTableProps) => {
  const [search, setSearch] = useState("");

  const debouncedSearch = useMemo(
    () => debounce((value: string) => onSearch(value), 300),
    [onSearch]
  );

  useEffect(() => {
    return () => {
      debouncedSearch.cancel();
    };
  }, [debouncedSearch]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearch(value);
    debouncedSearch(value);
  };

  const capitalizeFirst = (text?: string) => {
    if (!text) return "";
    return text.charAt(0).toUpperCase() + text.slice(1);
  };

  return (
    <div className="w-full">
      {/* 🔍 Search */}
      <div className="mb-4 relative w-full">
        <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
          <Search className="w-5 h-5 text-gray-400" />
        </span>
        <input
          type="text"
          placeholder="Search by name or email"
          value={search}
          onChange={handleSearchChange}
          className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg shadow-sm text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition"
        />
      </div>

      {/* 📊 Table */}
      <div className="overflow-x-auto rounded-lg border border-gray-200 shadow-sm bg-white">
        <MaterialTable
          isLoading={loading}
          title={null}
          columns={[
            {
              title: "Sr.no",
              width: "5%",
              //@ts-ignore
              render: (rowData) => (rowData.tableData?.id ?? 0) + 1,
            },
            {
              title: "Name",
              field: "name",
              render: (rowData) => capitalizeFirst(rowData.name),
            },
            {
              title: "Email",
              field: "email",
            },
            {
              title: "Role",
              field: "userRole",
              render: (rowData) => capitalizeFirst(rowData.userRole),
            },
          ]}
          data={users}
          actions={[
            {
              icon: () => <Pencil className="w-4 h-4 text-green-600" />,
              tooltip: "Edit",
              //@ts-ignore
              onClick: (event, rowData) => onEdit(rowData as User),
            },
            {
              icon: () => <Trash2 className="w-4 h-4 text-red-600" />,
              tooltip: "Delete",
              //@ts-ignore
              onClick: (event, rowData) => onDelete((rowData as User)._id),
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
            },
            emptyRowsWhenPaging: false,
          }}
          localization={{
            body: {
              emptyDataSourceMessage: loading
                ? "Loading users..."
                : search
                ? `No results found for "${search}"`
                : "No users available.",
            },
          }}
        />
      </div>
    </div>
  );
};

export default UsersDataTable;
