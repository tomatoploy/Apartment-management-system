import React, { useState, useEffect } from "react";
import { X, ChevronDown, Trash2 } from "lucide-react";
import { DateInput,  } from "../components/DateController";
import { ExitButton } from "../components/ActionButtons";

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
      const formatDate = (dateString) => {
        if (!dateString) return "";
        return dateString.split("T")[0];
      };

      setFormData({
        id: initialData.id, 
        roomNumber: initialData.roomNumber || "",
        recipient: initialData.recipient || "", 
        trackingNumber: initialData.trackingNumber || "", 
        shippingCompany: initialData.shippingCompany || "",
        type: initialData.type || "",
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
      className="fixed inset-0 z-50 flex flex-col md:flex-row md:items-center justify-center bg-black/30 backdrop-blur-sm p-0 md:p-4 overflow-hidden"
      onClick={onClose}
    >
      <div
        className="w-full h-[100dvh] md:h-auto md:max-h-[90vh] md:max-w-2xl bg-white flex flex-col rounded-none md:rounded-[40px] overflow-hidden shadow-2xl animate-in zoom-in duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="shrink-0 relative flex items-center justify-between p-6 md:p-8 pb-4">
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
              <FieldLabel>ชื่อผู้รับ</FieldLabel>
              <InputField
                name="recipient"
                value={formData.recipient}
                onChange={handleChange}
              />
            </div>

            <div className="col-span-1">
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

            <div className="col-span-1">
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

            <div className="col-span-1 md:col-span-2">
              <FieldLabel>หมายเลข Tracking</FieldLabel>
              <InputField
                name="trackingNumber"
                value={formData.trackingNumber}
                onChange={handleChange}
              />
            </div>

            {/* เปลี่ยนมาใช้ DateInput */}
            <div className="col-span-1">
              <DateInput
                label="วันที่พัสดุมาถึง"
                required
                name="arrivalDate"
                value={formData.arrivalDate}
                onChange={handleChange}
              />
            </div>

            {/* เปลี่ยนมาใช้ DateInput */}
            <div className="col-span-1">
              <DateInput
                label="วันที่รับพัสดุ"
                name="pickupDate"
                value={formData.pickupDate}
                onChange={handleChange}
              />
            </div>
          </div>

        </div>

        <div className="shrink-0 flex gap-2 p-6 pt-2 border-t border-gray-100 bg-white pb-[max(1.5rem,env(safe-area-inset-bottom))]">
          <button
            onClick={onClose}
            className="flex-1 py-3 text-gray-400
            font-bold border-gray-200 hover:bg-gray-50 rounded-2xl transition-all"
          >
            ยกเลิก
          </button>
          <button
            onClick={handleSubmit}
            className="flex-1 bg-[#f3a638] text-white
            py-3 rounded-2xl font-bold shadow-md shadow-orange-100
            hover:brightness-90 transition-all"
          >
            บันทึก
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditParcelModal;