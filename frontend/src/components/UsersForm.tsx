import { useState, useEffect } from "react";
import { observer } from "mobx-react-lite";
import FormModal, { type FieldConfig } from "./FormModal";
import type { UserResponse } from "../services/UserService";
import { Switch, TextField, Autocomplete } from "@mui/material";

const userFields: FieldConfig[] = [
  { label: "Name", key: "name", type: "text", required: true },
  { label: "Email", key: "email", type: "email", required: true },
  {
    label: "Role",
    key: "userRole",
    type: "custom",
  },
  { label: "Password", key: "password", type: "password", required: false },
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
    userRole: data.userRole ?? "",
    password: "",
  };
}

function denormalizeUser(data: any): UserResponse {
  return {
    ...data,    
  };
}

const UserForm = observer(
  ({ initialData, onSubmit, open, onClose }: UserFormProps) => {
    const [formData, setFormData] = useState<any>({ userRole: "" });
    const [roles, setRoles] = useState<string[]>([""]);

    useEffect(() => {
      if (initialData && open) {
        setFormData(normalizeUser(initialData));
        if (initialData.userRole && !roles.includes(initialData.userRole)) {
          setRoles((prev) => [...prev, initialData.userRole]);
        }
      }
    }, [initialData, open]);

    const handleSubmit = async (data: Record<string, unknown>) => {
      await onSubmit(denormalizeUser(data));
      if (data.userRole && !roles.includes(data.userRole as string)) {
        setRoles((prev) => [...prev, data.userRole as string]);
      }
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
        // @ts-ignore
        renderField={(field, value, onChange) => {
          if (field.key === "userRole") {
            return (
              <Autocomplete
                freeSolo
                options={roles}
                value={formData.userRole || ""}
                onChange={(_, newValue) => {
                  onChange(field.key, newValue);
                }}
                onInputChange={(_, newValue) => {
                  onChange(field.key, newValue);
                }}
                renderInput={(params) => (
                  <TextField {...params} label="Role" variant="outlined" />
                )}
              />
            );
          }   
          return undefined; 
        }}
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
