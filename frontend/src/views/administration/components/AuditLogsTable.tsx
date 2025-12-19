import React, { useEffect, useMemo, useRef, useState } from "react";
import MaterialTable from "@material-table/core";
import { debounce } from "lodash";
import { Search, Eye } from "lucide-react";
import {
  fetchAuditLogs,
  type AuditLog,
} from "../../../services/AuditLogService";
import moment from "moment";
import { X } from "lucide-react";

const AuditLogsTable: React.FC = () => {
  const [search, setSearch] = useState("");
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const tableRef = useRef<any>(null);
  const firstLoad = useRef(true);
  const mounted = useRef(false);
  const debouncedSearch = useMemo(
    () => debounce((value: string) => setSearch(value), 1000),
    []
  );
  const [currentPage, setCurrentPage] = useState(0);
  const [currentPageSize, setCurrentPageSize] = useState(10);
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    debouncedSearch(e.target.value);
  };

  const formatActionType = (action: string) => {
    const lower = action?.toLowerCase() || "";
   let bgColor = "bg-gray-100 text-gray-700";
    let type = "-";

    if (lower.includes("create")) {
    bgColor = "bg-green-600 text-white";
      type = "Create";
    } else if (lower.includes("update")) {
    bgColor = "bg-blue-500 text-white";
     type = "Update";
  } else if (lower.includes("deactivate") || lower.includes("inactive")) {
    bgColor = "bg-red-500 text-white";
    type = "Deactivate";
    } else if (lower.includes("activate") || lower.includes("active")) {
      bgColor = "bg-green-600 text-white";
      type = "Activate";
    } else if (lower.includes("delete")) {
    bgColor = "bg-red-600 text-white";
      type = "Delete";
  } else if (lower.includes("recover")) {
 bgColor = "bg-green-600 text-white";
    type = "Recover";
    } else if (
      lower.includes("error") ||
      lower.includes("frontend") ||
      lower.includes("exception")
    ) {
      bgColor = "bg-red-100 text-red-700 border border-red-300";
      type = "Error";
    }

    return (
      <span
        className={`px-2 py-1 rounded-md font-semibold text-xs ${bgColor}`}
      >
        {type}
      </span>
    );
  };
  // Pick relevant data based on action
  const getRelevantData = (log: AuditLog) => {
    const action = log.action?.toLowerCase();
    if (!action || !log.data) return null;

    if (action.includes("delete")) return log.data.before || log.data;
    if (action.includes("update")) return log.data.after || log.data;
    if (action.includes("create")) return log.data.after || log.data;
     if (action.includes("delete")) return log.data.before || log.data;
     if (action.includes("deactivate")) return log.data.before || log.data;
     if (action.includes("recover")) return log.data.after || log.data;
    return log.data;
  };
  // Render fields with values, nested arrays/objects indented
  const renderDataWithValues = (
    data: any,
    level = 0
  ): React.ReactElement | React.ReactElement[] => {
    if (!data) return <span>-</span>;

    return Object.entries(data).map(([key, value], index) => {
      if (Array.isArray(value)) {
        return (
          <div key={index} className={`ml-${level * 4}`}>
            {key}:
            {value.length === 0 ? (
              <span> [Empty]</span>
            ) : (
              value.map((item, i) => (
                <div
                  key={i}
                  className="ml-4 border-l border-gray-300 pl-2 mt-1 mb-1"
                >
                  {typeof item === "object"
                    ? renderDataWithValues(item, level + 1)
                    : `${item}`}
                </div>
              ))
            )}
          </div>
        );
      }

      if (typeof value === "object") {
        return (
          <div
            key={index}
            className={`ml-${
              level * 4
            } border-l border-gray-300 pl-2 mt-1 mb-1`}
          >
            {key}:{renderDataWithValues(value, level + 1)}
          </div>
        );
      }

      return (
        <div key={index} className={`ml-${level * 4} text-sm`}>
          {key}: {value?.toString() || "-"}
        </div>
      );
    });
  };


  const columns = [
    {
      title: "Sr.no",
      render: (rowData: any) =>rowData.tableData.id + 1 + currentPage * currentPageSize,
      width: "5%",
    },
    {
      title: "User",
      render: (rowData: any) =>
        rowData.userId ? `${rowData.userName}` : "-",
      cellStyle: { minWidth: 160 },
    },
    {
      title: "Role",
      render: (rowData: any) =>
        rowData.userId ? `${rowData.userRole}` : "-",
      cellStyle: { minWidth: 140 },
    },
    {
      title: "Action Type",
      render: (rowData: any) => formatActionType(rowData.action),
      cellStyle: { minWidth: 120 },
    },
    {
      title: "Action",
      render: (rowData: any) => rowData.action || "-",
      cellStyle: { minWidth: 200 },
    },
    {
      title: "Time",
      render: (rowData: any) =>
        moment(rowData.createdAt).format("DD MMM YYYY, hh:mm A"),
      cellStyle: { minWidth: 180 },
    },
  ];

  const handleView = (log: AuditLog) => setSelectedLog(log);
  useEffect(() => {
    if (!mounted.current) {
      mounted.current = true; 
      return;
    }
    if (tableRef.current) {
      tableRef.current.onQueryChange(); 
    }
  }, [search]);
  return (
    <div className="bg-white rounded-lg shadow border p-4">
      {/* Search Input */}
      <div className="mb-3 relative w-full">
        <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
          <Search className="w-5 h-5 text-gray-400" />
        </span>
        <input
          type="text"
          placeholder="Search logs by user, action..."
          className="w-full pl-10 pr-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition"
          onChange={handleSearchChange}
        />
      </div>

      <div className="overflow-hidden rounded-lg border border-gray-200 shadow-sm bg-white">
        <MaterialTable
          tableRef={tableRef}
          title={null}
          columns={columns}
          data={(query) =>
            new Promise(async (resolve, reject) => {
              try {
                setCurrentPage(query.page);
                setCurrentPageSize(query.pageSize);
                if (firstLoad.current) {
                  firstLoad.current = false;
                }
                const res = await fetchAuditLogs(
                  query.page,
                  query.pageSize,
                  search
                );
                resolve({
                  data: res.data,
                  page: query.page,
                  totalCount: res.total,
                });
              } catch (error) {
                reject(error);
              }
            })
          }
          actions={[
            {
              icon: () => <Eye className="w-5 h-5 text-blue-600" />,
              tooltip: "View Details",
              onClick: (_event, rowData) => handleView(rowData),
            },
          ]}
          options={{
            paging: true,
            pageSize: 10,
            pageSizeOptions: [5, 10, 15, 20, 50, 100, 200, 500, 1000],
            sorting: true,
            search: false,
            actionsColumnIndex: -1,
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
              right: 0,
              zIndex: 30,
            },
            maxBodyHeight: "calc(100vh - 400px)",
            minBodyHeight: "calc(100vh - 400px)",
            actionsCellStyle: {
              position: "sticky",
              right: 0,
              zIndex: 10,
              background: "#fff",
            },
            rowStyle: {
              fontSize: "13px",
              height: 38,
              borderBottom: "1px solid #f1f1f1",
              transition: "background 0.2s",
            },
            padding: "dense",
            toolbar: false,
            // paginationType: "stepped",
          }}
          localization={{
            body: {
              emptyDataSourceMessage: `${
                search
                  ? `No results found for "${search}"`
                  : "No audit logs available.."
              }`,
            },
          }}
        />
      </div>

      {/* Modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex justify-center items-start pt-10 bg-black/70 overflow-auto z-[9999]">
          <div className="bg-white rounded-lg w-full max-w-4xl shadow-lg relative mx-2 sm:mx-6 max-h-[90vh] flex flex-col transition-transform duration-300">
            <div className="flex justify-between items-center border-b px-6 py-3">
              <h2 className="text-xl font-bold text-gray-800">Log Details</h2>
              <button
                onClick={() => setSelectedLog(null)}
                title="Close"
                className="text-gray-600 hover:text-red-500 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-3 text-gray-800 text-sm ">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 justify-start">
                <p className="break-words text-left ">
                  <strong>User:</strong>{" "}
                  {selectedLog.userName
                    ? `${selectedLog.userName} (${selectedLog.userEmail})`
                    : "System"}
                </p>

                <p className="break-words text-left">
                  <strong>Action Type:</strong>{" "}
                  {formatActionType(selectedLog.action)}
                </p>

                <p className="sm:col-span-2 break-words text-left">
                  <strong>Action:</strong> {selectedLog.message}
                </p>

                <p className="sm:col-span-2 text-left">
                  <strong>Time:</strong>{" "}
                  {moment(selectedLog.createdAt).format("DD MMM YYYY, hh:mm A")}
                </p>
              </div>

              <div className="bg-gray-100 p-4 text-left rounded-md overflow-x-auto max-h-[50vh]">
                <strong>Data:</strong>
                <pre className="text-xs mt-2 whitespace-pre-wrap break-words">
                  {renderDataWithValues(getRelevantData(selectedLog))}
                </pre>
              </div>
            </div>

            <div className="flex justify-end border-t px-6 py-3">
              <button
                type="button"
                title="Close"
                onClick={() => setSelectedLog(null)}
                className="px-4 py-2 font-bold bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AuditLogsTable;
