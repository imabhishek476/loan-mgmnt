import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate,  } from "react-router-dom";
import { Button, Input, TextField } from "@mui/material";
import { Save, ArrowLeft, Printer, X } from "lucide-react";
import { toast } from "react-toastify";

import {
  createTemplate,
  updateTemplate,
  getTemplateById,
} from "../../../services/TemplateService";
import BundledEditor from "../../../components/BundleEditor";

const TemplateEditor = () => {
  const location = useLocation();
//   const history = useNavigate();
  const editorRef = useRef<any>(null);

  const params = new URLSearchParams(location.search);

  const mode = params.get("mode"); // add | edit | view
  const templateId = params.get("_id");

  const [title, setTitle] = useState("");
  const [htmlData, setHtmlData] = useState("");
  const [loading, setLoading] = useState(false);

  // ✅ Load template if edit/view
  useEffect(() => {
    if ((mode === "edit" || mode === "view") && templateId) {
      loadTemplate();
    }
  }, [mode, templateId]);

  const loadTemplate = async () => {
    try {
      setLoading(true);
      const res = await getTemplateById(templateId!);

      if (!res.success) {
        toast.error("Failed to load template");
        return;
      }

      setTitle(res.data.title);
      setHtmlData(res.data.htmlData);
    } catch (err) {
      toast.error("Failed to load template");
    } finally {
      setLoading(false);
    }
  };

  // ✅ Save
const handleSave = async () => {
  if (!editorRef.current) return;

  const content = editorRef.current.getContent();

  if (!title.trim()) {
    toast.error("Template title required");
    return;
  }

  if (!content.trim()) {
    toast.error("Template content required");
    return;
  }

  try {
    setLoading(true);

    let res;

    if (mode === "edit") {
      res = await updateTemplate(templateId!, {
        title,
        htmlData: content,
      });

      if (!res.success) {
        toast.error(res.message || "Update failed");
        return;
      }

      // ✅ Notify parent
      window.opener?.postMessage(
        { type: "TEMPLATE_UPDATED" },
        window.location.origin
      );

    } else {
      res = await createTemplate({
        title,
        htmlData: content,
      });

      if (!res.success) {
        toast.error(res.message || "Create failed");
        return;
      }

      // ✅ Notify parent
      window.opener?.postMessage(
        { type: "TEMPLATE_CREATED" },
        window.location.origin
      );
    }

    window.close(); // ✅ close AFTER notifying
  } catch (err) {
    toast.error("Failed to save template");
  } finally {
    setLoading(false);
  }
};
const handlePrint = () => {
  if (!editorRef.current) return;

  const editor = editorRef.current;

  const content = editor.getContent();

  const printContent = `
  <div style="text-align:center; margin-bottom:30px;">
  <h1 style="margin:0;">${title}</h1>
  <hr />
</div>
    ${content}
  `;

  const printWindow = window.open("", "_blank");

  printWindow?.document.write(`
    <html>
      <head>
        <title>${title}</title>
        <style>
          body {
            font-family: "Times New Roman", serif;
            padding: 40px;
          }
        </style>
      </head>
      <body>
        ${printContent}
      </body>
    </html>
  `);

  printWindow?.document.close();
  printWindow?.focus();
  printWindow?.print();
};
  return (
 <div className="h-screen flex flex-col bg-white">

  {/* 🔹 Top Bar */}
  <div className="bg-white border-b border-green-700 shadow-sm px-3 py-2">
    <div className="relative flex items-center justify-end py-1">

      {/* 🎯 Center Title */}
      <div className="absolute left-1/2 transform -translate-x-1/2 text-center ">
        <h2 className="text-base font-semibold text-gray-800 leading-tight ">
          {mode === "edit"
            ? "Edit Template"
            : mode === "view"
            ? "View Template"
            : "Add Template"}
        </h2>

        <p className="text-[11px] text-gray-500">
          {mode === "view"
            ? "Read-only preview"
            : "Create and design your template"}
        </p>
      </div>

      {/* 👉 Right Buttons */}
      <div className="flex items-center gap-2">

        <button
          onClick={() => window.close()}
          className="px-3 py-1 text-xs font-semibold bg-red-600 text-white 
                     rounded-md hover:bg-red-700 transition flex items-center gap-1"
        >
          <X size={14} />
          Cancel
        </button>

        <button
          onClick={handlePrint}
          className="px-3 py-1 text-xs font-semibold bg-blue-600 text-white 
                     rounded-md hover:bg-blue-700 transition flex items-center gap-1"
        >
          <Printer size={14} />
          Print
        </button>

        {mode !== "view" && (
          <button
            onClick={handleSave}
            disabled={loading}
            className="px-3 py-1 text-xs font-semibold bg-green-600 text-white 
                       rounded-md hover:bg-green-700 transition flex items-center gap-1 disabled:opacity-60"
          >
            <Save size={14} />
            {loading ? "Saving..." : "Save"}
          </button>
        )}

      </div>
    </div>
  </div>

  {/* 🔹 Content Area */}
  <div className="flex flex-col flex-1 p-0 gap-0">

    {/* 🧾 Title Field */}
    <div className="bg-white p-2 rounded-md ">
      <TextField
        fullWidth
        size="small"
        label="Template Title"
        value={title}
        disabled={mode === "view"}
        onChange={(e) => setTitle(e.target.value)}
      />
    </div>

    {/* ✍️ Editor → Fills Remaining Space */}
    <div className="bg-white rounded-lg  flex-1 overflow-hidden">

      <BundledEditor
        onInit={(evt, editor) => (editorRef.current = editor)}
        initialValue={htmlData}
        init={{
          height: "100%",   // ✅ CRITICAL FIX
          readonly: mode === "view",

          menubar: mode === "view"
            ? false
            : "file edit view insert format tools table",

          plugins: [
            "advlist", "autolink", "lists", "link", "image",
            "charmap", "preview", "anchor",
            "searchreplace", "visualblocks", "code",
            "fullscreen", "insertdatetime",
            "media", "table", "help", "wordcount", "print"
          ],

          toolbar:
            "undo redo | blocks fontfamily fontsize | " +
            "bold italic underline strikethrough | " +
            "alignleft aligncenter alignright alignjustify | " +
            "bullist numlist outdent indent | " +
            "link image media table | " +
            "charmap preview code fullscreen | " +
            "insertdatetime | print",

          content_style: `
            body {
              font-family: Times New Roman, serif;
              font-size: 12pt;
            }
          `,
        }}
      />

    </div>
  </div>
</div>
  );
};

export default TemplateEditor;