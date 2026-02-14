import React, { useState, useRef } from 'react';
import { User, Phone, Mail, Lock, Shield, Save, X, Edit2, Key, Upload, CheckCircle2, AlertCircle } from 'lucide-react';
import { ExitButton } from '../components/ActionButtons';

// --- Sub-Components ---
const DisplayItem = ({ label, value, icon: Icon, isFullWidth, isImage }) => (
  <div className={`${isFullWidth ? "md:col-span-2" : "col-span-1"} flex flex-col gap-1`}>
    <span className="text-[13px] font-bold text-gray-500 ml-1">{label}</span>
    <div className="w-full p-2 bg-gray-50 border border-gray-200 rounded-2xl flex items-center gap-3 text-gray-700 font-medium min-h-[54px]">
      {Icon && <Icon size={18} className="text-[#f3a638] shrink-0" />}
      {isImage ? (
        value ? <img src={value} alt="Signature" className="px-8! h-25 object-contain" /> : <span className="text-gray-400 italic">ไม่มีรูปภาพ</span>
      ) : (
        <span className="truncate">{value || "-"}</span>
      )}
    </div>
  </div>
);

// เพิ่มส่วนแสดง Error ใน EditInput
const EditInput = ({ label, name, value, onChange, type = "text", isFullWidth, required, placeholder, icon: Icon, readOnly, error }) => (
  <div className={`${isFullWidth ? "md:col-span-2" : "col-span-1"} flex flex-col gap-1`}>
    <label className="text-[13px] font-bold text-gray-500 ml-1">{label} {required && <span className="text-red-500">*</span>}</label>
    <div className="relative flex items-center">
      {Icon && <Icon size={18} className={`absolute left-4 ${error ? "text-red-400" : "text-gray-400"} shrink-0`} />}
      <input
        name={name}
        type={type}
        value={value || ""}
        onChange={onChange}
        readOnly={readOnly}
        placeholder={placeholder}
        className={`w-full ${Icon ? "pl-11" : "pl-4"} pr-4 py-3 border rounded-2xl outline-none transition-all text-gray-700 
          ${readOnly ? "bg-gray-100 cursor-not-allowed border-gray-200" : 
            error ? "bg-red-50 border-red-500 focus:ring-1 focus:ring-red-500" : "bg-white border-gray-200 focus:ring focus:ring-[#f3a638] focus:border-transparent"}`}
      />
    </div>
    {error && <span className="text-[11px] text-red-500 ml-2 font-medium">{error}</span>}
  </div>
);

