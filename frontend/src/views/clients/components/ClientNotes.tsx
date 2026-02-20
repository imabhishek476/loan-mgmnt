import { useEffect, useState } from "react";
import { Button, TextField, Dialog, DialogTitle, DialogContent, DialogActions, Skeleton} from "@mui/material";
import { LocalizationProvider, DatePicker,} from "@mui/x-date-pickers";
import { AdapterMoment } from "@mui/x-date-pickers/AdapterMoment";
import { StickyNote, Trash2, Plus, X } from "lucide-react";
import moment from "moment";
import { toast } from "react-toastify";
import { addClientNote, deleteClientNote, fetchClientNotes,} from "../../../services/ClientNotesService";
import { Notes } from "@mui/icons-material";

const ClientNotes = ({
  clientId,
  clientName,
}: {
  clientId: string;
  clientName: string;
}) => {
  const [notes, setNotes] = useState<any[]>([]);
  const [text, setText] = useState("");
  const [noteDate, setNoteDate] = useState<any>(moment());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [openModal, setOpenModal] = useState(false);

  const loadNotes = async () => {
    try {
      setLoading(true);
      const data = await fetchClientNotes(clientId);
      setNotes(data);
    } catch {
      toast.error("Failed to load notes");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (clientId) loadNotes();
  }, [clientId]);

  const handleAdd = async () => {
    if (!text.trim()) {
      toast.warning("Please enter note description");
      return;
    }

    try {
      setSaving(true);

      const newNote = await addClientNote({
        clientId,
        text,
        date: noteDate?.toDate(),
      } as any);

      setNotes((prev) => [newNote, ...prev]);
      setText("");
      loadNotes();
      toast.success("Note added");
      setOpenModal(false);
    } catch (err: any) {
      toast.error(
        err?.response?.data?.message || "Failed to add note"
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteClientNote(id);
      setNotes((prev) => prev.filter((n) => n._id !== id));
      toast.success("Note deleted");
    } catch {
      toast.error("Failed to delete note");
    }
  };

  return (
    <div className="h-[calc(88vh-30px)] overflow-y-auto p-2 space-y-4">
      {/* Header */}
      <div className="flex justify-end">

        <Button
            variant="contained"
                startIcon={<StickyNote />}
          onClick={() => setOpenModal(true)}
         sx={{
                  backgroundColor: "#15803d",
                  "&:hover": { backgroundColor: "#166534" },
                  textTransform: "none",
                  fontWeight: 600,
                  borderRadius: "6px",
                  boxShadow: "none",
                }}
        >
          Add Note
        </Button>
      </div>

      {/* Loading */}
      {loading ? (
        <div className="space-y-3">
          <Skeleton variant="rectangular" height={50} />
          <Skeleton variant="rectangular" height={50} />
        </div>
      ) : notes.length > 0 ? (
        <div className="border-l-2 border-green-600 ml-3 space-y-5">
          {notes.map((note) => (
            <div key={note._id} className="ml-4 relative">
              <span className="absolute -left-[22px] top-1.5 w-3 h-3 bg-green-600 rounded-full border-2 border-white shadow" />

              <p className="text-xs font-semibold text-green-700">
                {moment(note.date || note.createdAt).format(
                  "MMM DD, YYYY"
                )}
              </p>

              <p className="text-sm text-gray-700">
                {note.text}
              </p>

              <Trash2
                size={14}
                className="text-red-600 cursor-pointer mt-1 hover:text-red-800"
                onClick={() => handleDelete(note._id)}
              />
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center py-10 text-gray-500">
          <StickyNote size={26} className="text-gray-400 mb-2" />
          <p className="text-sm font-semibold">No Notes Found</p>
        </div>
      )}

     <Dialog
  open={openModal}
  onClose={() => setOpenModal(false)}
  fullWidth
  maxWidth="sm"
>
  {/* Header */}
  <DialogTitle>
    <div className="flex justify-between items-start">
      <div>
        <h2 style={{ fontWeight: 600 }}>Add Note</h2>
        <p style={{ fontSize: 14, color: "#6b7280", marginTop: 4 }}>
          Add a new note for{" "}
          <span style={{ fontWeight: 600 }}>
            {clientName}
          </span>
        </p>
      </div>

      <X
        size={18}
        className="cursor-pointer"
        onClick={() => setOpenModal(false)}
      />
    </div>
  </DialogTitle>

  {/* Divider */}
  <div style={{ borderTop: "1px solid #e5e7eb" }} />

  {/* Content */}
  <DialogContent sx={{ mt: 0}}>
    <LocalizationProvider dateAdapter={AdapterMoment}>
      <DatePicker
        label="Date"
        value={noteDate}
        onChange={(newValue) => setNoteDate(newValue)}
        slotProps={{
          textField: {
            fullWidth: true,
            size: "small",
            margin: "normal",
          },
        }}
      />
    </LocalizationProvider>

    <TextField
      label="Description"
      fullWidth
      multiline
      rows={4}
      margin="normal"
      placeholder="Enter note description..."
      value={text}
      onChange={(e) => setText(e.target.value)}
    />
  </DialogContent>

  {/* Actions */}
  <DialogActions sx={{ px: 3, pb: 2 }}>
    <button  className="px-4 py-2 font-bold bg-red-600 text-white rounded-lg hover:bg-red-700 transition" onClick={() => setOpenModal(false)}>
      Cancel
    </button>

    <button
      onClick={handleAdd}
      disabled={saving}
       title="Add Note"
                className="px-4 py-2 font-bold bg-green-600 text-white rounded-lg hover:bg-green-700 transition flex items-center gap-2"
    >
      {saving ? "Saving..." : "Save Note"}
    </button>
  </DialogActions>
</Dialog>
    </div>
  );
};

export default ClientNotes;