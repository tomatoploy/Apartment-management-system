import React, { useState, useEffect } from "react";
import {
  X,
  User,
  Phone,
  MapPin,
  Car,
  ShieldCheck,
  Mail,
  Calendar,
  CreditCard,
  Info,
  Monitor,
  FileText,
  Edit3,
  Save,
  RotateCcw,
} from "lucide-react";
import { ExitButton } from "../components/ActionButtons";
import { toThaiDate, DateInput } from "../components/DateController";

// --- Components ย่อยสำหรับการจัดการ Style ---
const SectionHeader = ({ title, icon: Icon }) => (
  <div className="col-span-1 md:col-span-2 flex items-center gap-2 mt-3 mb-1 border-b border-gray-200 pb-2">
    <Icon size={18} className="text-[#f3a638]" />
    <h3 className="text-lg font-bold text-gray-800">{title}</h3>
  </div>
);

// โหมดแสดงผล (View Mode)
const DisplayItem = ({ label, value, icon: Icon, isFullWidth }) => (
  <div
    className={`${isFullWidth ? "md:col-span-2" : "col-span-1"} flex flex-col gap-1`}
  >
    <span className="text-[13px] font-bold text-gray-500 ml-1">{label}</span>
    <div className="w-full p-3.5 bg-gray-50 border border-gray-200 rounded-2xl flex items-center gap-3 text-gray-700 font-medium">
      {Icon && <Icon size={18} className="text-[#f3a638] shrink-0" />}
      <span className="truncate">{value || "-"}</span>
    </div>
  </div>
);

const EditInput = ({
  label,
  name,
  value,
  onChange,
  type = "text",
  isFullWidth,
  required,
}) => {
  // 1. สร้าง Ref เพื่ออ้างอิงถึงตัว input
  const inputRef = React.useRef(null);

  // 2. ฟังก์ชันสั่งเปิด Picker เมื่อคลิกที่ช่อง
  const handleInputClick = () => {
    if (type === "date" && inputRef.current) {
      try {
        // สั่งเปิดหน้าต่างเลือกวันที่ (สนับสนุนใน Chrome/Edge/Safari รุ่นใหม่)
        inputRef.current.showPicker();
      } catch (error) {
        // Fallback สำหรับเบราว์เซอร์ที่ไม่รองรับ
        inputRef.current.focus();
      }
    }
  };

  return (
    <div className={`${isFullWidth ? "md:col-span-2" : "col-span-1"} flex flex-col gap-1`}>
      <label className="text-[13px] font-bold text-gray-600 ml-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <input
        ref={inputRef} // เชื่อม Ref เข้ากับ input
        type={type}
        name={name}
        value={value || ""}
        onChange={onChange}
        onClick={handleInputClick} // เพิ่ม event onClick
        className={`w-full p-3 bg-white border-2 border-orange-100 rounded-2xl focus:outline-none focus:border-[#f3a638] transition-all font-medium text-gray-700 shadow-sm ${
          type === "date" ? "cursor-pointer" : ""
        }`}
      />
    </div>
  );
};

