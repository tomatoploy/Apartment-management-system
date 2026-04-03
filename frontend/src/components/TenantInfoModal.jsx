import React, { useState, useEffect } from "react";
import {
  User,
  Phone,
  MapPin,
  Car,
  ShieldCheck,
  Mail,
  Calendar,
  CreditCard,
  Info,
  FileText,
  Edit3,
  Save,
  CircleChevronLeft,
} from "lucide-react";
import { ExitButton } from "../components/ActionButtons";
import { toThaiDate, DateInput } from "../components/DateController";

// --- Helper: กรองคำว่า "null" ออก ---
const cleanVal = (val) => {
  if (val === "null" || val === null || val === undefined || val === "") return "";
  return val;
};

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

// โหมดแก้ไข (Edit Mode)
// --- Components ย่อยสำหรับการจัดการ Style ---
const FieldLabel = ({ children, required }) => (
  <label className="text-[13px] font-bold text-gray-500 ml-1">
    {children} {required && <span className="text-red-500">*</span>}
  </label>
);


const EditInput = ({
  label,
  name,
  value,
  onChange,
  type = "text",
  isFullWidth,
  required,
  placeholder,
}) => {
  const inputRef = React.useRef(null);

  const handleInputClick = () => {
    if (type === "date" && inputRef.current) {
      try {
        inputRef.current.showPicker();
      } catch (error) {
        inputRef.current.focus();
      }
    }
  };


  return (
    <div
      className={`${isFullWidth ? "md:col-span-2" : "col-span-1"} flex flex-col`}
    >
      {label && <FieldLabel required={required}>{label}</FieldLabel>}

      <input
        ref={inputRef}
        type={type}
        name={name}
        // ล้างคำว่า null ออกเวลาแก้ไข
        value={cleanVal(value)} 
        onChange={onChange}
        onClick={handleInputClick}
        placeholder={placeholder}
        className={`w-full p-3 bg-gray-50 border border-gray-200 rounded-2xl 
          focus:outline-none focus:border-[#f3a638] transition-all 
          placeholder:text-gray-400 font-medium text-gray-700
          ${type === "date" ? "cursor-pointer" : ""}`}
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

    let finalValue = type === "checkbox" ? checked : value;

    // 🛠️ แก้ไข: เปลี่ยนให้เป็น camelCase (i เล็ก) เพื่อให้ตรงกับโครงสร้างหลัก
    if (name === "internetDeviceCount") {
      finalValue = value === "" ? "" : Math.max(0, parseInt(value, 10) || 0);
    }

    setFormData((prev) => ({
      ...prev,
      [name]: finalValue,
    }));
  };

  const handleNumberChange = (e, maxLength=null) => {
    const { name, value } = e.target;
    const onlyNums = value.replace(/[^0-9]/g, "");
    if (maxLength && onlyNums.length <= maxLength) {
      setFormData((prev) => ({ ...prev, [name]: onlyNums }));
    } else if (!maxLength) {
      setFormData((prev) => ({ ...prev, [name]: onlyNums }));
    }
  }; 

  const handleSave = () => {
    onSave(formData);
    setIsEditMode(false);
  };

  if (!isOpen || !tenant) return null;

  // --- ตัวแปรสำหรับจัดเตรียมข้อมูลโชว์ (ล้างคำว่า null ก่อน) ---
  const showAltName = cleanVal(formData.altName);
  const showAltRel = cleanVal(formData.altRelationship);
  const showAltContact = showAltName ? `${showAltName} ${showAltRel ? `(${showAltRel})` : ""}` : "-";

  const showVeh1 = cleanVal(formData.vehicleNum1);
  const showVeh2 = cleanVal(formData.vehicleNum2);
  let showVehicle = "-";
  if (showVeh1 && showVeh2) showVehicle = `${showVeh1} / ${showVeh2}`;
  else if (showVeh1) showVehicle = showVeh1;
  else if (showVeh2) showVehicle = showVeh2;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
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
          <div className="flex flex-row-reverse items-center gap-2 md:gap-3 shrink-0">
            <ExitButton onClick={onClose} />
            {!isEditMode ? (
              <button
                onClick={() => setIsEditMode(true)}
                className="flex items-center gap-2 p-2 md:px-5 md:py-2 bg-orange-100 text-[#f3a638] rounded-2xl font-black hover:bg-orange-200 transition-all text-xs md:text-sm shadow-sm"
              >
                <Edit3 size={16} />
                <span className="hidden sm:inline">แก้ไข</span>
              </button>
            ) : (
              <div className="flex flex-row-reverse items-center gap-2">
                <button
                  onClick={handleSave}
                  className="flex items-center gap-2 p-2 md:px-5 md:py-2 rounded-2xl font-black shadow-sm bg-[#D5F5E3] text-[#1D8348] hover:brightness-95 transition-all text-xs md:text-sm"
                  title="บันทึก"
                >
                  <Save size={16} />
                  <span className="hidden sm:inline">บันทึก</span>
                </button>
                <button
                  onClick={() => {
                    setIsEditMode(false);
                    setFormData(tenant);
                  }}
                  className="flex items-center gap-2 p-2 md:px-5 md:py-2 bg-gray-100 text-gray-500 rounded-2xl font-black hover:bg-gray-200 transition-all text-xs md:text-sm"
                  title="ยกเลิก"
                >
                  <CircleChevronLeft size={16} />
                  <span className="hidden sm:inline">ยกเลิก</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* --- Body: ส่วนเนื้อหาที่ Scroll ได้ --- */}
        <div className="flex-1 overflow-y-auto p-6 md:py-4 md:px-10 bg-white">
          <div className="flex flex-col lg:flex-row gap-10">
            {/* Sidebar: Photo & Quick Status */}
            <div className="w-full max-w-50 mx-auto lg:mx-0 flex flex-col gap-5">
              <div className="w-full aspect-square bg-gray-50 rounded-[35px] border-2 border-gray-200 overflow-hidden flex items-center justify-center relative group transition-all">
                {formData.photo && formData.photo !== "null" ? (
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

                {/* Overlay แสดงเฉพาะตอนโหมดแก้ไข */}
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
                  <span className="text-sm font-bold text-gray-700">ซักรีด</span>
                  {isEditMode ? (
                    <input
                      type="checkbox"
                      name="isLaundryService"
                      checked={formData.isLaundryService || false}
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
                  <span className="text-sm font-bold text-gray-700">อินเตอร์เน็ต</span>
                  {isEditMode ? (
                    <input
                      type="number"
                      name="internetDeviceCount" // ✨ เปลี่ยนชื่อ Name ให้เป็น i เล็กตรงกับ Data
                      value={formData.internetDeviceCount ?? ""} // ✨ ดึงค่าตัวแปร i เล็ก
                      onChange={handleChange}
                      min="0"
                      onKeyDown={(e) => {
                        if (e.key === "-" || e.key === "e") {
                          e.preventDefault();
                        }
                      }}
                      className="w-12 bg-white rounded-lg text-center font-bold text-[#f3a638] focus:outline-none border border-gray-100"
                    />
                  ) : (
                    <span className="text-[11px] font-black px-3 py-1 bg-[#f3a638] text-white rounded-full">
                      {/* ✨ ดึงค่าตัวแปร i เล็กมาแสดงผล */}
                      {formData.internetDeviceCount || 0} เครื่อง
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
                  <div className="col-span-1 flex flex-col ">
                    <label className="text-[13px] font-bold text-gray-500 ml-1">คำนำหน้า</label>
                    <select
                      name="title"
                      value={formData.title || ""}
                      onChange={handleChange}
                      className="w-full p-3 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:border-[#f3a638] transition-all font-medium text-gray-700 cursor-pointer"
                    >
                      <option value="นาย">นาย</option>
                      <option value="นางสาว">นางสาว</option>
                      <option value="นาง">นาง</option>
                    </select>
                  </div>
                  <EditInput label="ชื่อจริง" name="firstName" value={formData.firstName} onChange={handleChange} required />
                  <EditInput label="นามสกุล" name="lastName" value={formData.lastName} onChange={handleChange} required />
                  <EditInput label="เลขบัตรประชาชน" name="nin" value={formData.nin} onChange={(e) => handleNumberChange(e, 13)}/>
                  <DateInput label="วันเกิด" name="birthDate" value={formData.birthDate} onChange={handleChange} />
                </>
              ) : (
                <>
                  <DisplayItem
                    label="ชื่อ - นามสกุล"
                    value={`${cleanVal(formData.title)}${cleanVal(formData.firstName)} ${cleanVal(formData.lastName)}`}
                    icon={User}
                    isFullWidth
                  />
                  <DisplayItem label="เลขบัตรประชาชน" value={cleanVal(formData.nin)} icon={CreditCard} />
                  <DisplayItem label="วันเกิด" value={toThaiDate(cleanVal(formData.birthDate))} icon={Calendar} />
                </>
              )}

              <SectionHeader title="การติดต่อ & ที่อยู่" icon={Phone} />
              {isEditMode ? (
                <>
                  <EditInput label="เบอร์โทรศัพท์" name="phone" value={formData.phone} onChange={(e) => handleNumberChange(e, 10)}/>
                  <EditInput label="Line ID" name="lineId" value={formData.lineId} onChange={handleChange} />
                  <EditInput label="อีเมล" name="email" value={formData.email} onChange={handleChange} isFullWidth />
                  <div className="col-span-1 md:col-span-2 flex flex-col">
                    <FieldLabel>ที่อยู่</FieldLabel>
                    <textarea
                      name="address"
                      value={cleanVal(formData.address)}
                      onChange={handleChange}
                      rows="2"
                      className="w-full p-3 bg-gray-50 border border-gray-200 rounded-2xl min-h-20 focus:outline-none focus:border-[#f3a638] transition-all font-medium text-gray-700"
                      placeholder="กรอกที่อยู่ปัจจุบัน..."
                    />
                  </div>
                </>
              ) : (
                <>
                  <DisplayItem label="เบอร์โทรศัพท์" value={cleanVal(formData.phone)} icon={Phone} />
                  <DisplayItem label="Line ID" value={cleanVal(formData.lineId)} />
                  <DisplayItem label="อีเมล" value={cleanVal(formData.email)} icon={Mail} isFullWidth />
                  <DisplayItem label="ที่อยู่" value={cleanVal(formData.address)} icon={MapPin} isFullWidth />
                </>
              )}

              <SectionHeader title="ติดต่อฉุกเฉิน & ทรัพย์สิน" icon={ShieldCheck} />
              {isEditMode ? (
                <>
                  <EditInput label="ผู้ติดต่อสำรอง" name="altName" value={formData.altName} onChange={handleChange} />
                  <EditInput label="ความสัมพันธ์" name="altRelationship" value={formData.altRelationship} onChange={handleChange} />
                  <EditInput label="เบอร์สำรอง" name="altPhone" value={formData.altPhone} onChange={(e) => handleNumberChange(e, 10)} isFullWidth />
                  <EditInput label="ทะเบียนรถ 1" name="vehicleNum1" value={formData.vehicleNum1} onChange={handleChange} />
                  <EditInput label="รายละเอียดรถ 1" name="vehicleDetail1" value={formData.vehicleDetail1} onChange={handleChange} />
                  <EditInput label="ทะเบียนรถ 2" name="vehicleNum2" value={formData.vehicleNum2} onChange={handleChange} />
                  <EditInput label="รายละเอียดรถ 2" name="vehicleDetail2" value={formData.vehicleDetail2} onChange={handleChange} />
                  <div className="col-span-1 md:col-span-2 grid grid-cols-3 gap-3 ">
                    <EditInput label="คีย์การ์ด 1" name="keyCard1" value={formData.keyCard1} onChange={handleChange} />
                    <EditInput label="คีย์การ์ด 2" name="keyCard2" value={formData.keyCard2} onChange={handleChange} />
                    <EditInput label="คีย์การ์ด 3" name="keyCard3" value={formData.keyCard3} onChange={handleChange} />
                  </div>
                </>
              ) : (
                <>
                  <DisplayItem label="บุคคลติดต่อสำรอง" value={showAltContact} />
                  <DisplayItem label="เบอร์โทรศัพท์สำรอง" value={cleanVal(formData.altPhone)} icon={Phone} />
                  <DisplayItem label="ทะเบียนรถ" value={showVehicle} icon={Car} />
                  <div className="col-span-1 md:col-span-2 flex flex-col gap-1">
                    <span className="text-[13px] font-bold text-gray-400 ml-1">รายการคีย์การ์ด</span>
                    <div className="flex gap-2">
                      {[formData.keyCard1, formData.keyCard2, formData.keyCard3].map((card, idx) => {
                        const cleanCard = cleanVal(card);
                        return (
                          <span
                            key={idx}
                            className="px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-600"
                          >
                            {cleanCard || "-"}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                </>
              )}

              {/* <SectionHeader title="หมายเหตุ" icon={FileText} />
              <div className="col-span-1 md:col-span-2 mb-8">
                {isEditMode ? (
                  <textarea
                    name="note"
                    value={cleanVal(formData.note)}
                    onChange={handleChange}
                    rows="3"
                    className="w-full p-4 bg-gray-50 border border-gray-200 rounded-[30px] min-h-25 focus:outline-none focus:border-[#f3a638] transition-all font-medium text-gray-700"
                    placeholder="บันทึกข้อมูลเพิ่มเติม..."
                  />
                ) : (
                  <div className="p-5 bg-orange-50/30 border border-orange-100 rounded-3xl text-gray-600 italic text-sm">
                    {cleanVal(formData.note) || "- ไม่มีบันทึกเพิ่มเติม -"}
                  </div>
                )}
              </div> */}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TenantInfoModal;