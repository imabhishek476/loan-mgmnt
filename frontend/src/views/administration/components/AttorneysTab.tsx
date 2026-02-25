
import { Scale } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Button} from "@mui/material";
import { toast } from "react-toastify";
import { debounce } from "lodash";

import AttorneysDataTable from "./AttorneysTable";
import Confirm from "../../../components/Confirm";

import { createAttorney, updateAttorney, deleteAttorney, getAttorney} from "../../../services/AttorneyServices";
import AttorneyForm from "./AttorneyForm";

const AttorneysTab = () => {
  const [attorneys, setAttorneys] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const [editingAttorney, setEditingAttorney] = useState<any>(null);
  const [attorneyModalOpen, setAttorneyModalOpen] = useState(false);

  const loadAttorneys = async (search = "") => {
    setLoading(true);
    try {
      const res = await getAttorney(search);

      if (res.success === false) {
        toast.error(res.message || "Failed to load attorneys");
        return;
      }

      setAttorneys(res.data || []);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to load attorneys");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAttorneys();
  }, []);

  const handleAttorneyOpen = (attorney?: any) => {
    setEditingAttorney(attorney || null);
    setAttorneyModalOpen(true);
  };

  const handleAttorneyClose = () => {
    setEditingAttorney(null);
    setAttorneyModalOpen(false);
  };

  const handleAttorneySubmit = async (data: any) => {
    try {
      let response;

      if (editingAttorney) {
        response = await updateAttorney(editingAttorney._id, data);
      } else {
        response = await createAttorney(data);
      }

      if (response?.success === false) {
        toast.error(response?.message || "Failed to save attorney");
        return;
      }

      toast.success(
        `Attorney ${editingAttorney ? "updated" : "added"} successfully`
      );

      handleAttorneyClose();
      await loadAttorneys();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to save attorney");
    }
  };

  const handleAttorneyDelete = (id: string) => {
    Confirm({
      title: "Confirm Delete",
      message: "Are you sure you want to delete this attorney?",
      confirmText: "Yes, delete",
      onConfirm: async () => {
        try {
          const res = await deleteAttorney(id);

          if (res.success === false) {
            toast.error(res.message || "Failed to delete attorney");
            return;
          }

          toast.success("Attorney deleted successfully");
          await loadAttorneys();
        } catch (err: any) {
          toast.error(
            err?.response?.data?.message || "Failed to delete attorney"
          );
        }
      },
    });
  };
  const debouncedSearch = useMemo(
    () =>
      debounce((query: string) => {
        loadAttorneys(query);
      }, 300),
    []
  );

  const handleSearchChange = (query: string) => {
    debouncedSearch(query);
  };

  return (
    <div className="bg-white rounded-lg shadow border p-4">
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-gray-700 flex items-center gap-2">
          <Scale size={18} />
          Attorneys ({attorneys.length})
        </h2>

        <Button
          variant="contained"
          title="Add Attorney"
          onClick={() => handleAttorneyOpen()}
          sx={{
            backgroundColor: "#15803d",
            "&:hover": { backgroundColor: "#166534" },
            textTransform: "none",
            fontWeight: 600,
            borderRadius: 1,
          }}
        >
          Add Attorney
        </Button>
      </div>

      {/* Table */}
      <AttorneysDataTable
        data={attorneys}
        loading={loading}
        onSearch={handleSearchChange}
        onEdit={handleAttorneyOpen}
        onDelete={handleAttorneyDelete}
      />

      {/* Modal */}
    {attorneyModalOpen && (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
        <AttorneyForm
        initialData={editingAttorney}
        onSubmit={handleAttorneySubmit}
        onClose={handleAttorneyClose}
        />
    </div>
    )}
    </div>
  );
};

export default AttorneysTab;