import React, { useEffect, useMemo, useState } from "react";
import MaterialTable from "@material-table/core";
import { debounce } from "lodash";
import { Search, FileText, Eye } from "lucide-react";
import CircularProgress from "@mui/material/CircularProgress";
import { toast } from "react-toastify";
import { fetchAuditLogs, type AuditLog } from "../../../services/AuditLogService";
import moment from "moment";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  IconButton,
} from "@mui/material";
import { X } from "lucide-react";

const AuditLogsTable: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  useEffect(() => {
    const loadLogs = async () => {
      setLoading(true);
      try {
        const data = await fetchAuditLogs();
        setLogs(data || []);
      } catch (err) {
        console.error(err);
        toast.error("Failed to fetch audit logs");
      } finally {
        setLoading(false);
      }
    };
    loadLogs();
  }, []);

  const debouncedSearch = useMemo(
    () => debounce((value: string) => setSearch(value), 300),
    []
  );

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    debouncedSearch(e.target.value);
  };

  const formatActionType = (action: string) => {
    const lower = action?.toLowerCase() || "";
    let color = "text-gray-700";
    let bgColor = "bg-gray-200";
    let type = "";

    if (lower.includes("create")) {
      type = "Create";
      color = "text-green-700";
      bgColor = "bg-green-100";
    } else if (lower.includes("update")) {
      type = "Update";
      color = "text-blue-700";
      bgColor = "bg-blue-100";
    } else if (lower.includes("delete")) {
      type = "Delete";
      color = "text-red-700";
      bgColor = "bg-red-100";
    }

    return (
      <span
        className={`px-2 py-1 rounded-lg font-semibold ${bgColor} ${color}`}
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
  const filteredLogs = useMemo(() => {
    const lowerSearch = search.toLowerCase();
    return logs.filter((log) => {
      const act = log.action?.toLowerCase() || "";
      const isActionType = ["create", "update", "delete"].some((a) =>
        act.includes(a)
      );
      if (!isActionType) return false;

      return (
        log.entity?.toLowerCase().includes(lowerSearch) ||
        log.userId?.name?.toLowerCase().includes(lowerSearch) ||
        log.userId?.email?.toLowerCase().includes(lowerSearch) ||
        act.includes(lowerSearch)
      );
    });
  }, [logs, search]);

  const columns = [
    {
      title: "Sr.no",
      render: (rowData: any) => rowData.tableData.id + 1,
      width: "5%",
    },
    {
      title: "User",
      render: (rowData: any) =>
        rowData.userId ? `${rowData.userId.name}` : "-",
      cellStyle: { minWidth: 160 },
    },
    {
      title: "Role",
      render: (rowData: any) =>
        rowData.userId ? `${rowData.userId.userRole}` : "-",
      cellStyle: { minWidth: 140 },
    },
    {
      title: "Action Type",
      render: (rowData: any) => formatActionType(rowData.action),
      cellStyle: { minWidth: 120 },
    },
    {
      title: "Action",
      render: (rowData: any) => rowData.message || "-",
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

  return (
    <div>
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
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <CircularProgress className="text-green-700" />
            <span className="ml-3 text-gray-700 font-medium">
              Loading audit logs...
            </span>
          </div>
        ) : filteredLogs.length > 0 ? (
          <MaterialTable
            title={null}
            columns={columns}
            data={filteredLogs}
            actions={[
              {
                icon: () => <Eye className="w-5 h-5 text-blue-600" />,
                tooltip: "View Details",
                //@ts-ignore
                onClick: (event, rowData) => handleView(rowData),
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
                fontWeight: 600,
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
              padding: "dense",
              toolbar: false,
              paginationType: "stepped",
            }}
          />
        ) : (
          <div className="text-center py-10 bg-gray-200 rounded-lg">
            <div className="flex items-center justify-center mb-4 bg-gray-300 rounded-full w-20 h-20 mx-auto">
              <FileText className="w-12 h-12 text-green-700" />
            </div>
            <p className="text-gray-700 font-semibold mb-4">
              {search
                ? `No results found for "${search}"`
                : "No audit logs available."}
            </p>
          </div>
        )}
      </div>

      {/* Modal */}
      <Dialog
        open={!!selectedLog}
        onClose={() => setSelectedLog(null)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle className="flex justify-between  items-center">
          Log Details
          <IconButton onClick={() => setSelectedLog(null)}>
            <X className="w-5 h-5 text-gray-600 hover:text-red-500" />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers className="p-6">
          {selectedLog && (
            <div className="grid grid-cols- sm:grid-cols-2 gap-2 text-gray-800 text-sm">
              <p>
                <strong>User:</strong>{" "}
                {selectedLog.userId
                  ? `${selectedLog.userId.name} (${selectedLog.userId.email})`
                  : "System"}
              </p>
              <p>
                <strong>Action Type:</strong>{" "}
                {formatActionType(selectedLog.action)}
              </p>
              <p className="sm:col-span-2">
                <strong>Action:</strong> {selectedLog.message}
              </p>
              <p className="sm:col-span-2">
                <strong>Time:</strong>{" "}
                {moment(selectedLog.createdAt).format("DD MMM YYYY, hh:mm A")}
              </p>
              <div className="sm:col-span-2 bg-gray-200 p-4 rounded-md">
                <strong>Data:</strong>
                <pre className="text-xs mt-2">
                  {renderDataWithValues(getRelevantData(selectedLog))}
                </pre>
              </div>
            </div>
          )}
        </DialogContent>
        <DialogActions className="px-6 pb-4">
          <Button
            onClick={() => setSelectedLog(null)}
            variant="contained"
            color="success"
            className="rounded-lg shadow-sm px-5 font-bold"
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default AuditLogsTable;