const TenantInfoModal = ({ isOpen, onClose, tenant, onSave }) => {
  const [isEditMode, setIsEditMode] = useState(false);
  const [formData, setFormData] = useState({});

  useEffect(() => {
    if (tenant) setFormData(tenant);
  }, [tenant, isOpen]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSave = () => {
    onSave(formData);
    setIsEditMode(false);
  };

  if (!isOpen || !tenant) return null;

  return (
    <div
      className="fixed inset-0 z-100 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-[40px] shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col animate-in zoom-in duration-200 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* --- Header --- */}
        <div className="bg-white p-6 md:px-10 md:py-4 border-b border-gray-200 flex items-center justify-between gap-4 z-30 relative">
          <div className="flex items-center gap-3 shrink min-w-0">
            <div className="w-12 h-12 bg-orange-50 rounded-2xl flex items-center justify-center text-[#f3a638] shrink-0">
              <User size={28} strokeWidth={2.5} />
            </div>
            <div className="min-w-0">
              <h2 className="text-lg md:text-2xl font-black text-gray-800 leading-tight truncate">
                {isEditMode ? "แก้ไขข้อมูล" : "ข้อมูลผู้เช่า"}
              </h2>
            </div>
          </div>
{/* --- ส่วน Header (แก้ไขเฉพาะในกลุ่มปุ่มบันทึก/ยกเลิก) --- */}
<div className="flex flex-row-reverse items-center gap-2 md:gap-3 shrink-0">
  <ExitButton onClick={onClose} />
  {!isEditMode ? (
    <button
      onClick={() => setIsEditMode(true)}
      className="flex items-center gap-2 px-3 md:px-4 py-2.5 bg-orange-100 text-[#f3a638] rounded-2xl font-black hover:bg-orange-200 transition-all text-xs md:text-sm shadow-sm"
    >
      <Edit3 size={16} />
      <span className="hidden sm:inline">แก้ไข</span>
    </button>
  ) : (
    <div className="flex flex-row-reverse items-center gap-2">
      {/* ปุ่มบันทึก: แสดง Icon บนมือถือ, แสดงข้อความบน Desktop */}
      <button
        onClick={handleSave}
        className="flex items-center gap-2 px-3 md:px-4 py-2.5 bg-[#f3a638] text-white rounded-2xl font-black shadow-lg shadow-orange-100 hover:brightness-95 transition-all text-xs md:text-sm"
        title="บันทึก"
      >
        <Save size={16} />
        <span className="hidden sm:inline">บันทึก</span>
      </button>

      {/* ปุ่มยกเลิก: แสดง Icon บนมือถือ, แสดงข้อความบน Desktop */}
      <button
        onClick={() => {
          setIsEditMode(false);
          setFormData(tenant);
        }}
        className="flex items-center gap-2 px-3 md:px-4 py-2.5 bg-gray-100 text-gray-500 rounded-2xl font-black hover:bg-gray-200 transition-all text-xs md:text-sm"
        title="ยกเลิก"
      >
        <RotateCcw size={16} />
        <span className="hidden sm:inline">ยกเลิก</span>
      </button>
    </div>
  )}
</div>
        </div>

        {/* --- Body: ส่วนเนื้อหาที่ Scroll ได้ --- */}
        <div className="flex-1 overflow-y-auto p-6 md:py-4 md:px-10  bg-white">
          <div className="flex  flex-col lg:flex-row gap-10">
            {/* Sidebar: Photo & Quick Status */}
            <div className="w-full max-w-50 mx-auto lg:mx-0 flex flex-col gap-5">
              <div className="w-full aspect-square bg-gray-50 rounded-[35px] border-4 border-white shadow-sm overflow-hidden flex items-center justify-center relative group transition-all duration-300 hover:shadow-md">
                {formData.photo ? (
                  <img
                    src={formData.photo}
                    alt="Tenant"
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                ) : (
                  <div className="flex flex-col items-center gap-2 text-gray-300">
                    <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center">
                      <User size={48} className="text-gray-300" />
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                      No Image
                    </span>
                  </div>
                )}

                {/* Overlay แสดงเฉพาะตอนโหมดแก้ไข เพื่อให้ผู้ใช้รู้ว่ากดเปลี่ยนรูปได้ */}
                {isEditMode && (
                  <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 cursor-pointer">
                    <div className="bg-white/20 p-3 rounded-2xl mb-2">
                      <Edit3 size={24} className="text-white" />
                    </div>
                    <span className="text-white text-xs font-bold uppercase tracking-wider">
                      แก้ไขรูปภาพ
                    </span>
                    <input
                      type="file"
                      className="absolute inset-0 opacity-0 cursor-pointer"
                      accept="image/*"
                      onChange={(e) => {
                        /* Logic สำหรับอัปโหลดรูปภาพใหม่ */
                        console.log("เลือกรูปภาพใหม่:", e.target.files[0]);
                      }}
                    />
                  </div>
                )}
              </div>

              <div className="space-y-3">
                <div
                  className={`p-4 rounded-2xl border flex justify-between items-center ${formData.isLaundryService ? "bg-orange-50 border-orange-200" : "bg-gray-50 border-gray-200"}`}
                >
                  <span className="text-sm font-bold text-gray-700">
                    ซักรีด
                  </span>
                  {isEditMode ? (
                    <input
                      type="checkbox"
                      name="isLaundryService"
                      checked={formData.isLaundryService}
                      onChange={handleChange}
                      className="w-5 h-5 accent-[#f3a638]"
                    />
                  ) : (
                    <span
                      className={`text-[11px] font-black px-3 py-1 rounded-full ${formData.isLaundryService ? "bg-[#f3a638] text-white" : "bg-gray-200 text-gray-500"}`}
                    >
                      {formData.isLaundryService ? "รับบริการ" : "ไม่ได้รับ"}
                    </span>
                  )}
                </div>

                <div className="p-4 rounded-2xl border border-orange-200 bg-orange-50 flex justify-between items-center">
                  <span className="text-sm font-bold text-gray-700">
                    อุปกรณ์เน็ต
                  </span>
                  {isEditMode ? (
                    <input
                      type="number"
                      name="InternetDeviceCount"
                      value={formData.InternetDeviceCount}
                      onChange={handleChange}
                      className="w-12 bg-white rounded-lg text-center font-bold text-[#f3a638]"
                    />
                  ) : (
                    <span className="text-[11px] font-black px-3 py-1 bg-[#f3a638] text-white rounded-full">
                      {formData.InternetDeviceCount || 0} เครื่อง
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Main Form: ข้อมูลกาง 2 คอลัมน์บนคอม */}
            <div className="w-full lg:w-3/4 grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-5">
              <SectionHeader title="ข้อมูลส่วนบุคคล" icon={Info} />
              {isEditMode ? (
                <>
                  <div className="col-span-1 flex flex-col gap-1">
                    <label className="text-[13px] font-bold text-gray-600 ml-1">
                      คำนำหน้า
                    </label>
                    <select
                      name="title"
                      value={formData.title}
                      onChange={handleChange}
                      className="w-full p-3 bg-white border-2 border-orange-100 rounded-2xl focus:outline-none focus:border-[#f3a638] font-medium text-gray-700 shadow-sm"
                    >
                      <option value="นาย">นาย</option>
                      <option value="นางสาว">นางสาว</option>
                      <option value="นาง">นาง</option>
                    </select>
                  </div>
                  <EditInput
                    label="ชื่อเล่น"
                    name="nickName"
                    value={formData.nickName}
                    onChange={handleChange}
                  />
                  <EditInput
                    label="ชื่อจริง"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleChange}
                    required
                  />
                  <EditInput
                    label="นามสกุล"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleChange}
                    required
                  />
                  <EditInput
                    label="เลขบัตรประชาชน"
                    name="nin"
                    value={formData.nin}
                    onChange={handleChange}
                  />
                  <DateInput label="วันเกิด" 
                  name="birthDate" 
                  value={formData.birthDate} 
                  onChange={handleChange} />
                </>
              ) : (
                <>
                  <DisplayItem
                    label="ชื่อ - นามสกุล"
                    value={`${formData.title}${formData.firstName} ${formData.lastName}`}
                    icon={User}
                    isFullWidth
                  />
                  <DisplayItem
                    label="เลขบัตรประชาชน"
                    value={formData.nin}
                    icon={CreditCard}
                  />
                  <DisplayItem label="ชื่อเล่น" value={formData.nickName} />
                  <DisplayItem label="วันเกิด" value={toThaiDate(formData.birthDate)} icon={Calendar} />
                  
                </>
              )}

              <SectionHeader title="การติดต่อ & ที่อยู่" icon={Phone} />
              {isEditMode ? (
                <>
                  <EditInput
                    label="เบอร์โทรศัพท์"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                  />
                  <EditInput
                    label="Line ID"
                    name="lineId"
                    value={formData.lineId}
                    onChange={handleChange}
                  />
                  <EditInput
                    label="อีเมล"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    isFullWidth
                  />
                  <div className="col-span-1 md:col-span-2 flex flex-col gap-1">
                    <label className="text-[13px] font-bold text-gray-600 ml-1">
                      ที่อยู่
                    </label>
                    <textarea
                      name="address"
                      value={formData.address}
                      onChange={handleChange}
                      className="w-full p-3 bg-white border-2 border-orange-100 rounded-2xl min-h-20 focus:outline-none focus:border-[#f3a638] font-medium text-gray-700 shadow-sm"
                    />
                  </div>
                </>
              ) : (
                <>
                  <DisplayItem
                    label="เบอร์โทรศัพท์"
                    value={formData.phone}
                    icon={Phone}
                  />
                  <DisplayItem label="Line ID" value={formData.lineId} />
                  <DisplayItem
                    label="อีเมล"
                    value={formData.email}
                    icon={Mail}
                    isFullWidth
                  />
                  <DisplayItem
                    label="ที่อยู่"
                    value={formData.address}
                    icon={MapPin}
                    isFullWidth
                  />
                </>
              )}

              <SectionHeader
                title="ติดต่อฉุกเฉิน & ทรัพย์สิน"
                icon={ShieldCheck}
              />
              {isEditMode ? (
                <>
                  <EditInput
                    label="ผู้ติดต่อสำรอง"
                    name="altName"
                    value={formData.altName}
                    onChange={handleChange}
                  />
                  <EditInput
                    label="ความสัมพันธ์"
                    name="altRelationship"
                    value={formData.altRelationship}
                    onChange={handleChange}
                  />
                  <EditInput
                    label="เบอร์สำรอง"
                    name="altPhone"
                    value={formData.altPhone}
                    onChange={handleChange}
                    isFullWidth
                  />
                  <EditInput
                    label="ทะเบียนรถ 1"
                    name="vehicleNum1"
                    value={formData.vehicleNum1}
                    onChange={handleChange}
                  />
                  <EditInput
                    label="รายละเอียดรถ 1"
                    name="vehicleDetail1"
                    value={formData.vehicleDetail1}
                    onChange={handleChange}
                  />
                  <EditInput
                    label="ทะเบียนรถ 2"
                    name="vehicleNum2"
                    value={formData.vehicleNum2}
                    onChange={handleChange}
                  />
                  <EditInput
                    label="รายละเอียดรถ 2"
                    name="vehicleDetail2"
                    value={formData.vehicleDetail2}
                    onChange={handleChange}
                  />
                  <div className="col-span-1 md:col-span-2 grid grid-cols-3 gap-3 mt-2">
                    <EditInput
                      label="คีย์การ์ด 1"
                      name="keyCard1"
                      value={formData.keyCard1}
                      onChange={handleChange}
                    />
                    <EditInput
                      label="คีย์การ์ด 2"
                      name="keyCard2"
                      value={formData.keyCard2}
                      onChange={handleChange}
                    />
                    <EditInput
                      label="คีย์การ์ด 3"
                      name="keyCard3"
                      value={formData.keyCard3}
                      onChange={handleChange}
                    />
                  </div>
                </>
              ) : (
                <>
                  <DisplayItem
                    label="บุคคลติดต่อสำรอง"
                    value={`${formData.altName} (${formData.altRelationship})`}
                  />
                  <DisplayItem
                    label="เบอร์โทรศัพท์สำรอง"
                    value={formData.altPhone}
                    icon={Phone}
                  />
                  <DisplayItem
                    label="ทะเบียนรถ"
                    value={`${formData.vehicleNum1 || "-"} / ${formData.vehicleNum2 || "-"}`}
                    icon={Car}
                  />
                  <div className="col-span-1 md:col-span-2 flex flex-col gap-1">
                    <span className="text-[13px] font-bold text-gray-400 ml-1">
                      รายการคีย์การ์ด
                    </span>
                    <div className="flex gap-2">
                      {[
                        formData.keyCard1,
                        formData.keyCard2,
                        formData.keyCard3,
                      ].map((card, idx) => (
                        <span
                          key={idx}
                          className="px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-600"
                        >
                          {card || "-"}
                        </span>
                      ))}
                    </div>
                  </div>
                </>
              )}

              <SectionHeader title="หมายเหตุ" icon={FileText} />
              <div className="col-span-1 md:col-span-2 mb-8">
                {isEditMode ? (
                  <textarea
                    name="note"
                    value={formData.note}
                    onChange={handleChange}
                    className="w-full p-4 bg-white border-2 border-orange-100 rounded-3xl min-h-25 focus:outline-none focus:border-[#f3a638] font-medium text-gray-700 shadow-sm"
                    placeholder="บันทึกข้อมูลเพิ่มเติม..."
                  />
                ) : (
                  <div className="p-5 bg-orange-50/30 border border-orange-100 rounded-3xl text-gray-600 italic text-sm">
                    {formData.note || "- ไม่มีบันทึกเพิ่มเติม -"}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TenantInfoModal;
