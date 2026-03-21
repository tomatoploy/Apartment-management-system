import React, { useState, useEffect } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import ReactQuill, { Quill } from "react-quill-new";
import "react-quill-new/dist/quill.snow.css";
import { ChevronLeft, Download, Save, CheckCircle } from "lucide-react";
import { OrangeButton, ExitButton } from "../components/ActionButtons";

// --- Register Modules (อยู่นอก Component) ---
const Table = Quill.import("formats/table");
Quill.register(Table, true);

const Size = Quill.import("formats/size");
Size.whitelist = [
  "9px",
  "10px",
  "11px",
  "12px",
  "14px",
  "16px",
  "18px",
  "20px",
  "24px",
  "32px",
];
Quill.register(Size, true);

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

  // --- Configuration ---
  const modules = {
    toolbar: [
      [{ size: Size.whitelist }],
      [{ header: [1, 2, 3, false] }],
      ["bold", "italic", "underline", "strike"],
      [{ color: [] }, { background: [] }],
      [{ list: "ordered" }, { list: "bullet" }],
      [{ align: [] }],
      ["table"],
      ["clean"],
    ],
    table: true,
  };

  const formats = [
    "size",
    "header",
    "bold",
    "italic",
    "underline",
    "strike",
    "color",
    "background",
    "list",
    "align",
    "table",
  ];

  return (
    <>
      {/* Header Section */}
      <div className="print:hidden relative text-center mb-8">
        <ExitButton
          onClick={() => navigate(-1)}
          className="hidden sm:block absolute p-2 right-0 hover:bg-gray-100 rounded-full transition-colors"
        />
        <h1 className="text-3xl font-bold text-gray-800">ห้อง {roomNumber}</h1>
      </div>
      <div className="print:hidden max-w-6xl mx-auto flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-4 sm:px-0 mb-4">
        {/* ซ้าย: ปุ่มย้อนกลับ + ชื่อ */}
        <div className="flex items-center gap-2 min-w-0">
          <button
            onClick={() => navigate(-1)}
            className="hidden sm:block p-2 -ml-2 hover:bg-gray-100 rounded-full text-gray-500 shrink-0"
          >
            <ChevronLeft size={28} />
          </button>
          <h1 className="text-xl sm:text-2xl font-black text-gray-700 truncate">
            {title}
          </h1>
        </div>

        {/* ขวา: ปุ่ม */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleSaveDraft}
            className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm transition-all border-2 ${
              isSaved
                ? "bg-gray-50 text-gray-400 border-gray-100 cursor-default"
                : "bg-white text-orange-400 border-orange-300 hover:bg-orange-50"
            }`}
          >
            <Save size={18} /> บันทึกร่าง
          </button>
          <div className="flex-1 sm:flex-none">
            <OrangeButton
              label="พิมพ์เอกสาร"
              icon={Download}
              onClick={handlePrint}
              className="w-full !py-2.5 shadow-md"
            />
          </div>
        </div>
      </div>

      {/* Editor */}
      <main className="flex-1 overflow-y-auto">
        <div
          id="print-area"
          className="max-w-full mx-auto bg-white rounded-2xl border border-gray-200 overflow-hidden flex flex-col min-h-[1100px] print:border-none print:rounded-none print:shadow-none print:bg-transparent"
        >
          <ReactQuill
            theme="snow"
            value={editContent}
            onChange={handleChange}
            modules={modules}
            formats={formats}
            className="document-editor flex-1 flex flex-col"
          />
        </div>
      </main>

      {showSaveToast && (
        <div className="print:hidden fixed bottom-10 left-1/2 -translate-x-1/2 bg-gray-900 text-white px-6 py-3 rounded-2xl flex items-center gap-3 shadow-2xl z-[100]">
          <CheckCircle size={20} className="text-green-400" />
          <span className="font-bold text-sm">บันทึกข้อมูลเรียบร้อย</span>
        </div>
      )}

      <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Sarabun:wght@400;700&display=swap');

          /* แสดงผล Dropdown ขนาดฟอนต์ให้บอกตัวเลข */
          .ql-snow .ql-picker.ql-size .ql-picker-label::before,
          .ql-snow .ql-picker.ql-size .ql-picker-item::before {
            content: attr(data-value) !important;
          }
          .ql-snow .ql-picker.ql-size .ql-picker-label:not([data-value])::before {
            content: '16px' !important; 
          }

          /* ผูกคลาสขนาดฟอนต์เข้ากับขนาดจริง */
          ${Size.whitelist.map((size) => `.ql-editor .ql-size-${size} { font-size: ${size}; }`).join("\n")}

          .document-editor .ql-editor {
            padding: 5mm 15mm !important;
            min-height: 297mm;
            font-family: 'Sarabun', sans-serif;
          }

          @media print {
          /* บังคับให้ HTML และ Body ไม่มีการ Scroll และแสดงเนื้อหาทั้งหมด */
          html, body {
            height: auto !important;
            overflow: visible !important;
            position: static !important;
          }

    /* 1. ซ่อน Toolbar และ UI อื่นๆ แบบถาวร */
    .ql-toolbar.ql-snow {display: none !important; },
    .ql-toolbar,
    .print\:hidden,
    .exit-button-class,
    header, 
    nav {
      display: none !important;
      visibility: hidden !important;
      height: 0 !important;
      padding: 0 !important;
      margin: 0 !important;ƒ
      border: none !important;
    }

    /* 2. จัดการระยะขอบกระดาษ */
    @page {
      size: A4;
      margin: 0mm 10mm !important; /* กำหนดระยะขอบกระดาษจริงที่นี่ */
    }

    /* 3. ลบขอบและพื้นหลังของ Editor ออกให้หมด */
    @media print {
  /* ลบขอบ wrapper ด้วย */
  .document-editor,
  .document-editor .ql-container,
  .document-editor .ql-container.ql-snow,
  .document-editor .ql-snow,
  #print-area {
    border: none !important;
    border-radius: 0 !important;
    box-shadow: none !important;
    padding: 0 !important;
    margin: 0 !important;
    background: transparent !important;
  }

  .document-editor .ql-editor {
    padding: 0 !important;
    margin: 0 !important;
    overflow: visible !important;
    min-height: auto !important;
    background: transparent !important;
    font-family: 'Sarabun', sans-serif !important;
    top: 0 !important;
  }
}
    /* 4. เคลียร์ระยะห่างของ Body */
    body {
      background: white !important;
      margin: 0 !important;
      padding: 0 !important;
    }
  }
    main {
    display: block !important;
    overflow: visible !important;
    height: auto !important;
  }
        `}</style>
    </>
  );
};

export default DocumentPreview;
