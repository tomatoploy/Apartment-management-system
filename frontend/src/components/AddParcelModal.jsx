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
    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:border-[#f3a638] transition-all placeholder:text-gray-400"
  />
);

const AddParcelModal = ({ isOpen, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    roomId: "",
    recipient: "",
    trackingNumber: "",
    shippingCompany: "thaipost",
    type: "box",
    arrivalDate: new Date().toISOString().split("T")[0],
    pickupDate: "",
  });

  useEffect(() => {
    if (isOpen) {
      setFormData((prev) => ({
        ...prev,
        arrivalDate: new Date().toISOString().split("T")[0],
      }));
    }
  }, [isOpen]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = () => {
    if (!formData.roomId) return alert("กรุณาระบุเลขห้อง");
    onSave(formData);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="bg-white p-8 rounded-[40px] shadow-2xl w-full max-w-2xl animate-in zoom-in duration-200" onClick={(e) => e.stopPropagation()}>
        <div className="relative flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-800">เพิ่มรายการพัสดุ</h2>
          <button onClick={onClose} className="absolute right-0 p-2 hover:bg-gray-100 rounded-full transition-colors"><X size={24} strokeWidth={3} /></button>
        </div>

        <div className="grid grid-cols-2 gap-4 text-left">
          <div className="col-span-1"><FieldLabel required>เลขห้อง</FieldLabel><InputField name="roomId" value={formData.roomId} onChange={handleChange}  /></div>
          <div className="col-span-1"><FieldLabel>ชื่อผู้รับ</FieldLabel><InputField name="recipient" value={formData.recipient} onChange={handleChange} placeholder="ระบุชื่อผู้มารับพัสดุ" /></div>
          
          <div className="col-span-1">
            <FieldLabel>บริษัทขนส่ง</FieldLabel>
            <div className="relative group">
              <select name="shippingCompany" value={formData.shippingCompany} onChange={handleChange} className="w-full p-3.5 bg-gray-50 border border-gray-200 rounded-2xl appearance-none focus:outline-none focus:border-[#f3a638] font-medium text-gray-700">
                <option value="thaipost">ไปรษณีย์ไทย</option>
                <option value="kerry">Kerry Express</option>
                <option value="j&t">J&T Express</option>
                <option value="shopee">Shopee Express</option>
                <option value="lazada">Lazada Logistics</option>
                <option value="dhl">DHL</option>
                <option value="other">อื่นๆ</option>
              </select>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400 group-hover:text-[#f3a638] transition-all"><ChevronDown size={20} /></div>
            </div>
          </div>

          <div className="col-span-1">
            <FieldLabel>ประเภท</FieldLabel>
            <div className="relative group">
              <select name="type" value={formData.type} onChange={handleChange} className="w-full p-3.5 bg-gray-50 border border-gray-200 rounded-2xl appearance-none focus:outline-none focus:border-[#f3a638] font-medium text-gray-700">
                <option value="box">กล่อง</option>
                <option value="pack">ซอง</option>
                <option value="other">อื่นๆ</option>
              </select>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400 group-hover:text-[#f3a638] transition-all"><ChevronDown size={20} /></div>
            </div>
          </div>

          <div className="col-span-2"><FieldLabel>หมายเลข Tracking</FieldLabel><InputField name="trackingNumber" value={formData.trackingNumber} onChange={handleChange} placeholder="ระบุเลขติดตามพัสดุ" /></div>
          <div className="col-span-1"><FieldLabel required>วันที่พัสดุมาถึง</FieldLabel><InputField type="date" name="arrivalDate" value={formData.arrivalDate} onChange={handleChange} /></div>
        
        {/* วันที่รับพัสดุ */}
          <div className="col-span-1">
            <FieldLabel>วันที่รับพัสดุ</FieldLabel>
            <InputField type="date" name="pickupDate" value={formData.pickupDate || ""} onChange={handleChange} />
          </div>
        </div>

        <div className="flex gap-4 pt-6 mt-6 border-t border-gray-400">
          <button onClick={handleSubmit} className="flex-1 bg-[#f3a638] text-white py-4 rounded-2xl font-bold shadow-lg hover:brightness-90 transition-all">บันทึก</button>
        </div>
      </div>
    </div>
  );
};

export default AddParcelModal;