const AdminSettings = () => {
  const [isEditing, setIsEditing] = useState(false);
  const fileInputRef = useRef(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [errors, setErrors] = useState({}); // เก็บ Error ของแต่ละ Field
  
  const [adminData, setAdminData] = useState({
    Id: "1",
    Title: "นาย",
    FirstName: "สมชาย",
    LastName: "ใจดี",
    Phone: "0812345678",
    Email: "somchai.admin@example.com",
    Signature: null, 
  });

  const validateForm = () => {
    let newErrors = {};
    if (!adminData.Title) newErrors.Title = "กรุณาเลือกคำนำหน้า";
    if (!adminData.FirstName?.trim()) newErrors.FirstName = "กรุณากรอกชื่อจริง";
    if (!adminData.LastName?.trim()) newErrors.LastName = "กรุณากรอกนามสกุล";
    if (!adminData.Phone?.trim()) newErrors.Phone = "กรุณากรอกเบอร์โทรศัพท์";
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0; 
  };

  const handleSaveClick = () => {
    if (validateForm()) {
      setShowConfirm(true); // ถ้าผ่านเงื่อนไขค่อยเปิด Pop-up
    }
  };

  const handleConfirmSave = () => {
    setShowConfirm(false);
    setIsEditing(false);
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 2000);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setAdminData(prev => ({ ...prev, Signature: reader.result }));
      reader.readAsDataURL(file);
    }
  };

  return (

    
/* 1. ใช้ h-[100dvh] เพื่อความแม่นยำบนมือถือ และ overflow-hidden เพื่อหยุดการ scroll ทั้งหน้า */
    
    <div className="max-w-4xl mx-auto h-[90dvh] flex flex-col relative overflow-hidden bg-white">
      {/* ปุ่ม Exit: วางไว้บนสุดเพื่อให้ลอยอยู่เหนือ Content ทั้งหมด */}
  {/* <ExitButton
    onClick={() => navigate(-1)}
    // ปรับ right และ top ให้มีระยะห่างจากขอบเล็กน้อยเพื่อความสวยงาม (เช่น 4 หรือ 6)
    // หรือถ้าต้องการชิดขอบเป๊ะๆ ให้ใช้ right-0 top-0
    className="absolute right-4 top-4 z-[30] hover:scale-110 transition-transform"
  /> */}
  
      {/* 2. Header: ใช้ sticky และ z-index เพื่อให้อยู่บนสุดและนิ่งสนิท */}
      <div className="sticky top-0 z-20 px-4 md:px-10 mb-2 md:mb-0 shrink-0 ">
        <div className="flex justify-between items-center gap-2">
          <h3 className="text-xl text-[24px] font-black text-gray-800">ข้อมูลแอดมิน</h3>
          <div className="flex items-center gap-2">
            {isEditing ? (
              <>
                <button 
                  onClick={() => { setIsEditing(false); setErrors({}); }}
                  className="px-4 py-2 md:px-5 rounded-full font-bold flex items-center gap-2 bg-gray-100 text-gray-600 hover:bg-gray-200 text-sm md:text-base"
                >
                  <X size={16}/> <span className="hidden sm:inline">ยกเลิก</span>
                </button>
                <button 
                  onClick={handleSaveClick}
                  className="px-4 py-2 md:px-5 rounded-full font-bold flex items-center gap-2 bg-[#f3a638] hover:bg-[#e6952e] text-white shadow-md text-sm md:text-base"
                >
                  <Save size={16}/> บันทึก
                </button>
              </>
            ) : (
              <button 
                onClick={() => setIsEditing(true)}
                className="px-5 py-2 rounded-full font-bold flex items-center gap-2  text-white bg-[#f3a638] hover:bg-[#e6952e] "
              >
                <Edit2 size={16}/> แก้ไข
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 3. ส่วนเนื้อหา: ใส่ px ที่นี่แทนข้างบนเพื่อให้ scrollbar อยู่ชิดขอบจอพอดี */}
      <div className="flex-1 overflow-y-auto px-4 md:px-8 pt-6 pb-24 custom-scrollbar">
        <div className="bg-white rounded-3xl border border-gray-200 p-6 md:p-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {isEditing ? (
            <>
              <EditInput label="รหัสแอดมิน" value={adminData.Id} readOnly icon={Shield} />
              
              {/* คำนำหน้า (Select) พร้อมแสดง Error */}
              <div className="col-span-1 flex flex-col gap-1">
                <label className="text-[13px] font-bold text-gray-500 ml-1">คำนำหน้า <span className="text-red-500">*</span></label>
                <select
                  value={adminData.Title}
                  onChange={(e) => {
                    setAdminData({...adminData, Title: e.target.value});
                    setErrors({...errors, Title: ""});
                  }}
                  className={`w-full p-3.5 border rounded-2xl focus:outline-none transition-all font-medium text-gray-700 cursor-pointer 
                    ${errors.Title ? "border-red-500 bg-red-50" : "border-gray-200 bg-gray-50 focus:border-[#f3a638]"}`}
                >
                  <option value="นาย">นาย</option>
                  <option value="นางสาว">นางสาว</option>
                  <option value="นาง">นาง</option>
                </select>
                {errors.Title && <span className="text-[11px] text-red-500 ml-2 font-medium">{errors.Title}</span>}
              </div>

              <EditInput 
                label="ชื่อจริง" 
                value={adminData.FirstName} 
                onChange={(e) => {
                  setAdminData({...adminData, FirstName: e.target.value});
                  setErrors({...errors, FirstName: ""});
                }} 
                icon={User} 
                required 
                error={errors.FirstName}
              />
              
              <EditInput 
                label="นามสกุล" 
                value={adminData.LastName} 
                onChange={(e) => {
                  setAdminData({...adminData, LastName: e.target.value});
                  setErrors({...errors, LastName: ""});
                }} 
                icon={User} 
                required 
                error={errors.LastName}
              />

              <EditInput 
                label="เบอร์โทรศัพท์" 
                value={adminData.Phone} 
                onChange={(e) => {
                  setAdminData({...adminData, Phone: e.target.value});
                  setErrors({...errors, Phone: ""});
                }} 
                icon={Phone} 
                required 
                error={errors.Phone} // เพิ่ม error ตรงนี้
              />

              <EditInput label="อีเมล" value={adminData.Email} onChange={(e) => setAdminData({...adminData, Email: e.target.value})} icon={Mail} />              
              
              <div className="md:col-span-2 flex flex-col gap-1">
                <label className="text-[13px] font-bold text-gray-500 ml-1">ลายเซ็น (Signature)</label>
                <div onClick={() => fileInputRef.current.click()} className="w-full p-3 border border-dashed border-gray-200 rounded-2xl flex flex-col items-center justify-center gap-2 hover:border-[#f3a638] cursor-pointer transition-all bg-gray-50">
                  <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />
                  {adminData.Signature ? <img src={adminData.Signature} className="h-25 object-contain" /> : <><Upload className="text-gray-400" /> <span className="text-sm text-gray-500">อัปโหลดลายเซ็น</span></>}
                </div>
              </div>

              {/* <div className="md:col-span-2 mt-2">
                <button 
                  onClick={handleSaveClick} 
                  className="w-full bg-[#f3a638] text-white py-4 rounded-2xl flex items-center justify-center gap-2 hover:scale-[1.02] transition-transform"
                >
                บันทึกข้อมูล
                </button>
              </div> */}
            </>
          ) : (
            <>
              {/* --- โหมดแสดงผล --- */}
              <DisplayItem label="รหัสแอดมิน" value={adminData.Id} icon={Shield} />
              <div className="hidden md:block" />
              <DisplayItem label="ชื่อ-นามสกุล" value={`${adminData.Title}${adminData.FirstName} ${adminData.LastName}`} icon={User} isFullWidth />
              <DisplayItem label="เบอร์โทรศัพท์" value={adminData.Phone} icon={Phone} />
              <DisplayItem label="อีเมล" value={adminData.Email} icon={Mail} />
              <DisplayItem label="ลายเซ็นกำกับ (Signature)" value={adminData.Signature} isImage isFullWidth />
            </>
          )}
        </div>
      </div>
      </div>

      {/* --- Pop-ups (อยู่นอก Container หลักเพื่อให้ลอยทับทุกอย่าง) --- */}
      {showConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white w-full max-w-sm rounded-[32px] p-8 shadow-2xl scale-in-center">
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-orange-50 rounded-full flex items-center justify-center mb-4">
                <AlertCircle size={32} className="text-[#f3a638]" />
              </div>
              <h3 className="text-xl font-black text-gray-800 mb-2">ยืนยันการแก้ไข</h3>
              <p className="text-gray-500 mb-8">คุณแน่ใจใช่หรือไม่ว่าต้องการเปลี่ยนแปลงข้อมูลแอดมิน?</p>
              <div className="flex w-full gap-3">
                <button onClick={() => setShowConfirm(false)} className="flex-1 py-3.5 rounded-2xl font-bold text-gray-500 bg-gray-100 hover:bg-gray-200">ยกเลิก</button>
                <button onClick={handleConfirmSave} className="flex-1 py-3.5 rounded-2xl font-bold text-white bg-[#f3a638] hover:bg-[#e6952e]">ยืนยัน</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showSuccess && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[110] w-[90%] md:w-auto min-w-[320px] px-6 md:px-8 py-4 bg-[#f3a638] hover:bg-[#e6952e] text-white rounded-2xl shadow-xl flex items-center justify-center md:justify-start gap-3 animate-in slide-in-from-top duration-300">
  <CheckCircle2 size={24} className="shrink-0" />
  <span className="font-black whitespace-nowrap">แก้ไขข้อมูลแอดมินสำเร็จ</span>
</div>
      )}
    </div>
  );
};

export default AdminSettings;