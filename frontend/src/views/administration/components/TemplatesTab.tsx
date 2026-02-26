import { LayoutTemplate } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@mui/material";
import { toast } from "react-toastify";
import { debounce } from "lodash";
import Confirm from "../../../components/Confirm";
import { deleteTemplate, getTemplateById, getTemplates} from "../../../services/TemplateService";
import TemplatesDataTable from "./TemplatesDataTable";

const TemplatesTab = () => {
  const [templates, setTemplates] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // ✅ Load Templates
const loadTemplates = async (search = "") => {
    setLoading(true);
    try {
      const res = await getTemplates(search);

      if (res.success === false) {
        toast.error(res.message || "Failed to load templates");
        return;
      }

      setTemplates(res.data || []);
    } catch (err: any) {
      toast.error(
        err?.response?.data?.message || "Failed to load templates"
      );
    } finally {
      setLoading(false);
    }
};
const refreshTemplates = (message: string) => {
  toast.success(message);
  loadTemplates();
};
  useEffect(() => {
    loadTemplates();
  }, []);
  useEffect(() => {
  const handleMessage = (event: MessageEvent) => {
    if (event.origin !== window.location.origin) return;

    if (event.data.type === "TEMPLATE_CREATED") {
    refreshTemplates("Template created successfully");
      loadTemplates(); // ✅ refresh table
    }

    if (event.data.type === "TEMPLATE_UPDATED") {
      refreshTemplates("Template updated successfully");
      loadTemplates(); // ✅ refresh table
    }
  };

  window.addEventListener("message", handleMessage);

  return () => {
    window.removeEventListener("message", handleMessage);
  };
}, []);

  // ✅ Add Template (NEW TAB)
const addTemplate = () => {
    const link = `/template?mode=add`;

    const newWindow = window.open(
      `${window.location.origin}/template?mode=add`,
      "_blank"
    );

    newWindow?.sessionStorage.setItem("lastVisitedPath", link);
};

const editTemplate = async (template: any) => {
  try {
    setLoading(true);

    const obj = {
      templateId: template._id,
      createdAt: new Date(),
    };

    const res = await getTemplateById(template._id);

    if (!res.success) {
      toast.error(res.message || "Failed to load template");
      return;
    }

    const params = new URLSearchParams({
      mode: "edit",
      _id: template._id,
      title: template.title,
    }).toString();

    const newWindow = window.open(
      `${window.location.origin}/template?${params}`,
      "_blank"
    );

    if (!newWindow) {
      toast.error("Popup blocked. Please allow popups.");
      return;
    }

    // ✅ Store data for editor
    newWindow.sessionStorage.setItem(
      "htmlData",
      res.data.htmlData || ""
    );

    newWindow.sessionStorage.setItem(
      "templateTitle",
      res.data.title || ""
    );

  } catch (err: any) {
    toast.error("Failed to open template");
  } finally {
    setLoading(false);
  }
};
const viewTemplate = async (template: any) => {
  try {
    setLoading(true);

    const res = await getTemplateById(template._id);

    if (!res.success) {
      toast.error(res.message || "Failed to load template");
      return;
    }

    const params = new URLSearchParams({
      mode: "view",
      _id: template._id,
      title: template.title,
    }).toString();

    const newWindow = window.open(
      `${window.location.origin}/template?${params}`,
      "_blank"
    );

    if (!newWindow) {
      toast.error("Popup blocked");
      return;
    }

    newWindow.sessionStorage.setItem(
      "htmlData",
      res.data.htmlData || ""
    );

    newWindow.sessionStorage.setItem(
      "templateTitle",
      res.data.title || ""
    );

  } catch (err) {
    toast.error("Failed to open template");
  } finally {
    setLoading(false);
  }
};

  // ✅ Delete Template
  const handleDelete = (id: string) => {
    Confirm({
      title: "Confirm Delete",
      message: "Are you sure you want to delete this template?",
      confirmText: "Yes, delete",
      onConfirm: async () => {
        try {
          const res = await deleteTemplate(id);

          if (res.success === false) {
            toast.error(res.message || "Failed to delete template");
            return;
          }

          toast.success("Template deleted successfully");
          await loadTemplates();
        } catch (err: any) {
          toast.error(
            err?.response?.data?.message ||
              "Failed to delete template"
          );
        }
      },
    });
  };

  // ✅ Debounced Search
  const debouncedSearch = useMemo(
    () =>
      debounce((query: string) => {
        loadTemplates(query);
      }, 300),
    []
  );

  const handleSearchChange = (query: string) => {
    debouncedSearch(query);
  };

  // ✅ Cleanup debounce
  useEffect(() => {
    return () => {
      debouncedSearch.cancel();
    };
  }, []);
  

  return (
    <div className="bg-white rounded-lg shadow border p-4">
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-gray-700 flex items-center gap-2">
          <LayoutTemplate size={18} />
          Templates ({templates.length})
        </h2>

        <Button
          variant="contained"
          onClick={addTemplate}
          sx={{
            backgroundColor: "#15803d",
            "&:hover": { backgroundColor: "#166534" },
            textTransform: "none",
            fontWeight: 600,
            borderRadius: 1,
          }}
        >
          Add Template
        </Button>
      </div>

      {/* Table */}
      <TemplatesDataTable
        data={templates}
        loading={loading}
        onSearch={handleSearchChange}
        onEdit={editTemplate}
        onView={viewTemplate}     // ✅ NEW
        onDelete={handleDelete}
      />
    </div>
  );
};

export default TemplatesTab;