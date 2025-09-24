import { useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  IconButton,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Checkbox,
  FormControlLabel,
} from "@mui/material";
import { X, Plus } from "lucide-react";

interface CustomField {
  id: number;
  name: string;
  value: string | number | boolean;
  type: "string" | "number" | "boolean";
}

interface AddClientModalProps {
  open: boolean;
  onClose: () => void;
}

const AddClient = ({ open, onClose }: AddClientModalProps) => {
  const [customFields, setCustomFields] = useState<CustomField[]>([]);
  const [fieldCounter, setFieldCounter] = useState(1);

  const addCustomField = () => {
    setCustomFields([
      ...customFields,
      { id: fieldCounter, name: "", value: "", type: "string" },
    ]);
    setFieldCounter(fieldCounter + 1);
  };

  const removeCustomField = (id: number) => {
    setCustomFields(customFields.filter((f) => f.id !== id));
  };

  const handleCustomFieldChange = (id: number, key: string, value: any) => {
    setCustomFields(
      customFields.map((f) => (f.id === id ? { ...f, [key]: value } : f))
    );
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="lg">
      <DialogTitle className="flex justify-between items-center">
        <span>Add New Client</span>
        <IconButton onClick={onClose} size="small">
          <X />
        </IconButton>
      </DialogTitle>
      <DialogContent dividers>
        {/* Basic Info */}
        <div className="grid grid-cols sm:grid-cols-2 gap-4 mb-2">
          <TextField label="Full Name" fullWidth />
          <TextField label="Email" fullWidth />
          <TextField label="Phone" fullWidth />
          <TextField label="SSN" fullWidth placeholder="XXX-XX-XXXX" />
          <TextField
            label="Date of Birth"
            type="date"
            InputLabelProps={{ shrink: true }}
            fullWidth
          />
          <TextField
            label="Accident Date"
            type="date"
            InputLabelProps={{ shrink: true }}
            fullWidth
          />
          <TextField label="Address" multiline rows={2} fullWidth />
          <TextField label="Attorney Name" fullWidth />
        </div>

        {/* Custom Fields */}
        <div className="mb-4">
          <h3 className="font-semibold mb-2">Custom Fields</h3>
          {customFields.map((field) => (
            <div key={field.id} className="flex gap-2 mb-2 ">
              <TextField
                label="Name"
                value={field.name}
                onChange={(e) =>
                  handleCustomFieldChange(field.id, "name", e.target.value)
                }
              />
              {field.type === "boolean" ? (
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={field.value as boolean}
                      onChange={(e) =>
                        handleCustomFieldChange(
                          field.id,
                          "value",
                          e.target.checked
                        )
                      }
                    />
                  }
                  label="Value"
                />
              ) : (
                <TextField
                  label="Value"
                  type={field.type === "number" ? "number" : "text"}
                  value={field.value as string | number}
                  onChange={(e) =>
                    handleCustomFieldChange(field.id, "value", e.target.value)
                  }
                />
              )}
              <FormControl>
                {/* <InputLabel>Type</InputLabel> */}
                <Select
                  value={field.type}
                  onChange={(e) =>
                    handleCustomFieldChange(field.id, "type", e.target.value)
                  }
                >
                  <MenuItem value="text">text</MenuItem>
                  <MenuItem value="number">number</MenuItem>
                  <MenuItem value="boolean">boolean</MenuItem>
                </Select>
              </FormControl>
              <IconButton
                onClick={() => removeCustomField(field.id)}
                color="error"
              >
                X
              </IconButton>
            </div>
          ))}

          <Button
            variant="outlined"
            startIcon={<Plus />}
            onClick={addCustomField}
            size="small"
            sx={{
              backgroundColor: "#145A32",
              "&:hover": { backgroundColor: "#0f3f23" },
              color: "white",
            }}
          >
            Add Custom Field
          </Button>
        </div>
      </DialogContent>
      <DialogActions>
        <Button
          onClick={onClose}
          sx={{
            backgroundColor: "#e73f3fff",
            "&:hover": { backgroundColor: "#792400ff" },
            color: "white",
          }}
        >
          Cancel
        </Button>
        <Button
          variant="contained"
          sx={{
            backgroundColor: "#145A32",
            "&:hover": { backgroundColor: "#0f3f23" },
          }}
        >
          Create Client
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AddClient;
