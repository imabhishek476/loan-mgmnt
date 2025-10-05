import { useState, useEffect, useRef } from "react";
import { observer } from "mobx-react-lite";
import { toast } from "react-toastify";
import Button from "@mui/material/Button";
import { Plus, Save, Building2, User, Settings, Shield } from "lucide-react";
import { Dialog } from "@mui/material";
import { companyStore } from "../../store/CompanyStore";
import CompanyForm from "../../components/CompanyForm";
import type { Company } from "../../store/CompanyStore";
import CompaniesDataTable from "./components/CompaniesTable";
import { debounce } from "lodash";
import SubTabs from "../administration/components/subtab";

const Administration = observer(() => {
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("companies");
  const hasLoaded = useRef(false);

  const debouncedSearchRef = useRef(
    debounce((query: string) => {
      companyStore.searchCompanies(query);
    }, 300)
  );

  const handleOpen = (company?: Company) => {
    setEditingCompany(company || null);
    setModalOpen(true);
  };

  const handleClose = () => {
    setModalOpen(false);
    setEditingCompany(null);
  };

  const loadCompanies = async () => {
    try {
      await companyStore.fetchCompany();
    } catch {
      toast.error("Failed to fetch companies");
    }
  };

  const handleSubmit = async (data: Company) => {
    try {
      if (editingCompany) {
        await companyStore.updateCompany(editingCompany._id!, data);
        toast.success("Company updated successfully.");
      } else {
        await companyStore.createCompany(data);
        toast.success("New company added successfully.");
      }
      handleClose();
      loadCompanies();
    } catch {
      toast.error("Failed to save company");
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this company?")) return;

    try {
      setLoading(true);
      await companyStore.deleteCompany(id);
      toast.success("Company deleted successfully");
      loadCompanies();
    } catch (error) {
      toast.error("Failed to delete company");
    } finally {
      setLoading(false);
    }
  };

  const handleSearchChange = (query: string) => {
    debouncedSearchRef.current(query);
  };

  useEffect(() => {
    if (!hasLoaded.current) {
      loadCompanies();
      hasLoaded.current = true;
    }
  }, []);

  const renderContent = () => {
    switch (activeTab) {
      case "companies":
        return (
          <div className="flex flex-col rounded-lg shadow-sm">
            <div className="flex justify-between items-center mb-2">
              <h1 className="text-xl font-bold">
                Company Management
              </h1>
              <Button
                variant="contained"
                startIcon={<Plus />}
                onClick={() => handleOpen()}
                sx={{
                  backgroundColor: "#145A32",
                  fontWeight: 600,
                  textTransform: "none",
                  borderRadius: "8px",
                  padding: "8px 16px",
                  fontSize: "14px",
                  "&:hover": { backgroundColor: "#0f3f23" },
                }}
              >
                Add Company
              </Button>
            </div>

            <div className="bg-white rounded-lg shadow border border-gray-200 p-4">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-gray-700 flex items-center gap-2">
                  <Building2 size={18} /> Companies (
                  {companyStore.filteredCompanies.length})
                </h2>
              </div>

              <CompaniesDataTable
                companies={companyStore.filteredCompanies}
                onSearch={handleSearchChange}
                onEdit={handleOpen}
                onDelete={handleDelete}
                loading={companyStore.loading}
              />
            </div>
          </div>
        );

      case "users":
        return <div className="p-6 flex items-center justify-center gap-2">
          <User size={20} /> User Management (coming soon)
        </div>

      case "system":
        return <div className="p-6 flex items-center justify-center gap-2">
          <Settings size={20} /> System Config (coming soon)
        </div>;

      case "audit":
        return <div className="p-6 flex items-center justify-center gap-2">
          <Shield size={20} /> System Config (coming soon)
        </div>;

      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col bg-white transition-all duration-300">
      {/* Header */}
      <div className="mb-8 flex flex-col sm:flex-row justify-between items-center gap-4">
        <div>
          <h1 className="text-2xl text-gray-800  font-bold text-left">
            Administration
          </h1>
          <p className="text-gray-600 text-base">
            Manage companies, users, and system configuration
          </p>
        </div>
      </div>

      {/* ✅ SubTabs Navigation */}
      <SubTabs onTabChange={setActiveTab} />

      {/* ✅ Tab Content */}
      {renderContent()}

      {/* Modal Form */}
      <Dialog open={modalOpen} onClose={handleClose}>
        <CompanyForm
          initialData={editingCompany || undefined}
          onSubmit={handleSubmit}
          open={modalOpen}
          onClose={handleClose}
        />
      </Dialog>
    </div>
  );
});

export default Administration;
