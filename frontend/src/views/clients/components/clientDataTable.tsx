import React, { useState, useMemo } from "react";
import MaterialTable from "@material-table/core";
import { debounce } from "lodash";
import Button from "@mui/material/Button";
import { Search, Pencil, Trash2, Plus, User, Weight } from "lucide-react";

interface ClientsDataTableProps {
  clients: any[];
  onSearch: (query: string) => void;
  onEdit: (client: any) => void;
  onDelete: (id: string) => void;
  loading: boolean;
}

const ClientsDataTable = ({ clients, onSearch, onEdit, onDelete, loading }: ClientsDataTableProps) => {
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
    <div className="">
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

      <div className="overflow-hidden rounded-lg border-gray-300">
        {clients.length > 0 ? (
          <MaterialTable
            isLoading={loading}
            title={null}
            columns={[
              {
                title: "Sr.no",
                render: (rowData) => rowData.tableData.id + 1,
              },
              { title: "Name", field: "fullName" },
              { title: "Email", field: "email" },
              { title: "Phone", field: "phone" },
              { title: "DOB", field: "dob", type: "date" },
              { title: "Accident Date", field: "accidentDate", type: "date" },
              { title: "Attorney", field: "attorneyName" },
              { title: "SSN", field: "ssn" },
            ]}
            data={clients}
            actions={[
              {
                icon: () => <Pencil className="w-5 h-5 text-green-600" />,
                tooltip: "Edit",
                onClick: (event, rowData: any) => onEdit(rowData),
              },
              {
                icon: () => <Trash2 className="w-5 h-5 text-red-600" />,
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
          />
        ) : (
          <div className="text-center py-10">
            <div className="flex items-center justify-center mb-4 bg-gray-300 rounded-full w-20 h-20 mx-auto">
              <User className="w-16 h-16 text-green-700" />
            </div>
            <p className="text-gray-700 font-semibold mb-4">
              {search
                ? `No results found for "${search}"`
                : "No clients available. Add a new client to get started."}
            </p>

            {/* <Button
              variant="contained"
              sx={{
                backgroundColor: "#145A32",
                fontWeight: 600,
                textTransform: "none",
                borderRadius: "8px",
                padding: "8px 10px",
                fontSize: "14px",
                boxShadow: "0 3px 6px rgba(0,0,0,0.2)",
                "&:hover": {
                  backgroundColor: "#0f3f23",
                  boxShadow: "0 4px 8px rgba(0,0,0,0.3)",
                },
              }}
              startIcon={<Plus />}
              onClick={() => {
                setEditingClient(null);
                setModalOpen(true);
              }}
            >
              New Client
            </Button> */}
          </div>
        )}


      </div>
    </div>
  );
};

export default ClientsDataTable;
