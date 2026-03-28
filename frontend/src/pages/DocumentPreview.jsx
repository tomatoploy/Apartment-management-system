import React, { useState, useEffect } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import ReactQuill, { Quill } from "react-quill-new";
import "react-quill-new/dist/quill.snow.css";
import { ChevronLeft, Download, Save, CheckCircle } from "lucide-react";
import { OrangeButton, ExitButton } from "../components/ActionButtons";

// ─── 🌟 แก้ไขจุด Error ตรงนี้ 🌟 ───
const SizeStyle = Quill.import('attributors/style/size');
SizeStyle.whitelist = ["9px", "10px", "11px", "12px", "14px", "16px", "18px", "20px", "24px", "32px"];
Quill.register(SizeStyle, true);

const Table = Quill.import("formats/table");
Quill.register(Table, true);

const DocumentPreview = () => {
  const { roomNumber } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const { content, title } = location.state || {};
  const [editContent, setEditContent] = useState(content || "");
  const [isSaved, setIsSaved] = useState(true);
  const [showSaveToast, setShowSaveToast] = useState(false);

  useEffect(() => {
    if (!content) navigate(`/rooms/${roomNumber}`);
  }, [content, navigate, roomNumber]);

  const handleSaveDraft = () => {
    setIsSaved(true);
    setShowSaveToast(true);
    setTimeout(() => setShowSaveToast(false), 2000);
  };

  const handleChange = (value) => {
    setEditContent(value);
    if (isSaved) setIsSaved(false);
  };

  const handlePrint = () => {
    window.print();
  };

  const modules = {
    toolbar: [
      [{ size: SizeStyle.whitelist }], // ✅ ใช้ whitelist ที่เราตั้งไว้
      [{ header: [1, 2, 3, false] }],
      ["bold", "italic", "underline", "strike"],
      [{ color: [] }, { background: [] }],
      [{ list: "ordered" }, { list: "bullet" }],
      [{ align: [] }],
      ["table", "image"],
      ["clean"],
    ],
    table: true,
    history: { delay: 500, maxStack: 100, userOnly: true }
  };

  const formats = [
    "size", "header", "bold", "italic", "underline", "strike",
    "color", "background", "list", "align", "table", "image"
  ];

  return (
    <>
      <div className="font-sarabun bg-gray-50 min-h-screen flex flex-col pb-10">
        <div className="print:hidden relative text-center pt-8 mb-4">
          <ExitButton
            onClick={() => navigate(-1)}
            className="hidden sm:block absolute p-2 right-4 top-8 hover:bg-gray-200 rounded-full transition-colors"
          />
          <h1 className="text-3xl font-black text-gray-800">ห้อง {roomNumber}</h1>
        </div>
        
        <div className="print:hidden max-w-[210mm] mx-auto w-full flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-4 sm:px-0 mb-4">
          <div className="flex items-center gap-2 min-w-0">
            <button onClick={() => navigate(-1)} className="hidden sm:block p-2 -ml-2 hover:bg-gray-200 rounded-full text-gray-500 shrink-0 transition-colors">
              <ChevronLeft size={28} />
            </button>
            <h1 className="text-xl sm:text-2xl font-black text-gray-700 truncate">{title}</h1>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleSaveDraft}
              className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm transition-all border-2 ${
                isSaved ? "bg-gray-100 text-gray-400 border-gray-200 cursor-default" : "bg-white text-orange-500 border-orange-300 hover:bg-orange-50"
              }`}
            >
              <Save size={18} /> บันทึกร่าง
            </button>
            <div className="flex-1 sm:flex-none">
              <OrangeButton label="พิมพ์เอกสาร" icon={Download} onClick={handlePrint} className="w-full !py-2.5 shadow-md" />
            </div>
          </div>
        </div>

        <main className="flex-1 overflow-visible print:hidden flex justify-center px-4">
          <div className="bg-white shadow-2xl border border-gray-300 w-[210mm] min-h-[297mm] document-editor overflow-hidden">
            <ReactQuill
              theme="snow"
              value={editContent}
              onChange={handleChange}
              modules={modules}
              formats={formats}
              className="h-full flex flex-col"
            />
          </div>
        </main>
      </div>

      <div className="hidden print:block print-area ql-editor" dangerouslySetInnerHTML={{ __html: editContent }} />

      {showSaveToast && (
        <div className="print:hidden fixed bottom-10 left-1/2 -translate-x-1/2 bg-gray-900 text-white px-6 py-3 rounded-2xl flex items-center gap-3 shadow-2xl z-[100] animate-slide-up">
          <CheckCircle size={20} className="text-green-400" />
          <span className="font-bold text-sm">บันทึกข้อมูลเรียบร้อย</span>
        </div>
      )}

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sarabun:ital,wght@0,400;0,700;1,400&display=swap');
        .font-sarabun { font-family: 'Sarabun', sans-serif; }

        /* ✅ บังคับขนาดตัวอักษรบนหน้าจอ */
        .ql-editor [style*="font-size: 9px"] { font-size: 9px !important; }
        .ql-editor [style*="font-size: 10px"] { font-size: 10px !important; }
        .ql-editor [style*="font-size: 11px"] { font-size: 11px !important; }
        .ql-editor [style*="font-size: 12px"] { font-size: 12px !important; }
        .ql-editor [style*="font-size: 14px"] { font-size: 14px !important; }
        .ql-editor [style*="font-size: 16px"] { font-size: 16px !important; }
        .ql-editor [style*="font-size: 18px"] { font-size: 18px !important; }
        .ql-editor [style*="font-size: 20px"] { font-size: 20px !important; }
        .ql-editor [style*="font-size: 24px"] { font-size: 24px !important; }
        .ql-editor [style*="font-size: 32px"] { font-size: 32px !important; }

        .document-editor .ql-editor {
          padding: 25.4mm 25.4mm !important; 
          min-height: 297mm;
          font-family: 'Sarabun', sans-serif;
          line-height: 1.5;
          color: #000;
          background-image: linear-gradient(to bottom, transparent 296mm, #cbd5e1 296mm, #cbd5e1 297mm, transparent 297mm);
          background-size: 100% 297mm;
        }

        .ql-editor img { max-width: 100%; height: auto; display: inline-block; }
        .document-editor .ql-editor table { border-collapse: collapse !important; width: 100% !important; margin: 15px 0 !important; border: 1px solid black !important; }
        .document-editor .ql-editor td, .document-editor .ql-editor th { border: 1px solid black !important; padding: 8px !important; }

        @media print {
          body * { visibility: hidden !important; }
          .print-area, .print-area * { visibility: visible !important; }
          .print-area { position: absolute; inset: 0; padding: 0 !important; font-family: 'Sarabun', sans-serif; line-height: 1.5; color: #000; }
          .print-area table { border-collapse: collapse !important; border: 1px solid #000 !important; width: 100% !important; }
          .print-area td, .print-area th { border: 1px solid #000 !important; padding: 5px !important; }
          @page { size: A4; margin: 25.4mm; }
        }
      `}</style>
    </>
  );
};

export default DocumentPreview;