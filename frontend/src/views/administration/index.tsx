import { useEffect, useMemo, useState } from "react";
import { observer } from "mobx-react-lite";
import { toast } from "react-toastify";
import Button from "@mui/material/Button";
import { User, Building2} from "lucide-react";
import { Dialog } from "@mui/material";
import { debounce } from "lodash";

import { companyStore } from "../../store/CompanyStore";
import { userStore } from "../../store/UserStore";

import SubTabs from "./components/subtab";
import CompaniesDataTable from "./components/CompaniesTable";
import UsersDataTable from "./components/UsersDataTable";
import AuditLogsTable from "./components/AuditLogsTable";
import CompanyForm from "../../components/CompanyForm";
import UserForm from "../../components/UsersForm";

import type { Company } from "../../store/CompanyStore";
import type {  UserPayload } from "../../store/UserStore";

const Administration = observer(() => {
  const [activeTab, setActiveTab] = useState<
    "companies" | "users" | "system" | "audit"
  >("companies");

  // Modals
  const [companyModalOpen, setCompanyModalOpen] = useState(false);
  const [userModalOpen, setUserModalOpen] = useState(false);

  // Editing items
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);
  // @ts-ignore
  const [editingUser, setEditingUser] = useState<User | null>(null);
  async function fetchData() {
    await companyStore.fetchCompany();
    await userStore.fetchUsers();
  }
  useEffect(() => {
    fetchData();
  }, []);
  const debouncedSearch = useMemo(
    () =>
      debounce((query: string) => {
        if (activeTab === "companies") companyStore.searchCompanies(query);
        else if (activeTab === "users") userStore.searchUsers(query);
      }, 300),
    [activeTab]
  );

  const handleSearchChange = (query: string) => debouncedSearch(query);

  // --- Company Handlers ---
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
       response = await companyStore.createCompany(data);}
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
  const handleCompanyDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this company?"))
      return;
    try {
      await companyStore.deleteCompany(id);
      toast.success("Company deleted successfully");
      await companyStore.fetchCompany();
    } catch {
      toast.error("Failed to delete company");
    }
  };
  // @ts-ignore
  const handleUserOpen = (user?: User) => {
    setEditingUser(user || null);
    setUserModalOpen(true);
  };
  const handleUserClose = () => {
    setEditingUser(null);
    setUserModalOpen(false);
  };
  const handleUserSubmit = async (data: UserPayload) => {
    try {
      if (editingUser) {
        await userStore.updateUser(editingUser._id, data);
        setActiveTab("users");
        toast.success("User updated successfully");
      } else {
        await userStore.createUser(data);
        // setActiveTab("users");
        toast.success("User added successfully");
      }
      handleUserClose();
      await userStore.fetchUsers();
    } catch (err: any) {
      console.error("Error saving user:", err);
      toast.error(err?.response?.data?.message || "Failed to save user");
    }
  };
  const handleUserDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this user?")) return;
    try {
      await userStore.deleteUser(id);
      toast.success("User deleted successfully");
      await userStore.fetchUsers();
    } catch {
      toast.error("Failed to delete user");
    }
  };

  const renderContent = () => {
    switch (activeTab) {
      case "companies":
        return (
          <div className="bg-white rounded-lg shadow border p-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-700 flex items-center gap-2">
                <Building2 size={18} /> Companies (
                {companyStore.filteredCompanies.length})
              </h2>
              <Button
                variant="contained"
                // startIcon={<Plus />}
                onClick={() => handleCompanyOpen()}
                sx={{
                  backgroundColor: "#145A32",
                  fontWeight: 600,
                  textTransform: "none",
                  borderRadius: "8px",
                }}
              >
                Add Company
              </Button>
            </div>

            <CompaniesDataTable
              companies={companyStore.filteredCompanies}
              onSearch={handleSearchChange}
              onEdit={handleCompanyOpen}
              onDelete={handleCompanyDelete}
              loading={companyStore.loading}
            />
          </div>
        );

      case "users":
        return (
          <div className="bg-white rounded-lg shadow border p-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-700 flex items-center gap-2">
                <User size={18} /> Users ({userStore.filteredUsers.length})
              </h2>
              <Button
                variant="contained"
                // startIcon={<Plus />}
                onClick={() => handleUserOpen()}
                sx={{
                  backgroundColor: "#145A32",
                  fontWeight: 600,
                  textTransform: "none",
                  borderRadius: "8px",
                }}
              >
                Add User
              </Button>
            </div>

            <UsersDataTable
              users={userStore.filteredUsers}
              onSearch={handleSearchChange}
              onEdit={handleUserOpen}
              onDelete={handleUserDelete}
              loading={userStore.loading}
            />
          </div>
        );

      // case "system":
      //   return (
      //     <div className="p-6 flex items-center gap-2">
      //       <Settings /> System Config (coming soon)
      //     </div>
      //   );

      case "audit":
        return (
          <div className="bg-white rounded-lg shadow border p-4">
            <AuditLogsTable />
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col bg-white transition-all duration-300">
      {/* Header */}
      <div className="mb-8 flex flex-col sm:flex-row justify-between items-center gap-4">
        <div>
          <h1 className="text-2xl text-gray-800 font-bold text-left">
            Administration
          </h1>
          <p className="text-gray-600 text-base text-left">
            Manage companies, users, and system configuration
          </p>
        </div>
      </div>
      {/* SubTabs Navigation */}

      <SubTabs onTabChange={setActiveTab} />
      {/* Tab Content */}
      {renderContent()}
      {/* Modal Form */}
      <Dialog open={companyModalOpen} onClose={handleCompanyClose}>
        <CompanyForm
          initialData={editingCompany || undefined}
          // @ts-ignore
          onSubmit={handleCompanySubmit}
          open={companyModalOpen}
          onClose={handleCompanyClose}
        />
      </Dialog>
      {/* User Modal */}
      <Dialog open={userModalOpen} onClose={handleUserClose}>
        <UserForm
          initialData={editingUser || undefined}
          onSubmit={handleUserSubmit}
          open={userModalOpen}
          onClose={handleUserClose}
        />
      </Dialog>
    </div>
  );
});

export default Administration;
