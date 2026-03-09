import React, { useState, useRef } from "react";
import {
  User,
  Phone,
  Mail,
  Lock,
  Shield,
  Save,
  X,
  Edit2,
  Key,
  Upload,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  Camera,
  ChevronRight,
} from "lucide-react";

import { ExitButton, ConfirmModal} from "../components/ActionButtons";
import { useNavigate } from "react-router-dom";

// --- Sub-Components ---
const DisplayItem = ({ label, value, icon: Icon, isFullWidth, isImage }) => (
  <div
    className={`${isFullWidth ? "md:col-span-2" : "col-span-1"} flex flex-col gap-1`}
  >
    <span className="text-[13px] font-bold text-gray-500 ml-1">{label}</span>
    <div className="w-full p-2 bg-gray-50 border border-gray-200 rounded-2xl flex items-center gap-3 text-gray-700 font-medium min-h-[54px]">
      {Icon && <Icon size={18} className="text-[#f3a638] shrink-0" />}
      {isImage ? (
        value ? (
          <img
            src={value}
            alt="Signature"
            className="px-8! h-25 object-contain"
          />
        ) : (
          <span className="text-gray-400 italic">ไม่มีรูปภาพ</span>
        )
      ) : (
        <span className="truncate">{value || "-"}</span>
      )}
    </div>
  </div>
);

