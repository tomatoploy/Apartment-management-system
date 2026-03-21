import { useNavigate } from "react-router-dom";
import React, { useState } from "react";
import ReactQuill, { Quill } from "react-quill-new";
import "react-quill-new/dist/quill.snow.css";
import {
  ExitButton,
  OrangeButton,
  ConfirmModal,
} from "../components/ActionButtons";
import { CheckCircle, Download } from "lucide-react";
import { initialContractTemplates } from "../data/contractData";

// --- Register Quill Modules (อยู่นอก Component เพื่อความเร็ว) ---
const Table = Quill.import("formats/table");
Quill.register(Table, true);

const Size = Quill.import("formats/size");
Size.whitelist = ["9px", "10px", "11px", "12px", "14px", "16px", "18px", "20px", "24px", "32px"];
Quill.register(Size, true);

const ContractTemplate = () => {
  const navigate = useNavigate();
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [templates, setTemplates] = useState(initialContractTemplates);
  const [selectedTemplate, setSelectedTemplate] = useState(initialContractTemplates[0]);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(selectedTemplate.content);
  const [editName, setEditName] = useState(selectedTemplate.name);
  const [showVariableGuide, setShowVariableGuide] = useState(false);

   const availableVariables = [
    { key: "{{currentMonth}", desc: "เดือนปัจจุบัน", example: "มกราคม" },
    {
      key: "{{apartment_name}}",
      desc: "ชื่ออะพาร์ตเมนต์",
      example: "หอพักนิตยวดี",
    },
    {
      key: "{{apartment_address}}",
      desc: "ที่อยู่อะพาร์ตเมนต์",
      example: "123 ถนนสุขุมวิท แขวงคลองตัน เขตวัฒนา กรุงเทพฯ 10110",
    },
    { key: "{{tenant_name}}", desc: "ชื่อผู้เช่า", example: "สมชาย ใจดี" },
    {
      key: "{{tenant_nin}}",
      desc: "เลขที่บัตรประชาชน",
      example: "1-2345-67890-12-3",
    },
    { key: "{{tenant_phone}}", desc: "เบอร์โทรศัพท์", example: "081-234-5678" },
    { key: "{{room_number}}", desc: "หมายเลขห้อง", example: "101" },
    {
      key: "{{contract_monthlyRent}}",
      desc: "ค่าเช่ารายเดือน",
      example: "5000",
    },
    { key: "{{contract_deposit}}", desc: "เงินประกัน", example: "10000" },
    {
      key: "{{contract_startDate}}",
      desc: "วันที่เริ่มสัญญา",
      example: "1 มกราคม 2567",
    },
    {
      key: "{{contract_endDate}}",
      desc: "วันที่สิ้นสุดสัญญา",
      example: "31 ธันวาคม 2567",
    },
    {
      key: "{{apartment_paymentDueEnd}}",
      desc: "วันที่สุดท้ายที่สามารถชำระค่าเช่าได้",
      example: "10",
    },
    {
      key: "{{electricity_rate}}",
      desc: "อัตราค่าไฟฟ้าต่อหน่วย",
      example: "6.00",
    },
    {
      key: "{{water_rate}}",
      desc: "อัตราค่าน้ำประปาต่อหน่วย",
      example: "15.00",
    },
    { key: "{{first_month_rent}}", desc: "ค่าเช่าเดือนแรก", example: "5000" },{
      key: "{{room_rent_amount}}",
      desc: "ส่วนของค่าเช่าห้องพัก",
      example: "4000",
    },
    {
      key: "{{furniture_rent_amount}}",
      desc: "ส่วนของค่าเฟอร์นิเจอร์",
      example: "1000",
    },
  ];
  
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

  const formats = ["size", "header", "bold", "italic", "underline", "strike", "color", "background", "list", "align", "table"];

  const handleSelectTemplate = (template) => {
    setSelectedTemplate(template);
    setEditContent(template.content);
    setEditName(template.name);
    setIsEditing(false);
  };

  const handleConfirmSave = () => {
    const updatedTemplates = templates.map((t) =>
      t.id === selectedTemplate.id ? { ...t, name: editName, content: editContent } : t
    );
    setTemplates(updatedTemplates);
    setSelectedTemplate({ ...selectedTemplate, name: editName, content: editContent });
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 2000);
    setIsConfirmModalOpen(false);
  };

  const insertVariable = (variableKey) => {
    setEditContent((prev) => prev + ` <strong>${variableKey}</strong> `);
  };
  const toggleStatus = () => {
    const newStatus = !selectedTemplate.is_active;
    setSelectedTemplate({ ...selectedTemplate, is_active: newStatus });

    const updatedTemplates = templates.map((t) =>
      t.id === selectedTemplate.id ? { ...t, is_active: newStatus } : t,
    );
    setTemplates(updatedTemplates);
  };

  // --- RENDERING โหมดแก้ไข---
  if (isEditing) {
    return (
      <div className="min-h-screen md:p-4">
        <div className="max-w-5xl mx-auto space-y-6 pb-20">
          <div className="relative text-center mb-6">
            <ExitButton onClick={() => setIsEditing(false)} className="absolute right-0 top-0" />
            <h1 className="text-2xl md:text-3xl font-bold text-gray-800">แก้ไขเทมเพลต</h1>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-md font-medium">สถานะการใช้งาน</span>
            <button
              onClick={toggleStatus}
              className={`px-3 py-1 rounded-full text-xs font-bold transition cursor-pointer ${
                selectedTemplate.is_active
                  ? "bg-green-100 text-green-600"
                  : "bg-gray-200 text-gray-600"
              }`}
            >
              {selectedTemplate.is_active ? "● Active" : "○ Inactive"}
            </button>
          </div>

          <div className="flex-1">
            <span className="text-md font-medium text-gray-700">ชื่อเทมเพลต</span>
            <input
              type="text"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              className="w-full mt-2 px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:border-orange-400"
            />
          </div>


          <div className="cursor-pointer bg-orange-50 border border-orange-200 p-4 rounded-xl">
            <button onClick={() => setShowVariableGuide(!showVariableGuide)}               className="flex items-center justify-between w-full font-semibold text-gray-800">
              <span>
                {showVariableGuide
                  ? "ซ่อนตัวช่วยแทรกตัวแปร"
                  : "แสดงตัวช่วยแทรกตัวแปร"}
              </span>            
              </button>
            {showVariableGuide && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-4">
                {availableVariables.map((v) => (
                  <button key={v.key} onClick={() => insertVariable(v.key)} 
                    className="p-2 bg-white border border-blue-200 rounded text-xs hover:bg-blue-100 transition text-left">
                    <div className="font-mono font-bold text-blue-600">{v.key}</div>
                    <div className="text-gray-500">{v.desc}</div>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <ReactQuill theme="snow" value={editContent} onChange={setEditContent} modules={modules} formats={formats} style={{ height: "500px" }} className="mb-12" />
          </div>

          <div className="flex justify-end gap-3 mt-4">
            <button onClick={() => setIsEditing(false)} className="px-8 py-2.5 rounded-xl font-bold text-gray-500 hover:bg-gray-100 transition-all">ยกเลิก</button>
            <OrangeButton label="บันทึกเทมเพลต" onClick={() => setIsConfirmModalOpen(true)} className="px-12 shadow-lg" />
          </div>
        </div>
            <ConfirmModal
              isOpen={isConfirmModalOpen}
              onClose={() => setIsConfirmModalOpen(false)}
              onConfirm={handleConfirmSave}
              title="ยืนยันการแก้ไข"
              description="คุณต้องการบันทึกการเปลี่ยนแปลงของเทมเพลตเอกสารนี้ใช่หรือไม่?"
              confirmText="บันทึก"
              cancelText="ย้อนกลับ"
              variant="warning"
            />
            {showSuccess && (
              <div className="print:hidden fixed bottom-10 left-1/2 -translate-x-1/2 bg-gray-900 text-white px-6 py-3 rounded-2xl flex items-center gap-3 shadow-2xl z-[100]">
            <CheckCircle size={20} className="text-green-400" />
            <span className="font-bold text-sm">แก้ไขเทมเพลตสำเร็จ</span>
          </div>
            )}
          
      </div>
    );
  }

  return (
    <>
      <header className="print:hidden mb-8">
        <div className="relative text-center">
          <ExitButton onClick={() => navigate("/settings")} className="absolute right-0 top-0" />
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800 px-10 sm:px-0">ตั้งค่าเทมเพลตเอกสาร</h1>
        </div>
      </header>

      <div className="print:hidden md:p-4 grid grid-cols-1 lg:grid-cols-12 gap-6 mb-10">
        <div className="lg:col-span-4 space-y-4 px-4 sm:px-0">
          <h2 className="font-bold text-gray-700 px-1">เทมเพลตทั้งหมด</h2>
          <div className="flex flex-col gap-3">
            {templates.map((t) => (
              <div
                key={t.id}
                onClick={() => handleSelectTemplate(t)}
                className={`p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                  selectedTemplate.id === t.id ? "border-orange-300 bg-white shadow-md scale-[1.02]" : "border-transparent bg-gray-100 hover:bg-gray-200"
                }`}
              >
                <h3 className={`font-bold ${selectedTemplate.id === t.id ? "text-gray-700" : "text-gray-500"}`}>{t.name}</h3>
                <span className={`text-[10px] uppercase font-bold px-2 py-1 rounded-full mt-2 inline-block ${t.is_active ? "bg-green-100 text-green-600" : "bg-gray-200 text-gray-500"}`}>
                  {t.is_active ? "Active" : "Inactive"}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="lg:col-span-8 bg-white rounded-3xl shadow-sm border border-gray-200 p-6 ">
          <div className="flex justify-between items-center mb-8 pb-4 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-800">ตัวอย่างเอกสาร</h2>
            <button
              onClick={() => setIsEditing(true)}
              className="bg-[#f3a638] text-white px-10 py-2 rounded-xl hover:bg-[#e6952e] transition text-sm flex items-center gap-2"
            >
              แก้ไข
            </button>
          </div>


          <div className="a4-preview-container bg-gray-200/50 rounded-3xl p-4 sm:p-8 flex justify-center border shadow-inner overflow-x-auto max-h-[800px]">
            <div className="a4-preview-card bg-white shadow-2xl border border-gray-300">
              <div className="ql-snow">
                <ReactQuill value={selectedTemplate.content} readOnly={true} theme="snow" modules={{ toolbar: false }} formats={formats} className="readonly-editor" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sarabun:wght@400;700&display=swap');

        /* Sync Font Sizes */
        ${Size.whitelist.map((size) => `.ql-editor .ql-size-${size} { font-size: ${size} !important; }`).join("\n")}

        /* จัดการกระดาษ A4 จำลอง */
        .a4-preview-card {
          width: 210mm;
          min-height: 297mm;
          background: white;
          box-sizing: border-box;
          font-family: 'Sarabun', sans-serif !important;
        }

        /* ปรับแต่งเนื้อหาข้างใน Quill (ReadOnly) */
        .readonly-editor .ql-container.ql-snow {
          border: none !important;
        }

        .readonly-editor .ql-editor {
          padding: 15mm 20mm !important; /* ระยะขอบกระดาษจริง */
          font-family: 'Sarabun', sans-serif !important;
          line-height: 1.6;
          color: #374151;
          min-height: 297mm;
          overflow: visible;
        }

        /* จัดการตารางให้สวยงามและตรงความจริง */
        .ql-editor table {
          width: 100% !important;
          border-collapse: collapse;
          margin-bottom: 1rem;
        }
        .ql-editor td {
          border: 1px solid #ccc !important;
          padding: 8px !important;
        }

        @media (max-width: 1024px) {
          .a4-preview-card {
            width: 100%;
            min-height: auto;
          }
          .readonly-editor .ql-editor {
            padding: 10mm !important;
          }
        }
      `}</style>
      
      {showSuccess && (
        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 bg-gray-900 text-white px-6 py-3 rounded-2xl flex items-center gap-3 shadow-2xl z-[100]">
          <CheckCircle size={20} className="text-green-400" />
          <span className="font-bold text-sm">บันทึกเทมเพลตเรียบร้อย</span>
        </div>
      )}
    </>
  );
};

export default ContractTemplate;