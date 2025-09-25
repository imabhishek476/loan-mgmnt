import React, { useState, useMemo } from "react";
import MaterialTable from "@material-table/core";
import { debounce } from "lodash";
import { Search } from "lucide-react";

interface ClientsDataTableProps {
  clients: any[];
  onSearch: (query: string) => void;
  loading: boolean;
}

const ClientsDataTable = ({ clients, onSearch, loading }: ClientsDataTableProps) => {
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
    <div className="p-5 rounded-lg border border-gray-300">
      <div className="mb-3 relative w-full">
        <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
          <Search className="w-5 h-5 text-gray-400" />
        </span>
        <input
          type="text"
          placeholder="Search clients..."
          value={search}
          onChange={handleSearchChange}
          className="w-full pl-10 pr-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition"
        />
      </div>

      <div className="overflow-hidden rounded-lg border border-gray-300">
        <MaterialTable
          isLoading={loading}
          title={null}
          columns={[
            {
              title: "Sr.no",
              render: (rowData) => rowData.tableData.id + 1,
              cellStyle: { textAlign: "center", borderRadius: "8px" },
              headerStyle: { textAlign: "center", borderRadius: "8px" }
            },
            { title: "Name", field: "fullName", cellStyle: { borderRadius: "8px" }, headerStyle: { borderRadius: "8px" } },
            { title: "Email", field: "email", cellStyle: { borderRadius: "8px" }, headerStyle: { borderRadius: "8px" } },
            { title: "Phone", field: "phone", cellStyle: { borderRadius: "8px" }, headerStyle: { borderRadius: "8px" } },
            { title: "DOB", field: "dob", type: "date", cellStyle: { borderRadius: "8px" }, headerStyle: { borderRadius: "8px" } },
            { title: "Accident Date", field: "accidentDate", type: "date", cellStyle: { borderRadius: "8px" }, headerStyle: { borderRadius: "8px" } },
            { title: "Attorney", field: "attorneyName", cellStyle: { borderRadius: "8px" }, headerStyle: { borderRadius: "8px" } },
            { title: "SSN", field: "ssn", cellStyle: { borderRadius: "8px" }, headerStyle: { borderRadius: "8px" } },
          ]}
          data={clients}
          options={{
            paging: true,
            pageSize: 5,
            pageSizeOptions: [5, 10, 20],
            sorting: true,
            search: false,
            actionsColumnIndex: -1,
            headerStyle: {
              fontWeight: "bold",
              backgroundColor: "#ffffff",
              fontSize: "14px",
              height: 40,
              borderBottom: "1px solid #d1d5db",
            },
            rowStyle: (rowData, index) => ({
              fontSize: "16px",
              height: 45,
              borderBottom: "1px solid #d1d5db",
            }),
            padding: "dense",
            toolbar: false,
            paginationType: "stepped",
          }}
          localization={{
            body: {
              emptyDataSourceMessage: search
                ? `No results found for "${search}"`
                : "No clients available. Add a new client to get started.",
            },
          }}
        />
      </div>
    </div>
  );
};

export default ClientsDataTable;
