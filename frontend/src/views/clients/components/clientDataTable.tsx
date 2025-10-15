import React, { useState, useMemo, useEffect } from "react";
import MaterialTable from "@material-table/core";
import { debounce } from "lodash";
import { Search, Pencil, Trash2, User, Plus, Eye } from "lucide-react";
import CircularProgress from "@mui/material/CircularProgress";
import { loanStore } from "../../../store/LoanStore";
// import { clientStore } from "../../../store/ClientStore";
interface ClientsDataTableProps {
  clients: any[];
  onSearch: (query: string) => void;
  onEdit: (client: any) => void;
  onDelete: (id: string) => void;
  loading: boolean;
  onAddLoan: (client: any) => void;
  onViewClient: (client: any) => void;
}

const ClientsDataTable = ({ clients, onSearch, onEdit, onDelete,  onViewClient, onAddLoan,loading }: ClientsDataTableProps) => {
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
  useEffect(() => {
    loanStore.fetchLoans();
  }, []);

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

      <div className="overflow-hidden rounded-lg border border-gray-200 shadow-sm bg-white">
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <CircularProgress className="text-green-700" />
            <span className="ml-3 text-gray-700 font-medium">
              Loading clients...
            </span>
          </div>
        ) : clients.length > 0 ? (
          <MaterialTable
            isLoading={loading}
            title={null}
            columns={[
              {
                title: "Sr.no",
                render: (rowData) => rowData.tableData.id + 1,
              },
              {
                title: "Name",
                field: "fullName",
                render: (rowData) => (
                  <span
                    className="text-green-600 cursor-pointer hover:underline"
                    onClick={() => onViewClient?.(rowData)}
                  >
                    {rowData.fullName}
                  </span>
                ),
              },
              { title: "Email", field: "email" },
              { title: "Phone", field: "phone" },
              {
                title: "Active Loans",
                render: (rowData) => {
                  return loanStore.loans.filter(
                    (loan) =>
                      (loan.client === rowData._id ||
                        loan.client?._id === rowData._id) &&
                      loan.status !== "Paid Off" 
                  ).length;
                },
              },

              {
                title: "Total Paid Off",
                render: (rowData) => {
                  return loanStore.loans.filter(
                    (loan) =>
                      (loan.client === rowData._id ||
                        loan.client?._id === rowData._id) &&
                      loan.status === "Paid Off" 
                  ).length;
                },
              },
              // { title: "DOB", field: "dob", type: "date"  ,cellStyle: { width: 140, minWidth: 140 }, },
              // { title: "Accident Date", field: "accidentDate", type: "date" },
              { title: "Attorney", field: "attorneyName" },
              // { title: "SSN", field: "ssn" },
            ]}
            data={clients}
            actions={[
               {
                icon: () => <Plus className="w-5 h-5 text-emerald-600" />,
                tooltip: "Add Loan",
                //@ts-ignore
                onClick: (event, rowData: any) => onAddLoan(rowData),
          },

              {
                icon: () => <Pencil className="w-5 h-5 text-green-600" />,
                tooltip: "Edit",
                //@ts-ignore
                onClick: (event, rowData: any) => onEdit(rowData),
              },
              {
                icon: () => <Trash2 className="w-5 h-5 text-red-600" />,
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
              headerStyle: {
                fontWeight: "600",
                backgroundColor: "#f9fafb",
                color: "#374151",
                fontSize: "13px",
                height: 36,
                padding: "6px 8px",
                borderBottom: "1px solid #e5e7eb",
                whiteSpace: "nowrap",
              },
              rowStyle: {
                fontSize: "13px",
                height: 38,
                width: 38,
                borderBottom: "1px solid #f1f1f1",
                transition: "background 0.2s",
              },
              padding: "default",
              toolbar: false,
              paginationType: "stepped",
            }}
          />
        ) : (
          <div className="text-center py-10 bg-gray-200 rounded-lg">
            <div className="flex items-center justify-center mb-4 bg-gray-300 rounded-full w-20 h-20 mx-auto">
              <User className="w-16 h-16 text-green-700" />
            </div>
            <p className="text-gray-700 font-semibold mb-4">
              {search
                ? `No results found for "${search}"`
                : "No clients available. Add a new client to get started."}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ClientsDataTable;
