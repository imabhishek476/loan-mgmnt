/* eslint-disable @typescript-eslint/no-explicit-any */
import { Building2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { companyStore, type Company } from "../../../store/CompanyStore";
import { Button, Dialog } from "@mui/material";
import CompaniesDataTable from "./CompaniesTable";
import { toast } from "react-toastify";
import CompanyForm from "../../../components/CompanyForm";
import { debounce } from "lodash";
import { observer } from "mobx-react-lite";
import Confirm from "../../../components/Confirm";

export const CompaniesTab = observer(({ activeTab }: any) => {
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);
  const [companyModalOpen, setCompanyModalOpen] = useState(false);

  const handleCompanyOpen = (company?: Company) => {
    setEditingCompany(company || null);
    setCompanyModalOpen(true);
  };
  const handleCompanyClose = () => {
    setEditingCompany(null);
    setCompanyModalOpen(false);
  };
  const handleCompanySubmit = async (data: Company) => {
    try {
      let response;
      if (editingCompany) {
        response = await companyStore.updateCompany(editingCompany._id!, data);
      } else {
        response = await companyStore.createCompany(data);
      }
      if (response?.success === false) {
        toast.error(response?.message || "Failed to save company");
        return;
      }
      toast.success(
        `Company ${editingCompany ? "updated" : "added"} successfully`
      );
      handleCompanyClose();
      await companyStore.fetchCompany();
    } catch (err: any) {
      console.error("Error saving company:", err);
      const errorMessage =
        err?.response?.data?.message || "Failed to save company";
      toast.error(errorMessage);
      return { success: false };
    }
  };

    const handleCompanyDelete = (id: string) => {
      Confirm({
        title: "Confirm Delete",
        message: "Are you sure you want to delete this company?",
        confirmText: "Yes, delete",
        onConfirm: async () => {
          await companyStore.deleteCompany(id);
          await companyStore.fetchCompany();
          toast.success("Company deleted successfully");
        },
      });
  };
  const debouncedSearch = useMemo(
    () =>
      debounce((query: string) => {
        if (activeTab === "companies") {

          companyStore.searchCompanies(query);
        }
      }, 300),
    [activeTab]
  );
  const fetchCompanies = async () => {
    await companyStore.fetchCompany();
  };
  const handleSearchChange = (query: string) => debouncedSearch(query);
  useEffect(() => {
    fetchCompanies();
  }, []);
  return (
    <div className="bg-white rounded-lg shadow border p-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-gray-700 flex items-center gap-2">
          <Building2 size={18} /> Companies (
          {companyStore.filteredCompanies.length})
        </h2>
        <Button
          variant="contained"
          onClick={() => handleCompanyOpen()}
          sx={{
            backgroundColor: "#15803d",
            "&:hover": { backgroundColor: "#166534" },
            textTransform: "none",
            fontWeight: 600,
            borderRadius: 1,
          }}
        >
          Add Company
        </Button>
      </div>
      <CompaniesDataTable
        onSearch={handleSearchChange}
        onEdit={handleCompanyOpen}
        onDelete={handleCompanyDelete}
      />
      <Dialog open={companyModalOpen} onClose={handleCompanyClose}>
        <CompanyForm
          initialData={editingCompany || undefined}
          onSubmit={handleCompanySubmit}
          open={companyModalOpen}
          onClose={handleCompanyClose}
        />
      </Dialog>
    </div>
  );
});
