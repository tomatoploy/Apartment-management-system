import React, { useState, useEffect } from "react";
import { X, ChevronDown, Trash2 } from "lucide-react";
import { DateInput } from "../components/DateController";
import { ExitButton, WhiteButton } from "../components/ActionButtons";

const FieldLabel = ({ children, required }) => (
  <label className="block text-md font-bold text-gray-700 mb-2">
    {children} {required && <span className="text-red-500">*</span>}
  </label>
);

const InputField = ({ type = "text", ...props }) => (
  <input
    type={type}
    {...props}
    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:border-[#f3a638] transition-all placeholder:text-gray-400"
  />
);

const EditRequestModal = ({
  isOpen,
  onClose,
  onSave,
  onDelete,
  initialData,
}) => {
  // ✅ แก้ไข: กำหนดค่าเริ่มต้นให้เป็น "" ทุกฟิลด์ ป้องกันการเป็น undefined ในตอนแรก
  const [formData, setFormData] = useState({
    roomNumber: "",
    requestDate: "",
    subject: "fix",
    body: "",
    status: "pending",
    appointmentDate: "",
    isTenantCost: false,
    cost: "",
    note: "",
  });

  useEffect(() => {
    if (initialData && isOpen) {
      const formatDate = (dateString) => {
        if (!dateString) return "";
        return dateString.split("T")[0];
      };

      // ✅ อัปเดตข้อมูล และใช้ || "" เพื่อกันเหนียวกรณีข้อมูลจาก DB เป็น null
      setFormData({
        id: initialData.id,
        roomNumber: initialData.roomNumber || "",
        requestDate: formatDate(initialData.requestDate),
        subject: initialData.subject || "fix",
        body: initialData.body || "",
        status: initialData.status || "pending",
        appointmentDate: formatDate(initialData.appointmentDate),
        isTenantCost: initialData.isTenantCost || false,
        cost: initialData.cost || "",
        note: initialData.note || "",
      });
    }
  }, [initialData, isOpen]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = () => {
    if (!formData.roomNumber) {
      alert("กรุณาระบุเลขห้อง");
      return;
    }
    onSave(formData);
    onClose();
  };

  if (!isOpen || !formData) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col md:flex-row md:items-center justify-center bg-black/30 backdrop-blur-sm p-0 md:p-4 overflow-hidden"
      onClick={onClose}
    >
      <div
        className="w-full h-[100dvh] md:h-auto md:max-h-[90vh] md:max-w-2xl bg-white flex flex-col rounded-none md:rounded-[40px] overflow-hidden shadow-2xl animate-in zoom-in duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="shrink-0 relative flex items-center justify-between p-6 md:p-8 pb-4">
          <h2 className="text-2xl font-bold text-gray-800">
            แก้ไขข้อมูลการแจ้ง
          </h2>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                if (window.confirm("คุณต้องการลบรายการนี้ใช่หรือไม่?"))
                  onDelete(formData.id);
              }}
              className="p-2.5 text-red-500 hover:bg-red-50 rounded-full transition-colors"
            >
              <Trash2 size={22} />
            </button>
            <ExitButton onClick={onClose} />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-6 md:px-8 py-2 pb-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
            <div className="col-span-1">
              <FieldLabel required>เลขห้อง</FieldLabel>
              <InputField
                name="roomNumber"
                value={formData.roomNumber}
                onChange={handleChange}
              />
            </div>

            <div className="col-span-1">
              <DateInput
                label="วันที่แจ้ง"
                required
                name="requestDate"
                value={formData.requestDate}
                onChange={handleChange}
              />
            </div>

            <div className="col-span-1">
              <FieldLabel required>เรื่องที่แจ้ง</FieldLabel>
              <div className="relative group">
                <select
                  name="subject"
                  value={formData.subject}
                  onChange={handleChange}
                  className="w-full p-3.5 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:border-[#f3a638] appearance-none cursor-pointer font-medium text-gray-700"
                >
                  <option value="fix">แจ้งซ่อม</option>
                  <option value="clean">ทำความสะอาด</option>
                  <option value="leave">แจ้งย้ายออก</option>
                  <option value="other">อื่นๆ</option>
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400 group-hover:text-[#f3a638] transition-all">
                  <ChevronDown size={20} />
                </div>
              </div>
            </div>

            <div className="col-span-1">
              <FieldLabel required>สถานะการดำเนินการ</FieldLabel>
              <div className="relative group">
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  className="w-full p-3.5 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:border-[#f3a638] appearance-none cursor-pointer font-medium text-gray-700"
                >
                  <option value="pending">รอดำเนินการ</option>
                  <option value="finish">เสร็จสิ้น</option>
                  <option value="cancel">ยกเลิก</option>
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400 group-hover:text-[#f3a638] transition-all">
                  <ChevronDown size={20} />
                </div>
              </div>
            </div>

            <div className="col-span-1 md:col-span-2">
              <FieldLabel>รายละเอียด</FieldLabel>
              <textarea
                name="body"
                rows="3"
                value={formData.body}
                onChange={handleChange}
                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:border-[#f3a638]"
              />
            </div>

            <div className="col-span-1">
              <FieldLabel>วันนัดหมาย</FieldLabel>
              <DateInput
                name="appointmentDate"
                value={formData.appointmentDate || ""}
                onChange={handleChange}
              />
            </div>

            <div className="col-span-1 relative">
              <FieldLabel>ค่าใช้จ่าย (ถ้ามี)</FieldLabel>
              <InputField
                type="number"
                name="cost"
                value={formData.cost}
                onChange={handleChange}
              />
              <div className="absolute top-22 left-2 flex items-center gap-2">
                <input
                  type="checkbox"
                  name="isTenantCost"
                  checked={formData.isTenantCost}
                  onChange={handleChange}
                  className="w-4 h-4 accent-[#f3a638] cursor-pointer"
                />
                <span className="text-xs text-gray-500">ผู้เช่าจ่าย</span>
              </div>
            </div>

            <div className="col-span-1 md:col-span-2 mt-4">
              <FieldLabel>หมายเหตุ</FieldLabel>
              <textarea
                name="note"
                rows="2"
                value={formData.note}
                onChange={handleChange}
                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:border-[#f3a638]"
                placeholder="บันทึกเพิ่มเติม"
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="shrink-0 flex gap-4 p-6 pt-4 border-t border-gray-100 bg-white pb-[max(1.5rem,env(safe-area-inset-bottom))]">
          <button
            onClick={onClose}
            className="flex-1 py-3 text-gray-400
            font-bold border-gray-200 hover:bg-gray-50 rounded-2xl transition-all"
          >
            ยกเลิก
          </button>{" "}
          <button
            onClick={handleSubmit}
            className="flex-1 bg-[#f3a638] text-white py-3 rounded-2xl font-bold shadow-md shadow-orange-100 hover:brightness-90 transition-all"
          >
            บันทึก
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditRequestModal;