// เพิ่มส่วนแสดง Error ใน EditInput
const EditInput = ({
  label,
  name,
  value,
  onChange,
  type = "text",
  isFullWidth,
  required,
  placeholder,
  icon: Icon,
  readOnly,
  error,
  showEye,
  onEyeClick,
  eyeOpen,
}) => (
  <div
    className={`${isFullWidth ? "md:col-span-2" : "col-span-1"} flex flex-col gap-1`}
  >
    <label className="text-[13px] font-bold text-gray-500 ml-1">
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    <div className="relative flex items-center">
      {Icon && (
        <Icon
          size={18}
          className={`absolute left-4 ${error ? "text-red-400" : "text-gray-400"} shrink-0`}
        />
      )}
      <input
        name={name}
        type={type === "password" ? (eyeOpen ? "text" : "password") : type}
        value={value || ""}
        onChange={onChange}
        readOnly={readOnly}
        placeholder={placeholder}
        className={`w-full ${Icon ? "pl-11" : "pl-4"} ${showEye ? "pr-12" : "pr-4"} pr-4 py-3 border rounded-2xl outline-none transition-all text-gray-700 
          ${
            readOnly
              ? "bg-gray-100 cursor-not-allowed border-gray-200"
              : error
                ? "bg-red-50 border-red-500 focus:ring-1 focus:ring-red-500"
                : "bg-white border-gray-200 focus:ring focus:ring-[#f3a638] focus:border-transparent"
          }`}
      />
      {showEye && (
        <button
          type="button"
          onClick={onEyeClick}
          className="absolute right-4 text-gray-400 hover:text-[#f3a638] transition-colors"
        >
          {eyeOpen ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      )}
    </div>
    {error && (
      <span className="text-[11px] text-red-500 ml-2 font-medium">{error}</span>
    )}
  </div>
);

const AdminSetting = () => {
  const [isEditing, setIsEditing] = useState(false);
  const [showPasswordForm, setShowPasswordForm] = useState(false); // เพิ่ม: คุมการเปิดปิดกล่องรหัสผ่าน
  const fileInputRef = useRef(null);
  const photoInputRef = useRef(null); // เพิ่ม: ref สำหรับรูปแอดมิน
  const [showConfirm, setShowConfirm] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [errors, setErrors] = useState({});
  const navigate = useNavigate();

  // เพิ่ม: สถานะการเปิด-ปิดตาของแต่ละช่องรหัสผ่าน
  const [eyeStates, setEyeStates] = useState({
    old: false,
    new: false,
    confirm: false,
  });

  const [adminData, setAdminData] = useState({
    Id: "1",
    Photo: null, // เพิ่ม: เก็บรูปโปรไฟล์
    Title: "นาย",
    FirstName: "สมชาย",
    LastName: "ใจดี",
    Phone: "0812345678",
    Email: "somchai.admin@example.com",
    Signature: null,
  });

  // เพิ่ม: สถานะข้อมูลรหัสผ่าน
  const [pwdData, setPwdData] = useState({
    old: "",
    new: "",
    confirm: "",
  });

  const validateForm = () => {
    let newErrors = {};
    if (!adminData.Title) newErrors.Title = "กรุณาเลือกคำนำหน้า";
    if (!adminData.FirstName?.trim()) newErrors.FirstName = "กรุณากรอกชื่อจริง";
    if (!adminData.LastName?.trim()) newErrors.LastName = "กรุณากรอกนามสกุล";
    if (!adminData.Phone?.trim()) newErrors.Phone = "กรุณากรอกเบอร์โทรศัพท์";

    // เพิ่ม: ตรวจสอบข้อมูลรหัสผ่านหากมีการเปิดใช้งาน
    if (showPasswordForm) {
      if (!pwdData.old) newErrors.pwdOld = "กรุณากรอกรหัสผ่านเดิม";
      if (!pwdData.new) newErrors.pwdNew = "กรุณากรอกรหัสผ่านใหม่";
      if (pwdData.new !== pwdData.confirm)
        newErrors.pwdConfirm = "รหัสผ่านใหม่ไม่ตรงกัน";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSaveClick = () => {
    if (validateForm()) {
      setShowConfirm(true);
    }
  };

  const handleConfirmSave = () => {
    setShowConfirm(false);
    setIsEditing(false);
    setShowPasswordForm(false); // ปิดฟอร์มรหัสผ่านหลังบันทึก
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 2000);
  };

  // ปรับปรุง: ให้รองรับทั้งการเลือกรูปโปรไฟล์และลายเซ็น
  const handleFileChange = (e, type = "signature") => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (type === "photo") {
          setAdminData((prev) => ({ ...prev, Photo: reader.result }));
        } else {
          setAdminData((prev) => ({ ...prev, Signature: reader.result }));
        }
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    /* 1. ใช้ h-[100dvh] เพื่อความแม่นยำบนมือถือ และ overflow-hidden เพื่อหยุดการ scroll ทั้งหน้า */
    <div className="max-w-4xl mx-auto h-[90dvh] flex flex-col relative overflow-hidden bg-white">
      <div className="relative text-center mb-8">
        <ExitButton
          onClick={() => navigate(-1)}
          className="absolute p-2 right-0 hover:bg-gray-100 rounded-full transition-colors"
        ></ExitButton>
      </div>
      {/* 2. Header: ใช้ sticky และ z-index เพื่อให้อยู่บนสุดและนิ่งสนิท */}
      <div className="sticky top-0 z-20 px-4 md:px-10 mb-2 md:mb-0 shrink-0 ">
        <div className="flex justify-between items-center gap-2">
          <h3 className="text-xl text-[24px] font-black text-gray-800">
            ข้อมูลแอดมิน
          </h3>
          <div className="flex items-center gap-2">
            {isEditing ? (
              <>
                <button
                  onClick={() => {
                    setIsEditing(false);
                    setShowPasswordForm(false); 
                    setPwdData({ old: "", new: "", confirm: "" });
                    setErrors({});
                  }}
                  className="px-4 py-2 md:px-5 rounded-full font-bold flex items-center gap-2 bg-gray-100 text-gray-600 hover:bg-gray-200 text-sm md:text-base"
                >
                  <X size={16} />{" "}
                  <span className="hidden sm:inline">ยกเลิก</span>
                </button>
                <button
                  onClick={handleSaveClick}
                  className="px-4 py-2 md:px-5 rounded-full font-bold flex items-center gap-2 bg-[#f3a638] hover:bg-[#e6952e] text-white shadow-md text-sm md:text-base"
                >
                  <Save size={16} /> บันทึก
                </button>
              </>
            ) : (
              <button
                onClick={() => {
                  setIsEditing(true);
                  setShowPasswordForm(false);
                }}
                className="px-5 py-2 rounded-full font-bold flex items-center gap-2  text-white bg-[#f3a638] hover:bg-[#e6952e] "
              >
                <Edit2 size={16} /> แก้ไข
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 3. ส่วนเนื้อหา: ใส่ px ที่นี่แทนข้างบนเพื่อให้ scrollbar อยู่ชิดขอบจอพอดี */}
      <div className="flex-1 overflow-y-auto px-4 md:px-8 pt-6 pb-24 custom-scrollbar">
        <div className="bg-white rounded-3xl border border-gray-200 p-6 md:p-8">
          {/* Section: Profile Photo */}
          <div className="flex flex-col items-center gap-4 mb-3">
            <div className="relative group">
              <div className="w-32 h-32 rounded-full border-2 border-gray-200 overflow-hidden bg-gray-100 ">
                {adminData.Photo ? (
                  <img
                    src={adminData.Photo}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User size={48} className="w-full h-full p-8 text-gray-300" />
                )}
              </div>
              {isEditing && (
                <button
                  onClick={() => photoInputRef.current.click()}
                  className="absolute bottom-1 right-1 bg-[#f3a638] text-white p-2.5 rounded-full shadow-lg hover:scale-110 transition-transform"
                >
                  <Camera size={18} />
                </button>
              )}
              <input
                type="file"
                ref={photoInputRef}
                onChange={(e) => handleFileChange(e, "photo")}
                className="hidden"
                accept="image/*"
              />
            </div>
            <p className="text-sm text-gray-400">รูปโปรไฟล์แอดมิน</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {isEditing ? (
              <>
                <EditInput
                  label="รหัสแอดมิน"
                  value={adminData.Id}
                  readOnly
                  icon={Shield}
                />

                {/* คำนำหน้า (Select) พร้อมแสดง Error */}
                <div className="col-span-1 flex flex-col gap-1">
                  <label className="text-[13px] font-bold text-gray-500 ml-1">
                    คำนำหน้า <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={adminData.Title}
                    onChange={(e) => {
                      setAdminData({ ...adminData, Title: e.target.value });
                      setErrors({ ...errors, Title: "" });
                    }}
                    className={`w-full p-3.5 border rounded-2xl focus:outline-none transition-all font-medium text-gray-700 cursor-pointer 
                    ${errors.Title ? "border-red-500 bg-red-50" : "border-gray-200 bg-gray-50 focus:border-[#f3a638]"}`}
                  >
                    <option value="นาย">นาย</option>
                    <option value="นางสาว">นางสาว</option>
                    <option value="นาง">นาง</option>
                  </select>
                  {errors.Title && (
                    <span className="text-[11px] text-red-500 ml-2 font-medium">
                      {errors.Title}
                    </span>
                  )}
                </div>

                <EditInput
                  label="ชื่อจริง"
                  value={adminData.FirstName}
                  onChange={(e) => {
                    setAdminData({ ...adminData, FirstName: e.target.value });
                    setErrors({ ...errors, FirstName: "" });
                  }}
                  icon={User}
                  required
                  error={errors.FirstName}
                />

                <EditInput
                  label="นามสกุล"
                  value={adminData.LastName}
                  onChange={(e) => {
                    setAdminData({ ...adminData, LastName: e.target.value });
                    setErrors({ ...errors, LastName: "" });
                  }}
                  icon={User}
                  required
                  error={errors.LastName}
                />

                <EditInput
                  label="เบอร์โทรศัพท์"
                  value={adminData.Phone}
                  onChange={(e) => {
                    setAdminData({ ...adminData, Phone: e.target.value });
                    setErrors({ ...errors, Phone: "" });
                  }}
                  icon={Phone}
                  required
                  error={errors.Phone} // เพิ่ม error ตรงนี้
                />

                <EditInput
                  label="อีเมล"
                  value={adminData.Email}
                  onChange={(e) =>
                    setAdminData({ ...adminData, Email: e.target.value })
                  }
                  icon={Mail}
                />

                {/* Signature Block */}
                <div className="md:col-span-2 flex flex-col gap-1">
                  <label className="text-[13px] font-bold text-gray-500 ml-1">
                    ลายเซ็น (Signature)
                  </label>
                  <div
                    onClick={() => fileInputRef.current.click()}
                    className="w-full p-4 border border-dashed border-gray-100 rounded-2xl flex flex-col items-center justify-center gap-2 hover:border-[#f3a638] cursor-pointer bg-gray-50 transition-colors"
                  >
                    {adminData.Signature ? (
                      <img
                        src={adminData.Signature}
                        className="h-20 object-contain"
                      />
                    ) : (
                      <>
                        <Upload size={20} className="text-gray-400" />
                        <span className="text-xs text-gray-400">
                          อัปโหลดรูปภาพลายเซ็น
                        </span>
                      </>
                    )}
                  </div>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={(e) => handleFileChange(e, "sig")}
                    className="hidden"
                    accept="image/*"
                  />
                </div>

                {/* Password Section */}
                <div className="md:col-span-2 ">
                  {!showPasswordForm ? (
                    <button
                      type="button"
                      onClick={() => setShowPasswordForm(true)}
                      className="w-[50%] py-3 bg-[#f3a638] hover:bg-[#e6952e]  text-white  rounded-2xl font-black flex items-center justify-center gap-2 transition-colors"
                    >
                      แก้ไขรหัสผ่าน
                      <ChevronRight size={18} />
                    </button>
                  ) : (
                    <div className="bg-orange-50/50 p-6 rounded-[2rem] border border-orange-300 space-y-4 animate-in slide-in-from-top-4 duration-300">
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-black text-[#f3a638] flex items-center gap-2">
                          <Lock size={18} /> เปลี่ยนรหัสผ่านใหม่
                        </span>
                        <button
                          onClick={() => setShowPasswordForm(false)}
                          className="text-gray-400 hover:text-black"
                        >
                          <X size={20} />
                        </button>
                      </div>
                      <EditInput
                        label="รหัสผ่านเดิม"
                        type="password"
                        value={pwdData.old}
                        onChange={(e) =>
                          setPwdData({ ...pwdData, old: e.target.value })
                        }
                        error={errors.pwdOld}
                        showEye
                        eyeOpen={eyeStates.old}
                        onEyeClick={() =>
                          setEyeStates({ ...eyeStates, old: !eyeStates.old })
                        }
                      />
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <EditInput
                          label="รหัสผ่านใหม่"
                          type="password"
                          value={pwdData.new}
                          onChange={(e) =>
                            setPwdData({ ...pwdData, new: e.target.value })
                          }
                          error={errors.pwdNew}
                          showEye
                          eyeOpen={eyeStates.new}
                          onEyeClick={() =>
                            setEyeStates({ ...eyeStates, new: !eyeStates.new })
                          }
                        />
                        <EditInput
                          label="ยืนยันรหัสผ่านใหม่"
                          type="password"
                          value={pwdData.confirm}
                          onChange={(e) =>
                            setPwdData({ ...pwdData, confirm: e.target.value })
                          }
                          error={errors.pwdConfirm}
                          showEye
                          eyeOpen={eyeStates.confirm}
                          onEyeClick={() =>
                            setEyeStates({
                              ...eyeStates,
                              confirm: !eyeStates.confirm,
                            })
                          }
                        />
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                {/* --- โหมดแสดงผล --- */}
                <DisplayItem
                  label="รหัสแอดมิน"
                  value={adminData.Id}
                  icon={Shield}
                />
                <div className="hidden md:block" />
                <DisplayItem
                  label="ชื่อ-นามสกุล"
                  value={`${adminData.Title}${adminData.FirstName} ${adminData.LastName}`}
                  icon={User}
                  isFullWidth
                />
                <DisplayItem
                  label="เบอร์โทรศัพท์"
                  value={adminData.Phone}
                  icon={Phone}
                />
                <DisplayItem
                  label="อีเมล"
                  value={adminData.Email}
                  icon={Mail}
                />
                <DisplayItem
                  label="ลายเซ็นกำกับ (Signature)"
                  value={adminData.Signature}
                  isImage
                  isFullWidth
                />
              </>
            )}
          </div>
        </div>
      </div>

      {/* --- Pop-ups (อยู่นอก Container หลักเพื่อให้ลอยทับทุกอย่าง) --- */}
      <ConfirmModal
        isOpen={showConfirm}
        onClose={() => setShowConfirm(false)}
        onConfirm={handleConfirmSave}
        title="ยืนยันการแก้ไข"
        description="คุณแน่ใจใช่หรือไม่ว่าต้องการเปลี่ยนแปลงข้อมูลแอดมิน?"
      />

      {showSuccess && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[110] w-[90%] md:w-auto min-w-[320px] px-6 md:px-8 py-4 bg-[#f3a638] hover:bg-[#e6952e] text-white rounded-2xl shadow-xl flex items-center justify-center md:justify-start gap-3 animate-in slide-in-from-top duration-300">
          <CheckCircle2 size={24} className="shrink-0" />
          <span className="font-black whitespace-nowrap">
            แก้ไขข้อมูลแอดมินสำเร็จ
          </span>
        </div>
      )}
    </div>
  );
};

export default AdminSetting;
