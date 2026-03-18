import React, { useState, useEffect } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import ReactQuill from "react-quill-new";
import "react-quill-new/dist/quill.snow.css";
import {
  ChevronLeft,
  Download,
  Save,
  CheckCircle,
  FileText,
} from "lucide-react";
import {
  OrangeButton,
  ExitButton,
  WhiteButton,
} from "../components/ActionButtons";
import html2pdf from "html2pdf.js";
import RoomHeader from "../components/RoomHeader";

const DocumentPreview = () => {
  const { roomNumber } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  // รับข้อมูลจากหน้า RoomDetail
  const { content, title } = location.state || {};

  const [editContent, setEditContent] = useState(content || "");
  const [isSaved, setIsSaved] = useState(true); // เช็คว่าบันทึกหรือยัง
  const [showSaveToast, setShowSaveToast] = useState(false);

  useEffect(() => {
    if (!content) {
      navigate(`/rooms/${roomNumber}`);
    }
  }, [content, navigate, roomNumber]);

  // ฟังก์ชันบันทึกร่าง (Save Draft)
  const handleSaveDraft = () => {
    console.log("Saving draft to database/localStorage...", editContent);
    // ตรงนี้สามารถยิง API ไปเซฟที่ Backend ได้

    setIsSaved(true);
    setShowSaveToast(true);
    setTimeout(() => setShowSaveToast(false), 2000); // หายไปใน 2 วินาที
  };

  // ฟังก์ชันดาวน์โหลด PDF
  const handleDownloadPDF = () => {
    const element = document.querySelector(".ql-editor");
    const opt = {
      margin: 15,
      filename: `${title}_ห้อง${roomNumber}.pdf`,
      image: { type: "jpeg", quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, letterRendering: true },
      jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
    };

    html2pdf().set(opt).from(element).save();
  };

  // เมื่อมีการพิมพ์ ให้เปลี่ยนสถานะเป็นยังไม่ได้เซฟ
  const handleChange = (value) => {
    setEditContent(value);
    if (isSaved) setIsSaved(false);
  };

  const handlePrint = () => {
    window.print(); // สั่งพิมพ์ผ่าน Browser โดยตรง
  };

  //-- tool bar เพิ่มเติมของ ReactQuill
  const modules = {
    toolbar: [
      [{ header: [1, 2, 3, false] }],
      ["bold", "italic", "underline", "strike"],
      [{ color: [] }, { background: [] }],
      [{ list: "ordered" }, { list: "bullet" }],
      [{ align: [] }],
      ["clean"],
    ],
  };

  const formats = [
    "header",
    "bold",
    "italic",
    "underline",
    "strike",
    "color",
    "background",
    "list",
    "bullet",
    "align",
  ];

  return (
    <>
      <div className="relative text-center mb-8">
        <ExitButton
          onClick={() => navigate(-1)}
          className="absolute p-2 right-0 hover:bg-gray-100 rounded-full transition-colors"
        ></ExitButton>
        <h1 className="text-3xl font-bold text-gray-800">ห้อง {roomNumber}</h1>
      </div>

      <div className="prose prose-orange max-w-none mx-auto px-4 sm:px-0 space-y-6 mt-2">
        {/* Top Navigation */}
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate(-1)}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-500"
            >
              <ChevronLeft size={24} />
            </button>
            <div>
              <h1 className="text-2xl font-black text-gray-700">{title}</h1>
            </div>
          </div>

          <div className="print:hidden flex items-center gap-3">
            {/* ปุ่มบันทึกร่าง */}
            <button
              onClick={handleSaveDraft}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all ${
                isSaved
                  ? "bg-gray-100 text-gray-400 cursor-default"
                  : "bg-white text-orange-400 hover:bg-orange-100 border-2 border-orange-300 "
              }`}
            >
              <Save size={18} />
              บันทึกร่าง
            </button>

            {/* ปุ่มดาวน์โหลด */}
            <OrangeButton
              label="ดาวน์โหลด PDF"
              icon={Download}
              //onClick={handleDownloadPDF}
              onClick={handlePrint}
              modules={modules}
              formats={formats}
              className="document-editor"
            />
          </div>
        </div>

        {/* Editor Workspace */}
        <main className="flex-1 overflow-y-auto ">
          <div className="max-w-full mx-auto bg-white rounded-2xl border border-gray-200 overflow-hidden flex flex-col min-h-[1100px]">
            <ReactQuill
              theme="snow"
              value={editContent}
              onChange={handleChange}
              className="document-editor flex-1 flex flex-col"
            />
          </div>
        </main>

        {/* Save Notification Toast */}
        {showSaveToast && (
          <div className="fixed bottom-10 left-1/2 -translate-x-1/2 bg-gray-900 text-white px-6 py-3 rounded-2xl flex items-center gap-3 shadow-2xl animate-in fade-in slide-in-from-bottom-5 duration-300 z-[100]">
            <CheckCircle size={20} className="text-green-400" />
            <span className="font-bold text-sm">บันทึกข้อมูลเรียบร้อย</span>
          </div>
        )}

        {/* Custom Styles สำหรับจำลองหน้ากระดาษ A4 */}
        <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sarabun:wght@400;700&display=swap');
        
        /* โหมดหน้าจอ: จำลองเป็นกระดาษ A4 */
        @media screen {
          .document-container {
            width: 210mm;
            min-height: 297mm;
            background: white;
            box-shadow: 0 4px 20px rgba(0,0,0,0.08);
            border-radius: 8px;
            overflow: hidden;
          }
          .document-editor .ql-container {
            border: none !important;
            font-family: 'Sarabun', sans-serif;
          }
          .document-editor .ql-editor {
            padding: 25mm 25mm !important; /* Margin กระดาษ */
            min-height: 297mm;
            font-size: 16px;
          }
        }

        /* โหมดพิมพ์: จัดการให้เหลือแค่เนื้อหา */
        @media print {
          @page {
            size: A4;
            margin: 20mm;
          }
          .print\:hidden { display: none !important; }
          .document-container {
            width: 100%;
            box-shadow: none;
          }
          .ql-toolbar { display: none !important; }
          .ql-container.ql-snow { border: none !important; }
          .ql-editor {
            padding: 0 !important;
            overflow: visible !important;
            font-family: 'Sarabun', sans-serif !important;
          }
        }

        /* ปรับแต่ง Toolbar */
        .document-editor .ql-toolbar {
          border: none !important;
          border-bottom: 1px solid #f0f0f0 !important;
          background: #fbfbfb;
          position: sticky;
          top: 0;
          z-index: 10;
        }
      `}</style>
      </div>
    </>
  );
};

export default DocumentPreview;
