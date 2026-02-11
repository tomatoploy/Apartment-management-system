import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  User,
  Info,
  Phone,
  ShieldCheck,
  FileText,
  Save,
  Camera,
  X,
} from "lucide-react";
import { ExitButton } from "../components/ActionButtons";
import { DateInput } from "../components/DateController";
import RoomHeader from "../components/RoomHeader";

// --- Internal Components ---
const FieldLabel = ({ children, required }) => (
  <label className="text-[13px] font-bold text-gray-500 mb-2 text-left block">
    {children} {required && <span className="text-red-500">*</span>}
  </label>
);

const FormInput = ({
  label,
  name,
  value,
  onChange,
  type = "text",
  required,
  placeholder,
  isFullWidth,
}) => (
  <div
    className={`${isFullWidth ? "md:col-span-2" : "col-span-1"} flex flex-col`}
  >
    {label && <FieldLabel required={required}>{label}</FieldLabel>}
    <input
      type={type}
      name={name}
      value={value || ""}
      onChange={onChange}
      placeholder={placeholder}
      className="w-full p-3 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:border-[#f3a638] transition-all font-medium text-gray-700"
    />
  </div>
);

const SectionHeader = ({ title, icon: Icon }) => (
  <div className="col-span-1 md:col-span-2 flex items-center gap-2 mt-3 mb-1 border-b border-gray-200 pb-2">
    <Icon size={18} className="text-[#f3a638]" />
    <h3 className="text-lg font-bold text-gray-800">{title}</h3>
  </div>
);

const AddTenant = () => {
  const { roomNumber } = useParams();
  const navigate = useNavigate();

  const initialForm = {
    roomNumber: roomNumber || "",
    nin: "",
    title: "นาย",
    firstName: "",
    lastName: "",
    nickName: "",
    phone: "",
    address: "",
    birthDate: "",
    lineId: "",
    email: "",
    photo: null,
    altName: "",
    altPhone: "",
    altRelationship: "",
    vehicleNum1: "",
    vehicleDetail1: "",
    vehicleNum2: "",
    vehicleDetail2: "",
    keyCard1: "",
    keyCard2: "",
    keyCard3: "",
    isLaundryService: false,
    internetDeviceCount: 0,
    note: "",
  };

  const [formData, setFormData] = useState(initialForm);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSave = () => {
    console.log("บันทึกข้อมูลผู้เช่า:", formData);
    // ใส่ logic การเชื่อมต่อ API ตรงนี้
    navigate(`/rooms/${roomNumber}`);
  };

  return (
    <RoomHeader roomNumber={roomNumber}>
      {/* Container ครอบฟอร์มให้มีสไตล์เหมือน Modal แต่แสดงเป็นหน้าเพจ */}
      <div className="bg-white rounded-3xl w-full max-w-4xl mx-auto flex flex-col overflow-hidden border border-gray-200">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 flex items-center justify-between bg-white">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-orange-50 rounded-2xl flex items-center justify-center text-[#f3a638]">
              <User size={28} strokeWidth={2.5} />
            </div>
            <div>
              <h2 className="text-2xl font-black text-gray-800">
                เพิ่มผู้เช่าใหม่
              </h2>
            </div>
          </div>
          <ExitButton onClick={() => navigate(-1)} />
        </div>

        {/* Body */}
        <div className="p-6 md:py-4 md:px-10  bg-white">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-5">
            {/* --- ส่วนที่แก้ไข: ปรับแถวแรกให้เป็น 3 คอลัมน์ --- */}
            <SectionHeader title="ข้อมูลส่วนบุคคล" icon={Info} />

            {/* ใช้ Grid 5 คอลัมน์ เพื่อแบ่งสัดส่วน 1:2:2 (รวมเป็น 5) จะทำให้ชื่อและนามสกุลดูยาวและสมดุล */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 col-span-1 md:col-span-2">
              {/* คำนำหน้า - ใช้ 1 ส่วน */}
              <div className="md:col-span-1 flex flex-col">
                <FieldLabel required>คำนำหน้า</FieldLabel>
                <select
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-2xl focus:border-[#f3a638] outline-none font-medium text-gray-700 transition-all cursor-pointer"
                >
                  <option value="นาย">นาย</option>
                  <option value="นางสาว">นางสาว</option>
                  <option value="นาง">นาง</option>
                </select>
              </div>

              {/* ชื่อจริง - ใช้ 2 ส่วน */}
              <div className="md:col-span-2">
                <FormInput
                  label="ชื่อจริง"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  required
                />
              </div>

              {/* นามสกุล - ใช้ 2 ส่วน */}
              <div className="md:col-span-2">
                <FormInput
                  label="นามสกุล"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>
            <FormInput
              label="เลขบัตรประชาชน"
              name="nin"
              value={formData.nin}
              onChange={handleChange}
              required
            />
            <DateInput
              label="วันเกิด"
              name="birthDate"
              value={formData.birthDate}
              onChange={handleChange}
            />

            <FormInput
              label="ชื่อเล่น"
              name="nickName"
              value={formData.nickName}
              onChange={handleChange}
            />

            {/* ส่วนอัพโหลดรูปภาพ */}
            <div className="col-span-1 flex flex-col">
              <FieldLabel>รูปถ่าย</FieldLabel>
              <div className="relative group w-fit">
                <div className="w-30 h-25 bg-gray-50 rounded-[25px] border-2 border-dashed border-gray-200 flex flex-col items-center justify-center overflow-hidden transition-all group-hover:border-[#f3a638] group-hover:bg-orange-50 cursor-pointer relative">
                  {formData.photo ? (
                    <img
                      src={formData.photo}
                      alt="Preview"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="flex flex-col items-center gap-1">
                      <Camera
                        size={20}
                        className="text-gray-300 group-hover:text-[#f3a638]"
                      />
                      <span className="text-[9px] font-black text-gray-400 uppercase tracking-tighter">
                        Add Photo
                      </span>
                    </div>
                  )}

                  {/* Input File ครอบทับทั้งหมดเพื่อให้กดง่าย */}
                  <input
                    type="file"
                    accept="image/*"
                    className="absolute inset-0 opacity-0 cursor-pointer"
                    onChange={(e) => {
                      const file = e.target.files[0];
                      if (file) {
                        // 1. เช็คขนาดไฟล์ (ป้องกันหน้าขาวจากไฟล์ใหญ่เกินไป เช่น เกิน 5MB)
                        if (file.size > 5 * 1024 * 1024) {
                          alert(
                            "ขนาดไฟล์ใหญ่เกินไป กรุณาเลือกรูปที่ไม่เกิน 5MB ครับ",
                          );
                          return;
                        }

                        const reader = new FileReader();
                        reader.onload = (event) => {
                          // 2. ใช้ฟังก์ชันอัปเดตแบบ Prev State เพื่อความปลอดภัย
                          setFormData((prev) => ({
                            ...prev,
                            photo: event.target.result,
                          }));
                        };

                        // กรณีเกิด Error ในการอ่านไฟล์
                        reader.onerror = () => {
                          console.error("เกิดข้อผิดพลาดในการอ่านไฟล์");
                        };

                        reader.readAsDataURL(file);
                      }
                    }}
                  />
                </div>

                {/* ปุ่มลบรูปภาพ - แสดงเฉพาะเมื่อมีรูป */}
                {formData.photo && (
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, photo: null })}
                    className="absolute -top-1 -right-1 bg-white text-red-500 rounded-full p-1 shadow-md border border-red-50 hover:bg-red-50 transition-all active:scale-90"
                  >
                    <X size={14} strokeWidth={3} />
                  </button>
                )}
              </div>
            </div>
            <SectionHeader title="การติดต่อ & ที่อยู่" icon={Phone} />
            <FormInput
              label="เบอร์โทรศัพท์"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              required
              placeholder="08xxxxxxxx"
            />
            <FormInput
              label="Line ID"
              name="lineId"
              value={formData.lineId}
              onChange={handleChange}
            />
            <FormInput
              label="อีเมล"
              name="email"
              value={formData.email}
              onChange={handleChange}
              isFullWidth
              placeholder="example@mail.com"
            />
            <div className="col-span-1 md:col-span-2 flex flex-col">
              <FieldLabel>ที่อยู่</FieldLabel>
              <textarea
                name="address"
                rows="2"
                value={formData.address}
                onChange={handleChange}
                required
                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-2xl focus:border-[#f3a638] outline-none font-medium text-gray-700 min-h-20"
              />
            </div>

            <SectionHeader
              title="ติดต่อฉุกเฉิน & ทรัพย์สิน"
              icon={ShieldCheck}
            />
            <FormInput
              label="ผู้ติดต่อสำรอง"
              name="altName"
              value={formData.altName}
              onChange={handleChange}
            />
            <FormInput
              label="ความสัมพันธ์"
              name="altRelationship"
              value={formData.altRelationship}
              onChange={handleChange}
            />
            <FormInput
              label="เบอร์สำรอง"
              name="altPhone"
              value={formData.altPhone}
              onChange={handleChange}
              isFullWidth
            />
            <FormInput
              label="ทะเบียนรถ คันที่1"
              name="vehicleNum1"
              value={formData.vehicleNum1}
              onChange={handleChange}
            />
            <FormInput
              label="รายละเอียดรถ คันที่1"
              name="vehicleDetail1"
              value={formData.vehicleDetail1}
              onChange={handleChange}
            />
            <FormInput
              label="ทะเบียนรถ คันที่2"
              name="vehicleNum2"
              value={formData.vehicleNum2}
              onChange={handleChange}
            />
            <FormInput
              label="รายละเอียดรถ คันที่2"
              name="vehicleDetail2"
              value={formData.vehicleDetail2}
              onChange={handleChange}
            />

            <div className="col-span-1 md:col-span-2 grid grid-cols-3 gap-3">
              <FormInput
                label="คีย์การ์ด 1"
                name="keyCard1"
                value={formData.keyCard1}
                onChange={handleChange}
              />
              <FormInput
                label="คีย์การ์ด 2"
                name="keyCard2"
                value={formData.keyCard2}
                onChange={handleChange}
              />
              <FormInput
                label="คีย์การ์ด 3"
                name="keyCard3"
                value={formData.keyCard3}
                onChange={handleChange}
              />
            </div>

            <SectionHeader title="บริการ & หมายเหตุ" icon={FileText} />
            <div className="p-4 rounded-2xl border border-gray-200 bg-gray-50 flex justify-between items-center transition-all hover:border-orange-200">
              <span className="text-sm font-bold text-gray-700">
                รับบริการซักรีด
              </span>
              <input
                type="checkbox"
                name="isLaundryService"
                checked={formData.isLaundryService}
                onChange={handleChange}
                className="w-5 h-5 accent-[#f3a638] cursor-pointer"
              />
            </div>
            <div className="p-4 rounded-2xl border border-gray-200 bg-gray-50 flex justify-between items-center transition-all hover:border-orange-200">
              <span className="text-sm font-bold text-gray-700">
                จำนวนอุปกรณ์อินเตอร์เน็ต
              </span>
              <input
                type="number"
                name="internetDeviceCount"
                value={formData.internetDeviceCount}
                onChange={handleChange}
                className="w-16 bg-white rounded-lg text-center font-bold  outline-none border border-gray-200  p-1 "
              />
            </div>
            <div className="col-span-1 md:col-span-2 mb-6 flex flex-col">
              <FieldLabel>หมายเหตุ</FieldLabel>
              <textarea
                name="note"
                rows="3"
                value={formData.note}
                onChange={handleChange}
                className="w-full p-4 bg-gray-50 border border-gray-200 rounded-3xl focus:border-[#f3a638] outline-none font-medium text-gray-700"
                placeholder="บันทึกเพิ่มเติม..."
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 sticky bottom-0 z-30">
          <div className="max-w-4xl mx-auto p-4 flex justify-end items-center gap-3">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="px-8 py-3.5 text-gray-400 font-bold bg-gray-50 hover:bg-gray-100 rounded-2xl transition-all"
            >
              ยกเลิก
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="min-w-40 bg-[#f3a638] text-white py-3.5 px-8 rounded-2xl font-black shadow-lg shadow-orange-100 hover:brightness-95 flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
            >
              <Save size={20} />
              บันทึก
            </button>
          </div>
        </div>
      </div>
    </RoomHeader>
  );
};

export default AddTenant;
