import { useState, useEffect } from "react";
import { observer } from "mobx-react-lite";
import FormModal, { type FieldConfig } from "./FormModal";
import type { UserResponse } from "../services/UserService";
import { Switch } from "@mui/material";

const userFields: FieldConfig[] = [
  { label: "Name", key: "name", type: "text", required: true },
  { label: "Email", key: "email", type: "email", required: true },
  {
    label: "Role",
    key: "userRole",
    type: "select",
    required: true,
    options: [
      { label: "Admin", value: "admin" },
    ],
  },
  { label: "Password", key: "password", type: "password", required: false },
  // { label: "Active", key: "active", type: "toggle" },
];

interface UserFormProps {
  initialData?: UserResponse;
  onSubmit: (data: UserResponse) => Promise<void>;
  open: boolean;
  onClose: () => void;
}

function normalizeUser(data?: UserResponse) {
  if (!data) return {};
  return {
    ...data,
    active: data.active ?? true,
  };
}

function denormalizeUser(data: any): UserResponse {
  return {
    ...data,
    active: data.active ?? true,
  };
}

const UserForm = observer(
  ({ initialData, onSubmit, open, onClose }: UserFormProps) => {
    const [formData, setFormData] = useState<any>({ active: true });

    useEffect(() => {
      if (initialData) {
        setFormData(normalizeUser(initialData));
      }
    }, [initialData, open]);

    const handleSubmit = async (data: Record<string, unknown>) => {
      await onSubmit(denormalizeUser(data));
    };

    return (
      <FormModal
        open={open}
        onClose={onClose}
        title={initialData ? "Edit User" : "Add New User"}
        submitButtonText={initialData ? "Update User" : "Create User"}
        fields={userFields}
        initialData={formData}
        onSubmit={handleSubmit}
        onFormDataChange={setFormData}
        renderToggle={(key, value, onChange) => (
          <Switch
            checked={!!value}
            onChange={(e) => onChange(key, e.target.checked)}
            color="success"
          />
        )}
      />
    );
  }
);

export default UserForm;
