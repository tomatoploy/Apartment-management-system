import React, { useState, useEffect } from "react";
import { X, ChevronDown } from "lucide-react";

// สร้าง Component ภายในสำหรับ Label เพื่อลดความซ้ำซ้อน
const FieldLabel = ({ children, required }) => (
  <label className="block text-md font-bold text-gray-700 mb-2">
    {children} {required && <span className="text-red-500">*</span>}
  </label>
);
// คอมโพเนนท์สำหรับ Input ที่รวมสไตล์ไว้ที่เดียว
const InputField = ({ type = "text", ...props }) => (
  <input
    type={type}
    {...props}
    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:border-[#f3a638] transition-all placeholder:text-gray-400"
  />
);
 // สร้าง State สำหรับเก็บข้อมูลตาม Schema ที่กำหนด
const RequestModal = ({ isOpen, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    roomId: "",
    requestDate: new Date().toISOString().split("T")[0],
    subject: "fix",
    body: "",
    status: "pending",
    appointmentDate: "",
    isTenantCost: false,
    cost: 0,
    note: "",
  });

  useEffect(() => {
    if (isOpen) {
      setFormData((prev) => ({
        ...prev,
        requestDate: new Date().toISOString().split("T")[0],
      }));
    }
  }, [isOpen]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

      // ตรวจสอบข้อมูล Required (roomId)
  const handleSubmit = () => {
    if (!formData.roomId) {
      alert("กรุณาระบุเลขห้อง");
      return;
    }
    onSave(formData);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm p-4" onClick={onClose}>
      <div 
        className="bg-white p-8 rounded-[40px] shadow-2xl w-full max-w-2xl animate-in zoom-in duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="relative flex items-center justify-center mb-8">
          <h2 className="text-2xl font-bold text-gray-800">เพิ่มการแจ้ง</h2>
          <button onClick={onClose} className="absolute right-0 p-2 hover:bg-gray-100 rounded-full transition-colors">
            <X size={24} strokeWidth={3} />
          </button>
        </div>

        {/* Form Body */}
        <div className="grid grid-cols-2 gap-4 text-left">
          <div className="col-span-1">
            <FieldLabel required>เลขห้อง</FieldLabel>
            <InputField name="roomId" value={formData.roomId} onChange={handleChange}  />
          </div>

          <div className="col-span-1">
            <FieldLabel required>วันที่แจ้ง</FieldLabel>
            <InputField type="date" name="requestDate" value={formData.requestDate} onChange={handleChange}   />
          </div>

          <div className="col-span-1">
            <FieldLabel required>เรื่องที่แจ้ง</FieldLabel>
            <div className="relative">
              <select name="subject" value={formData.subject} onChange={handleChange} className="w-full p-3.5 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:border-[#f3a638] focus:ring-2 focus:ring-[#f3a638]/20 appearance-none cursor-pointer transition-all font-medium text-gray-700">
                <option value="fix">แจ้งซ่อม</option>
                <option value="clean">ทำความสะอาด</option>
                <option value="leave">แจ้งย้ายออก</option>
                <option value="other">อื่นๆ</option>
              </select>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-700"><ChevronDown size={20} /></div>
            </div>
          </div>

          <div className="col-span-1">
            <FieldLabel required>สถานะการดำเนินการ</FieldLabel>
            <div className="relative">
              <select name="status" value={formData.status} onChange={handleChange} className="w-full p-3.5 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:border-[#f3a638] focus:ring-2 focus:ring-[#f3a638]/20 appearance-none cursor-pointer transition-all font-medium text-gray-700">
                <option value="pending">รอดำเนินการ</option>
                <option value="finish">เสร็จสิ้น</option>
                <option value="cancel">ยกเลิก</option>
              </select>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-700"><ChevronDown size={20} /></div>
            </div>
          </div>

          <div className="col-span-2">
            <FieldLabel>รายละเอียด</FieldLabel>
            <textarea name="body" rows="3" value={formData.body} onChange={handleChange} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:border-[#f3a638]" />
          </div>

          <div className="col-span-1">
            <FieldLabel>วันนัดหมาย</FieldLabel>
            <InputField  type="date" name="appointmentDate" value={formData.appointmentDate} onChange={handleChange}   />
          </div>

          <div className="col-span-1 relative">
            <FieldLabel>ค่าใช้จ่าย (ถ้ามี)</FieldLabel>
            <InputField type="number" name="cost" value={formData.cost} onChange={handleChange} />
            <div className="absolute top-22 left-2 flex items-center gap-2">
              <input type="checkbox" name="isTenantCost" checked={formData.isTenantCost} onChange={handleChange} className="w-4 h-4 accent-[#f3a638] cursor-pointer" />
              <span className="text-xs text-gray-500">ผู้เช่าจ่าย</span>
            </div>
          </div>

          <div className="col-span-2">
            <FieldLabel>หมายเหตุภายใน</FieldLabel>
            <InputField  type="text" name="note" value={formData.note} onChange={handleChange}   placeholder="บันทึกเพิ่มเติมสำหรับผู้ดูแล..." />
          </div>
        </div>

        {/* Footer Buttons */}
        <div className="flex gap-4 pt-6 mt-6 border-t border-gray-400">
          <button onClick={handleSubmit} className="flex-1  bg-[#f3a638] text-white py-4 rounded-2xl font-bold shadow-lg shadow-orange-100 hover:brightness-90 transition-all">
            บันทึก
          </button>
        </div>
      </div>
    </div>
  );
};

export default RequestModal;