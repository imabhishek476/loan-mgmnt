/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useMemo, useState } from "react";
import { userStore, type UserPayload } from "../../../store/UserStore";
import { User as UserIcon } from "lucide-react";
import { Button } from "@mui/material";
import UsersDataTable from "./UsersDataTable";
import { toast } from "react-toastify";
import { debounce } from "lodash";
import UserForm from "../../../components/UsersForm";
import { observer } from "mobx-react-lite";
import Confirm from "../../../components/Confirm";

export const UsersTab = observer(({ activeTab }: any) => {
  const [editingUser, setEditingUser] = useState<any | null>(null);
  const [userModalOpen, setUserModalOpen] = useState(false);

  const handleUserOpen = (user?: any) => {
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
        toast.success("User updated successfully");
      } else {
        await userStore.createUser(data);
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
    Confirm({
      title: "Confirm Delete",
      message: "Are you sure you want to delete this user?",
      confirmText: "Yes, delete",
      onConfirm: async () => {
        await userStore.deleteUser(id);
        await userStore.fetchUsers();
        toast.success("User deleted successfully");
      },
    });
  };
  const debouncedSearch = useMemo(
    () =>
      debounce((query: string) => {
        if (activeTab === "users") {
          userStore.searchUsers(query);
        }
      }, 300),
    [activeTab]
  );
  const fetchUsers = async () => {
    await userStore.fetchUsers();
  };
  const handleSearchChange = (query: string) => debouncedSearch(query);
  useEffect(() => {
    fetchUsers();
  }, []);
  return (
    <div className="bg-white rounded-lg shadow border p-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-gray-700 flex items-center gap-2">
          <UserIcon size={18} /> Users ({userStore.filteredUsers.length})
        </h2>
        <Button
          variant="contained"
          // startIcon={<Plus />}
          onClick={() => handleUserOpen()}
          sx={{
            backgroundColor: "#15803d",
            "&:hover": { backgroundColor: "#166534" },
            textTransform: "none",
            fontWeight: 600,
            borderRadius: 1,
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
      <UserForm
        initialData={editingUser || undefined}
        onSubmit={handleUserSubmit}
        open={userModalOpen}
        onClose={handleUserClose}
      />
    </div>
  );
});
