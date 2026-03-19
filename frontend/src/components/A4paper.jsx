import React from "react";
import ReactQuill, { Quill } from "react-quill-new";

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

// รับ props: content (HTML string), className (สำหรับปรับแต่งเพิ่มเติม)
const A4Paper = ({ content, className = "" }) => {
  return (
    <div className={`a4-preview-container ${className}`}>
      {/* ตัวกระดาษ A4 */}
      <div className="a4-sheet bg-white shadow-2xl border border-gray-300 mx-auto">
        <div className="ql-snow">
          <div
            className="ql-editor display-content prose prose-orange max-w-none"
            dangerouslySetInnerHTML={{ __html: content }}
          />
        </div>
      </div>

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
    </div>
  );
};

export default A4Paper;
