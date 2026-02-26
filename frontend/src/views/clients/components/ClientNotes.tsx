import { useEffect, useState, useMemo } from "react";
import { Button, Skeleton, TextField } from "@mui/material";
import {  LocalizationProvider,  DatePicker} from "@mui/x-date-pickers";
import { AdapterMoment } from "@mui/x-date-pickers/AdapterMoment";
import { StickyNote, Trash2, Pencil } from "lucide-react";
import moment from "moment";
import { toast } from "react-toastify";
import { addClientNote, deleteClientNote, fetchClientNotes, updateClientNote} from "../../../services/ClientNotesService";
import Confirm from "../../../components/Confirm";

const ClientNotes = ({
  clientId,
  clientName,
}: {
  clientId: string;
  clientName: string;
}) => {
  const [notes, setNotes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [showEditor, setShowEditor] = useState(false);
  const [text, setText] = useState("");
  const [noteDate, setNoteDate] = useState<any>(moment());
  const [editingNote, setEditingNote] = useState<any>(null);
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

  const sortedNotes = useMemo(() => {
    return [...notes].sort(
      (a, b) =>
        new Date(b.date ?? b.createdAt).getTime() -
        new Date(a.date ?? a.createdAt).getTime()
    );
  }, [notes]);

  const resetForm = () => {
    setText("");
    setNoteDate(moment());
    setEditingNote(null);
  };
  const openAddEditor = () => {
    resetForm();
    setShowEditor(true);
  };
  const openEditEditor = (note: any) => {
    setEditingNote(note);
    setText(note.text);
    setNoteDate(moment(note.date));
    setShowEditor(true);
  };
  const handleSave = async () => {
    if (!text.trim()) {
      toast.warning("Please enter note description");
      return;
    }

    try {
      setSaving(true);

      if (editingNote) {
        const updated = await updateClientNote(editingNote._id, {
          text,
          date: noteDate?.toDate(),
        });

        setNotes((prev) =>
          prev.map((n) => (n._id === editingNote._id ? updated : n))
        );

        toast.success("Note updated");
      } else {
      const newNote = await addClientNote({
        clientId,
        text,
        date: noteDate?.toDate(),
      });

        setNotes((prev) => [newNote, ...prev]);
        toast.success("Note added");
      }

      setShowEditor(false);
      resetForm();
    } catch (err: any) {
      toast.error(
        err?.response?.data?.message || "Failed to save note"
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
       Confirm({
          title: "Confirm Delete",
          message: "Are you sure you want to delete this Client Note?",
          confirmText: "Yes, Delete",
          onConfirm: async () => {
            try {
              await deleteClientNote(id);
              setNotes((prev) => prev.filter((n) => n._id !== id));
              toast.success("Client Note deleted");
            } catch (err: any) {
              toast.error(err?.response?.data?.message || "Failed to delete note");
            }
          },
        });
  };

  return (
    <div className="h-[calc(88vh-30px)] overflow-y-auto p-2 space-y-4">  
      {/* Header */}
      <div className="flex justify-end">
        <Button
          variant="contained"
          startIcon={<StickyNote size={18} />}
          onClick={openAddEditor}
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
      {showEditor && (
        <div className="bg-white border rounded-xl p-4 shadow-sm space-y-4">
          <h3 className="text-sm font-semibold text-gray-700">
            {editingNote ? "Edit Note" : `Add Note to ${clientName}`}
          </h3>

          <LocalizationProvider dateAdapter={AdapterMoment}>
            <DatePicker
              label="Date"
              value={noteDate}
              onChange={(newValue) => setNoteDate(newValue)}
              slotProps={{
                textField: { fullWidth: true, size: "small" },
              }}
            />
          </LocalizationProvider>

          <TextField
            label="Description"
            fullWidth
            multiline
            rows={3}
            value={text}
            onChange={(e) => setText(e.target.value)}
          />

          <div className="flex justify-end gap-3">
            <button
              onClick={() => {
                setShowEditor(false);
                resetForm();
              }}
               className="px-4 py-2 font-bold bg-red-600 text-white rounded-lg hover:bg-red-700 transition" 
            >
              Cancel
            </button>

            <button
              onClick={handleSave}
              disabled={saving}
              className="px-4 py-2 bg-green-700 text-white rounded-lg hover:bg-green-800"
            >
              {saving
                ? "Saving..."
                : editingNote
                ? "Update Note"
                : "Add Note"}
            </button>
          </div>
        </div>
      )}
{loading ? (
  <div className="space-y-4">
    {[1, 2, 3].map((i) => (
      <div key={i} className="flex gap-3">
        <Skeleton variant="circular" width={14} height={14} />
        <Skeleton
          variant="rounded"
          height={60}
          className="flex-1"
        />
      </div>
    ))}
  </div>
) : sortedNotes.length > 0 ? (
  <div className="relative">
    
    <div className="absolute left-[7px] top-0 bottom-0 w-[2px] bg-green-200" />

    <div className="space-y-4">
      {sortedNotes.map((note) => (
        <div key={note._id} className="flex gap-3 group">
          {/* Dot */}
          <div className="w-[14px] h-[14px] mt-2 rounded-full bg-green-600 border-2 border-white shadow-sm z-10" />
          {/* Card */}
          <div className="flex-1 bg-white border rounded-xl px-4 py-3 shadow-sm hover:shadow-md transition">
            {/* Header Row */}
            <div className="flex items-center mb-1 gap-5">
              <p className="text-xs font-semibold text-green-700">
                {moment(note.date ?? note.createdAt).format(
                  "MMM DD, YYYY"
                )}
              </p>

              <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition">
                <Pencil
                  size={15}
                  className="text-blue-600 cursor-pointer hover:text-blue-800"
                  onClick={() => openEditEditor(note)}
                />
                <Trash2
                  size={15}
                  className="text-red-600 cursor-pointer hover:text-red-800"
                  onClick={() => handleDelete(note._id)}
                />
              </div>
            </div>
            <p className="text-sm text-gray-700 leading-relaxed">
              {note.text}
            </p>
          </div>
        </div>
      ))}
    </div>
  </div>
) : (
  <div className="flex flex-col items-center justify-center py-12 text-gray-500">
            <StickyNote size={28} className="mb-2 text-gray-400" />
            <p className="text-sm font-semibold">No Notes Available</p>
            <p className="text-xs mt-1">
              You haven’t created any Notes yet.
            </p>
            <p className="text-xs text-gray-400 mt-1">
      Click "Add Note" to create one
    </p>
        </div>
      )}
    </div>
  );
};

export default ClientNotes;