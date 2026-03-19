import { useNavigate } from "react-router-dom";
import React, { useState } from "react";
import ReactQuill from "react-quill-new";
import "react-quill-new/dist/quill.snow.css";
import {
  ExitButton,
  OrangeButton,
  ConfirmModal,
} from "../components/ActionButtons";
import { CheckCircle2 } from "lucide-react";
import { initialContractTemplates } from "../data/contractData";
// --- MOCK DATA INCLUDED ---
const mockSettings = {
  building_name: "หอพัก สบายดี แมนชั่น",
  address: "123/45 ถนนพญาไท แขวงปทุมวัน เขตปทุมวัน กรุงเทพฯ 10330",
  landlord_name: "คุณสมศรี มีความสุข",
  landlord_id_card: "1-2345-67890-12-3",
};

const ContractTemplate = () => {
  const navigate = useNavigate();
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const [templates, setTemplates] = useState(initialContractTemplates);
  const [selectedTemplate, setSelectedTemplate] = useState(
    initialContractTemplates[0],
  );
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(selectedTemplate.content);
  const [editName, setEditName] = useState(selectedTemplate.name);
  const [showVariableGuide, setShowVariableGuide] = useState(false);

  // ตัวแปรที่ใช้ได้ (Single Source of Truth)
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
    { key: "{{first_month_rent}}", desc: "ค่าเช่าเดือนแรก", example: "5000" },
    {
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
      [{ header: [1, 2, 3, false] }],
      ["bold", "italic", "underline", "strike"],
      [{ list: "ordered" }, { list: "bullet" }],
      [{ align: [] }],
      ["clean"],
    ],
  };

  // เรียงลำดับ show templates: status active ขึ้นก่อน แล้วค่อยเรียงด้วย id จากมากไปน้อย สร้างใหม่ไปเกก่า
  const sortedTemplates = [...templates].sort((a, b) => {
    if (a.is_active !== b.is_active) {
      return b.is_active ? 1 : -1;
    }
    return b.id - a.id;
  });

  const handleSelectTemplate = (template) => {
    setSelectedTemplate(template);
    setEditContent(template.content);
    setEditName(template.name);
    setIsEditing(false);
  };

  // const handleSaveTemplate = () => {
  //   const updatedTemplates = templates.map((t) =>
  //     t.id === selectedTemplate.id
  //       ? { ...t, name: editName, content: editContent }
  //       : t,
  //   );
  //   setTemplates(updatedTemplates);
  //   setSelectedTemplate({
  //     ...selectedTemplate,
  //     name: editName,
  //     content: editContent,
  //   });
  //   setIsEditing(false);
  //   // คุณสามารถเพิ่มการเรียก API จริงที่นี่ในอนาคต
  // };

  // 1. เมื่อกดปุ่ม "บันทึก" ในหน้าเว็บ ให้เรียกฟังก์ชันนี้เพื่อเปิด Modal
  const requestSave = () => {
    setIsConfirmModalOpen(true);
  };

  //2. ฟังก์ชันที่จะทำงานเมื่อผู้ใช้กด "ยืนยัน" ใน Modal จริงๆ
  const handleConfirmSave = () => {
    const updatedTemplates = templates.map((t) =>
      t.id === selectedTemplate.id
        ? { ...t, name: editName, content: editContent }
        : t,
    );
    setTemplates(updatedTemplates);
    setSelectedTemplate({
      ...selectedTemplate,
      name: editName,
      content: editContent,
    });

    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 2000);

    setIsConfirmModalOpen(false);
  };

  // ฟังก์ชันช่วยแทรกตัวแปรลงใน Quill (ทำให้ใช้งานง่ายขึ้น)
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
        <div className="max-w-5xl mx-auto space-y-6">
          {/* Header Edit Mode */}
          <div className="relative text-center mb-6">
            <ExitButton
              onClick={() => setIsEditing(false)}
              className="absolute right-0 top-0"
            />
            <h1 className="text-2xl md:text-3xl font-bold mb-8 text-gray-800">
              แก้ไขเทมเพลต
            </h1>
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

          <div className="flex-1 items-center">
            <span className="text-md font-medium">ชื่อเทมเพลต</span>
            <input
              type="text"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              className="w-full mt-2 px-4 py-2 border border-gray-300 rounded-xl  focus:outline-none focus:border-[#f3a638] transition-all"
            />
          </div>

          {/* Variable Toolbar (Responsive) */}
          <div className="cursor-pointer bg-orange-50 border border-orange-200 p-4 rounded-xl">
            <button
              onClick={() => setShowVariableGuide(!showVariableGuide)}
              className="flex items-center justify-between w-full font-semibold text-gray-800"
            >
              <span>
                {showVariableGuide
                  ? "ซ่อนตัวช่วยแทรกตัวแปร"
                  : "แสดงตัวช่วยแทรกตัวแปร"}
              </span>
            </button>

            {showVariableGuide && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-4">
                {availableVariables.map((v) => (
                  <button
                    key={v.key}
                    onClick={() => insertVariable(v.key)}
                    className="p-2 bg-white border border-blue-200 rounded text-xs hover:bg-blue-100 transition text-left"
                  >
                    <div className="font-mono font-bold text-blue-600">
                      {v.key}
                    </div>
                    <div className="text-gray-500">{v.desc}</div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Editor Container */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <ReactQuill
              theme="snow"
              value={editContent}
              onChange={setEditContent}
              modules={modules}
              style={{ height: "400px" }}
              className="mb-12"
            />
          </div>

          <div className="flex justify-end gap-3">
            <OrangeButton
              label="บันทึก"
              onClick={requestSave}
              className="w-full md:w-auto bg-[#f3a638] px-16"
            />
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
              <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[110] w-[90%] md:w-auto min-w-[320px] px-6 md:px-8 py-4 bg-[#f3a638] text-white rounded-2xl shadow-2xl flex items-center justify-center gap-3 animate-in slide-in-from-top-4 fade-in duration-300">
                <CheckCircle2 size={24} className="shrink-0 " />
                <span className="font-black whitespace-nowrap text-lg">
                  แก้ไขเทมเพลตสำเร็จ
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <header className="mb-8">
        <div className="relative text-center">
          <ExitButton
            onClick={() => navigate("/settings")}
            className="absolute right-0 top-0"
          />
          <h1 className="text-2xl md:text-3xl font-bold mb-8 text-gray-800">
            ตั้งค่าเทมเพลตเอกสาร
          </h1>
        </div>
      </header>

      <div className="md:p-4 grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Sidebar: List of Templates */}
          <div className="lg:col-span-4 space-y-4">
            <h2 className="font-bold text-gray-700 px-1">เทมเพลตทั้งหมด</h2>
            {/* ใช้ข้อมูลที่เรียงลำดับแล้ว */}
            {sortedTemplates.map((t) => (
              <div
                key={t.id}
                onClick={() => handleSelectTemplate(t)}
                className={`p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                  selectedTemplate.id === t.id
                    ? "border-orange-300 bg-white shadow-md scale-[1.02]"
                    : "border-transparent bg-gray-100 hover:bg-gray-200"
                }`}
              >
                <div className="flex justify-between items-start">
                  <h3
                    className={`font-bold ${
                      selectedTemplate.id === t.id
                        ? "text-gray-700"
                        : "text-gray-500"
                    }`}
                  >
                    {t.name}
                  </h3>
                
                </div>

                <span
                  className={`text-[10px] uppercase tracking-wider font-bold px-2 py-1 rounded-full mt-2 inline-block ${
                    t.is_active
                      ? "bg-green-100 text-green-600"
                      : "bg-gray-200 text-gray-500"
                  }`}
                >
                  {t.is_active ? "Active" : "Inactive"}
                </span>
              </div>
            ))}
        </div>

        {/* Main Content: Preview */}
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

          {/* Document Preview Area */}
          <div className="prose prose-orange max-w-none min-h-[400px] text-gray-700 leading-relaxed">
            <div
              dangerouslySetInnerHTML={{ __html: selectedTemplate.content }}
            />
          </div>

          <div className="mt-10 p-4 bg-amber-50 rounded-2xl border border-amber-100 flex gap-3">
            <p className="text-sm text-amber-900">
              เมื่อสร้างจากหน้าห้อง ระบบจะแทนที่ตัวแปรที่เป็น
              <code className="bg-amber-200 px-1 rounded mx-1">
                {"{{...}}"}
              </code>{" "}
              ด้วยข้อมูลจริงของผู้เช่าให้ทันที
            </p>
          </div>
        </div>
      </div>
    </>
  );
};

export default ContractTemplate;
