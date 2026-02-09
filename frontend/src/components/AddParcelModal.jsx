import React, { useState, useEffect } from "react";
import { X, ChevronDown } from "lucide-react";

const FieldLabel = ({ children, required }) => (
  <label className="block text-md font-bold text-gray-700 mb-2">
    {children} {required && <span className="text-red-500">*</span>}
  </label>
);

const InputField = ({ type = "text", ...props }) => (
  <input
    type={type}
    {...props}
    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-2xl
    focus:outline-none focus:border-[#f3a638] transition-all
    placeholder:text-gray-400"
  />
);

const AddParcelModal = ({ isOpen, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    roomNumber: "",
    recipient: "",
    trackingNumber: "",
    shippingCompany: "thaipost",
    type: "box",
    arrivalDate: "",
    pickupDate: "",
  });

  // ✅ Reset Form เมื่อเปิด Modal ใหม่
  useEffect(() => {
    if (isOpen) {
      setFormData({
        roomNumber: "",
        recipient: "",
        trackingNumber: "",
        shippingCompany: "thaipost",
        type: "box",
        arrivalDate: new Date().toISOString().split("T")[0],
        pickupDate: "",
      });
    }
  }, [isOpen]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = () => {
    if (!formData.roomNumber) return alert("กรุณาระบุเลขห้อง");

    const payload = {
      roomNumber: formData.roomNumber,
      recipient: formData.recipient || null,
      trackingNumber: formData.trackingNumber || null,
      shippingCompany: formData.shippingCompany,
      type: formData.type,
      arrivalDate: formData.arrivalDate,
      pickupDate: formData.pickupDate === "" ? null : formData.pickupDate,
    };

    onSave(payload);
    // ไม่ต้อง onClose() ที่นี่ถ้า Parent จัดการแล้ว
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center
      bg-black/30 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="bg-white p-8 rounded-[40px] shadow-2xl
        w-full max-w-2xl animate-in zoom-in duration-200
        max-h-[90vh] overflow-y-auto" // ✅ เพิ่ม Scroll
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-800">
            เพิ่มรายการพัสดุ
          </h2>
          <button
            onClick={onClose}
            className="absolute right-0 p-2 hover:bg-gray-100
            rounded-full transition-colors"
          >
            <X size={24} strokeWidth={3} />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-4 text-left">
          <div>
            <FieldLabel required>เลขห้อง</FieldLabel>
            <InputField
              name="roomNumber"
              value={formData.roomNumber}
              onChange={handleChange}
              placeholder="ระบุเลขห้อง"
            />
          </div>

          <div>
            <FieldLabel>ชื่อผู้รับ</FieldLabel>
            <InputField
              name="recipient"
              value={formData.recipient}
              onChange={handleChange}
              placeholder="ระบุชื่อผู้มารับพัสดุ"
            />
          </div>

          <div>
            <FieldLabel>บริษัทขนส่ง</FieldLabel>
            <div className="relative group">
              <select
                name="shippingCompany"
                value={formData.shippingCompany}
                onChange={handleChange}
                className="w-full p-3.5 bg-gray-50 border border-gray-200
                rounded-2xl appearance-none focus:outline-none
                focus:border-[#f3a638] font-medium text-gray-700"
              >
                <option value="thaipost">ไปรษณีย์ไทย</option>
                <option value="kerry">Kerry Express</option>
                <option value="j&t">J&T Express</option>
                <option value="shopee">Shopee Express</option>
                <option value="lazada">Lazada Logistics</option>
                <option value="dhl">DHL</option>
                <option value="other">อื่นๆ</option>
              </select>
              <ChevronDown
                size={20}
                className="absolute right-4 top-1/2 -translate-y-1/2
                text-gray-400 pointer-events-none"
              />
            </div>
          </div>

          <div>
            <FieldLabel>ประเภท</FieldLabel>
            <div className="relative group">
              <select
                name="type"
                value={formData.type}
                onChange={handleChange}
                className="w-full p-3.5 bg-gray-50 border border-gray-200
                rounded-2xl appearance-none focus:outline-none
                focus:border-[#f3a638] font-medium text-gray-700"
              >
                <option value="box">กล่อง</option>
                <option value="pack">ซอง</option>
                <option value="other">อื่นๆ</option>
              </select>
              <ChevronDown
                size={20}
                className="absolute right-4 top-1/2 -translate-y-1/2
                text-gray-400 pointer-events-none"
              />
            </div>
          </div>

          <div className="col-span-2">
            <FieldLabel>หมายเลข Tracking</FieldLabel>
            <InputField
              name="trackingNumber"
              value={formData.trackingNumber}
              onChange={handleChange}
              placeholder="ระบุเลขติดตามพัสดุ"
            />
          </div>

          <div>
            <FieldLabel required>วันที่พัสดุมาถึง</FieldLabel>
            <InputField
              type="date"
              name="arrivalDate"
              value={formData.arrivalDate}
              onChange={handleChange}
            />
          </div>

          <div>
            <FieldLabel>วันที่รับพัสดุ</FieldLabel>
            <InputField
              type="date"
              name="pickupDate"
              value={formData.pickupDate}
              onChange={handleChange}
            />
          </div>
        </div>

        <div className="flex gap-4 pt-6 mt-6 border-t border-gray-200">
          <button
            onClick={handleSubmit}
            className="flex-1 bg-[#f3a638] text-white py-4
            rounded-2xl font-bold shadow-lg hover:brightness-90"
          >
            บันทึก
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddParcelModal;