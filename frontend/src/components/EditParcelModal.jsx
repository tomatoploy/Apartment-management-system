import React, { useState, useEffect } from "react";
import { X, ChevronDown, Trash2 } from "lucide-react";

const FieldLabel = ({ children, required }) => (
  <label className="block text-md font-bold text-gray-700 mb-2">
    {children} {required && <span className="text-red-500">*</span>}
  </label>
);

const InputField = ({ type = "text", ...props }) => (
  <input
    type={type}
    {...props}
    className="w-full p-3 bg-gray-50 border border-gray-200
    rounded-2xl focus:outline-none focus:border-[#f3a638]
    transition-all placeholder:text-gray-400"
  />
);

const EditParcelModal = ({
  isOpen,
  onClose,
  onSave,
  onDelete,
  initialData,
}) => {
  const [formData, setFormData] = useState({
    roomNumber: "",
    recipient: "",
    trackingNumber: "",
    shippingCompany: "",
    type: "",
    arrivalDate: "",
    pickupDate: "",
  });

  useEffect(() => {
    if (initialData && isOpen) {
      // ✅ FIX: แปลงวันที่จาก ISO String (มีเวลา) ให้เหลือแค่ YYYY-MM-DD
      const formatDate = (dateString) => {
        if (!dateString) return "";
        return dateString.split("T")[0];
      };

      setFormData({
        ...initialData,
        recipient: initialData.recipient || "", // ✅ ป้องกัน null
        trackingNumber: initialData.trackingNumber || "", // ✅ ป้องกัน null
        arrivalDate: formatDate(initialData.arrivalDate),
        pickupDate: formatDate(initialData.pickupDate),
      });
    }
  }, [initialData, isOpen]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = () => {
    if (!formData.roomNumber) return alert("กรุณาระบุเลขห้อง");

    const payload = {
      id: formData.id,
      roomNumber: formData.roomNumber,
      recipient: formData.recipient || null,
      trackingNumber: formData.trackingNumber || null,
      shippingCompany: formData.shippingCompany,
      type: formData.type,
      arrivalDate: formData.arrivalDate,
      // ✅ ถ้าเป็น string ว่าง ให้ส่ง null ไป backend
      pickupDate: formData.pickupDate === "" ? null : formData.pickupDate,
    };

    onSave(payload);
    // ไม่ต้อง onClose() ที่นี่ เพราะ Parent Component มักจะจัดการปิดหลังจาก Save สำเร็จ
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
        max-h-[90vh] overflow-y-auto" // ✅ เพิ่ม scroll กรณีจอเล็ก
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="relative flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-800">
            แก้ไขข้อมูลพัสดุ
          </h2>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                if (window.confirm("คุณต้องการลบรายการพัสดุนี้ใช่หรือไม่?"))
                  onDelete(formData.id);
              }}
              className="p-2.5 text-red-500 hover:bg-red-50
              rounded-full transition-colors"
              title="ลบรายการ"
            >
              <Trash2 size={22} />
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100
              rounded-full transition-colors"
            >
              <X size={24} strokeWidth={3} className="text-gray-400" />
            </button>
          </div>
        </div>

        {/* Form */}
        <div className="grid grid-cols-2 gap-4 text-left">
          <div>
            <FieldLabel required>เลขห้อง</FieldLabel>
            <InputField
              name="roomNumber"
              value={formData.roomNumber}
              onChange={handleChange}
            />
          </div>

          <div>
            <FieldLabel>ชื่อผู้รับ</FieldLabel>
            <InputField
              name="recipient"
              value={formData.recipient}
              onChange={handleChange}
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
                className="absolute right-4 top-1/2
                -translate-y-1/2 text-gray-400 pointer-events-none"
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
                <option value="pack">ซอง/พัสดุขนาดเล็ก</option>
                <option value="other">อื่นๆ</option>
              </select>
              <ChevronDown
                size={20}
                className="absolute right-4 top-1/2
                -translate-y-1/2 text-gray-400 pointer-events-none"
              />
            </div>
          </div>

          <div className="col-span-2">
            <FieldLabel>หมายเลข Tracking</FieldLabel>
            <InputField
              name="trackingNumber"
              value={formData.trackingNumber}
              onChange={handleChange}
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
              placeholder="" // ช่วยให้ Browser แสดง UI วันที่ชัดขึ้น
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-4 pt-6 mt-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="flex-1 py-4 text-gray-400
            font-bold hover:bg-gray-50 rounded-2xl"
          >
            ยกเลิก
          </button>
          <button
            onClick={handleSubmit}
            className="flex-1 bg-[#f3a638] text-white
            py-4 rounded-2xl font-bold shadow-lg
            hover:brightness-90"
          >
            บันทึกการแก้ไข
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditParcelModal;