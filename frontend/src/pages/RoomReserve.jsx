import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { UserPlus, Plus, User, Phone, IdCard, Calendar, MapPin, Home, Wallet, Trash2, Pencil, Save, X, FileSignature } from "lucide-react";

// Components
import RoomHeader from "../components/RoomHeader";
import {
  OrangeButton,
  GreenButton,
  ExitButton,
} from "../components/ActionButtons";
import { DateInput } from "../components/DateController";

// API Services
import { tenantService } from "../api/TenantApi";
import { contractService } from "../api/ContractApi";
import { roomService } from "../api/RoomApi";

const FieldLabel = ({ children, required }) => (
  <label className="text-[13px] font-bold text-gray-500 mb-2 text-left block">
    {children} {required && <span className="text-red-500">*</span>}
  </label>
);

const FormInput = ({ label, name, value, onChange, type = "text", required, placeholder, isFullWidth, options, disabled,
}) => (
  <div
    className={`${isFullWidth ? "md:col-span-2" : "col-span-1"} flex flex-col`}
  >
    {label && <FieldLabel required={required}>{label}</FieldLabel>}
    {type === "select" ? (
      <select
        name={name}
        value={value || ""}
        onChange={onChange}
        className="w-full p-3 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:border-[#f3a638] transition-all font-medium text-gray-700 appearance-none"
      >
        <option value="">เลือก{label}</option>
        {options?.map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
    ) : (
      <input
        type={type}
        name={name}
        value={value || ""}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
        readOnly={disabled}
        className={`w-full p-3 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none transition-all font-medium text-gray-700 ${disabled ? "opacity-60 cursor-not-allowed" : "focus:border-[#f3a638]"}`}
      />
    )}
  </div>
);

const SectionHeader = ({ title, icon: Icon }) => (
  <div className="col-span-1 md:col-span-2 flex items-center gap-2 mt-6 mb-3 border-b border-gray-100 pb-2">
    <Icon size={18} className="text-[#f3a638]" />
    <h3 className="text-base font-black text-gray-700 uppercase tracking-wide">
      {title}
    </h3>
  </div>
);

/* ================= Main Component ================= */
const RoomReserve = () => {
  const { roomNumber } = useParams();
  const navigate = useNavigate();

  // State สำหรับจัดการโหมดและข้อมูล
  const [isAdding, setIsAdding] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [reserveData, setReserveData] = useState(null);

  //ID ของ Contract และ Tenant ที่ดึงมาจาก API เพื่อใช้ตอนอัปเดต
  const [currentContractId, setCurrentContractId] = useState(null);
  const [currentTenantId, setCurrentTenantId] = useState(null);
  const [currentRoomId, setCurrentRoomId] = useState(null);

  // State สำหรับ Form
  const initialForm = {
    title: "",
    firstName: "",
    lastName: "",
    phone: "",
    nationalId: "",
    birthDate: "",
    addressNo: "",
    subDistrict: "",
    district: "",
    province: "",
    zipCode: "",
    checkInDate: "",
    deposit: "",
  };
  const [formData, setFormData] = useState(initialForm);

  const fetchReservation = async () => {
    try {
      const allRooms = await roomService.getRoomOverview();
      const targetRoom = allRooms.find(r => String(r.roomNumber) === String(roomNumber));
      
      if (!targetRoom) {
        console.log("หาข้อมูลห้องไม่พบ");
        return; 
      }
      
      const actualRoomId = targetRoom.roomId || targetRoom.id;
      setCurrentRoomId(actualRoomId); 

      const allContracts = await contractService.getAllContracts();
      const reservedContract = allContracts.find(
        c => c.roomId === actualRoomId && c.status === "Reserved" 
      );

      if (reservedContract) {
        const tenant = await tenantService.getTenant(reservedContract.tenantId);
        
        setCurrentContractId(reservedContract.id);
        setCurrentTenantId(tenant.id);
        
        const mappedData = {
          title: tenant.title,
          firstName: tenant.firstName,
          lastName: tenant.lastName,
          phone: tenant.phone,
          nationalId: tenant.nin,
          birthDate: tenant.birthDate ? tenant.birthDate.split('T')[0] : "",
          addressNo: tenant.address, 
          checkInDate: reservedContract.startDate ? reservedContract.startDate.split('T')[0] : "",
          deposit: reservedContract.deposit?.toString() || "0",
        };

        setReserveData(mappedData);
        setFormData(mappedData);
      } else {
        setReserveData(null);
      }
    } catch (error) {
      console.error("Error fetching reservation:", error);
    }
  };

// --- ดึงข้อมูลการจองจาก API ---
useEffect(() => {
  fetchReservation();
}, [roomNumber, isAdding]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // --- บันทึกข้อมูล (POST / PUT) ---
  // --- บันทึกข้อมูล (POST / PUT) ---
  const handleSave = async () => {
    if (!formData.firstName) return alert("กรุณากรอกชื่อผู้จอง");

    try {
      const fullAddress = [
        formData.addressNo, 
        formData.subDistrict ? `ต.${formData.subDistrict}` : "", 
        formData.district ? `อ.${formData.district}` : "", 
        formData.province ? `จ.${formData.province}` : "", 
        formData.zipCode
      ].filter(Boolean).join(" ");

      // ✨ ปรับ Payload ให้สะอาด (Clean)
      // ฟิลด์ไหนว่างให้ส่งเป็น null เพื่อให้ .NET ทำงานได้ถูกต้อง
      const tenantPayload = {
        Nin: formData.nationalId || null,
        Title: formData.title || null,
        FirstName: formData.firstName,
        LastName: formData.lastName || null,
        Phone: formData.phone || null,
        Address: fullAddress || null, 
        // ⚠️ สำคัญมาก: ถ้าวันที่ว่างต้องส่ง null ห้ามส่ง ""
        BirthDate: formData.birthDate ? formData.birthDate : null, 
      };

      if (isAdding) {
        // 1. สร้าง Tenant ใหม่
        const newTenant = await tenantService.postTenant(tenantPayload);
        
        // 2. สร้าง Contract (Reserved)
        const contractPayload = {
          RoomId: Number(currentRoomId),
          TenantId: Number(newTenant.id),
          Status: "Reserved",
          StartDate: formData.checkInDate || new Date().toISOString().split('T')[0], // ป้องกันวันที่ว่าง
          EndDate: null, 
          Deposit: parseInt(formData.deposit) || 0,
        };
        
        await contractService.postContract(contractPayload);
        alert("เพิ่มการจองสำเร็จ");

      } else if (isEditing) {
        // แก้ไข Tenant
        await tenantService.putTenant(currentTenantId, tenantPayload);
        
        // แก้ไข Contract
        const existingContract = await contractService.getContract(currentContractId);
        await contractService.putContract(currentContractId, {
          ...existingContract, 
          StartDate: formData.checkInDate || existingContract.startDate,
          Deposit: parseInt(formData.deposit) || 0,
        });
        alert("อัปเดตข้อมูลสำเร็จ");
      }

      setIsAdding(false);
      setIsEditing(false);
      await fetchReservation(); // ดึงข้อมูลใหม่

    } catch (error) {
      console.error("Save error detail:", error);
      
      // ✨ วิธีดูว่า Server ฟ้องว่าผิดตรงไหน (สำคัญมาก!)
      if (error.response && error.response.data) {
        console.log("Validation Errors from Server:", error.response.data);
        // ถ้ามีรายละเอียดข้อผิดพลาดจาก .NET เช่น "The Nin field is required"
        const serverError = error.response.data.errors 
          ? JSON.stringify(error.response.data.errors) 
          : error.response.data;
        alert("ข้อมูลไม่ถูกต้อง: " + serverError);
      } else {
        alert("เกิดข้อผิดพลาดในการบันทึกข้อมูล กรุณาลองใหม่");
      }
    }
  };

  const handleDelete = async () => {
    if (window.confirm("คุณต้องการยกเลิกการจองนี้ใช่หรือไม่? ข้อมูลจะถูกเปลี่ยนสถานะเป็น 'ยกเลิก'")) {
      try {
        const existingContract = await contractService.getContract(currentContractId);
        
        await contractService.putContract(currentContractId, {
          ...existingContract,
          Status: "Cancle" 
        });

        alert("ยกเลิกการจองเรียบร้อยแล้ว");
        setReserveData(null);
        setFormData(initialForm);
        window.location.reload(); 
      } catch (error) {
        console.error("Cancel error:", error);
        alert("ยกเลิกไม่สำเร็จ กรุณาลองใหม่อีกครั้ง");
      }
    }
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

  return (
    <div>
      <RoomHeader roomNumber={roomNumber}>
        <div className="max-w-4xl mx-auto pb-10">
          {!reserveData && !isAdding ? (
            <div className="py-24 flex flex-col items-center justify-center text-center  bg-gray-50 rounded-3xl border border-gray-200 mt-4 max-w-4xl mx-auto">
              <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center text-gray-400 mb-3 border border-dashed border-gray-300">
                <UserPlus size={48} />
              </div>
              <h3 className="text-xl font-black text-gray-500 mb-3">
                ไม่มีข้อมูลการจอง
              </h3>
              <OrangeButton
                label="เพิ่มการจอง"
                icon={Plus}
                onClick={() => setIsAdding(true)}
              />
            </div>
          ) : (
            <div className="bg-white rounded-3xl w-full max-w-4xl mx-auto flex flex-col overflow-hidden border border-gray-200 shadow-sm mt-4 h-[600px] md:h-[450px]">
              
              <div className="sticky top-0 z-30 p-5 md:p-6 border-b border-gray-200 flex items-center justify-between bg-white/95 backdrop-blur-sm rounded-t-3xl">
                <div className="min-w-0">
                  <h2 className="text-lg md:text-xl font-black text-gray-700 flex items-center gap-3">
                    <div className="hidden md:flex w-10 h-10 bg-[#f3a638] rounded-xl items-center justify-center text-white shadow-sm shrink-0">
                      <Calendar size={20} />
                    </div>
                    <span className="truncate">
                      {isAdding || isEditing
                        ? "ข้อมูลการจอง"
                        : `ผู้จองห้อง ${roomNumber}`}
                    </span>
                  </h2>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {isAdding || isEditing ? (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          setIsAdding(false);
                          setIsEditing(false);
                        }}
                        className="p-2 md:px-4 md:py-2 text-sm font-bold text-gray-400 hover:bg-gray-100 rounded-xl transition-all"
                      >
                        ยกเลิก
                      </button>
                      <button
                        onClick={handleSave}
                        className="p-2 md:px-5 md:py-2 text-sm font-bold bg-[#D5F5E3] text-[#1D8348] hover:bg-[#abebc6] rounded-xl flex items-center gap-2 transition-all"
                      >
                        บันทึก
                      </button>
                      <ExitButton onClick={() => navigate(-1)} />
                    </div>
                  ) : (
                    // ✅ โหมดปกติ: แสดงปุ่ม ทำสัญญา, แก้ไข, ลบ และ Exit
                    <div className="flex items-center gap-1 md:gap-2">
                      
                      {/* ✨ ปุ่มทำสัญญา (แก้ Syntax ตรงนี้แล้ว) */}
                      <button
                        onClick={() => navigate(`/rooms/contract/${roomNumber}`, { state: { autoEdit: true } })}
                        className="flex items-center gap-2 p-2 px-4 bg-green-100 text-green-700 hover:bg-green-200 rounded-xl font-bold transition-colors text-sm"
                        title="ทำสัญญา"
                      >
                        <FileSignature size={18} />
                        <span className="hidden md:inline">ทำสัญญา</span>
                      </button>

                      <div className="flex gap-1 border-r pr-2 mr-1 md:mr-2 border-gray-100 ml-1">
                        <button
                          onClick={() => setIsEditing(true)}
                          className="p-2 text-orange-400 hover:bg-orange-50 rounded-xl transition-colors"
                          title="แก้ไขข้อมูล"
                        >
                          <Pencil size={20} />
                        </button>
                        <button
                          onClick={handleDelete}
                          className="p-2 text-red-500 hover:bg-red-50 rounded-xl transition-colors"
                          title="ลบข้อมูล"
                        >
                          <Trash2 size={20} />
                        </button>
                      </div>
                      <ExitButton onClick={() => navigate(-1)} />
                    </div>
                  )}
                </div>
              </div>

              <div className="flex-1 overflow-y-auto px-8 md:px-10 custom-scrollbar ">
                {" "}
                {isAdding || isEditing ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 mb-15">
                    <SectionHeader title="รายละเอียดการจอง" icon={Home} />
                    <FormInput
                      label="ห้อง"
                      name="room"
                      value={roomNumber}
                      type="text"
                      placeholder={roomNumber}
                      disabled
                    />
                    <DateInput
                      label="วันที่เข้าพัก"
                      name="checkInDate"
                      value={formData.checkInDate}
                      onChange={handleInputChange}
                      type="date"
                    />
                    <FormInput
                      label="ค่ามัดจำ (บาท)"
                      name="deposit"
                      value={formData.deposit}
                      onChange={(e) => handleNumberChange(e, 7)} 
                      type="text" 
                      inputMode="numeric" 
                    />

                    <SectionHeader title="ข้อมูลผู้จอง" icon={User} />
                    <FormInput
                      label="คำนำหน้า"
                      name="title"
                      value={formData.title}
                      onChange={handleInputChange}
                      type="select"
                      options={["นาย", "นาง", "นางสาว"]}
                    />
                    <FormInput
                      label="ชื่อ"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleInputChange}
                      required
                    />
                    <FormInput
                      label="นามสกุล"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleInputChange}
                    />
                    <FormInput
                      label="เบอร์โทรศัพท์"
                      name="phone"
                      value={formData.phone}
                      type="tel"
                      onChange={(e) => handleNumberChange(e, 10)}
                      placeholder="08XXXXXXXX"
                    />
                    <FormInput
                      label="เลขบัตรประชาชน"
                      name="nationalId"
                      value={formData.nationalId}
                      onChange={(e) => handleNumberChange(e, 13)}
                      required
                    />
                    <DateInput
                      label="วันเดือนปีเกิด"
                      name="birthDate"
                      value={formData.birthDate}
                      onChange={handleInputChange}
                      type="date"
                    />

                    <SectionHeader
                      title="ที่อยู่ตามทะเบียนบ้าน"
                      icon={MapPin}
                    />
                    <FormInput
                      label="บ้านเลขที่/ซอย/ถนน"
                      name="addressNo"
                      value={formData.addressNo}
                      onChange={handleInputChange}
                      isFullWidth
                    />
                    <FormInput
                      label="ตำบล/แขวง"
                      name="subDistrict"
                      value={formData.subDistrict}
                      onChange={handleInputChange}
                    />
                    <FormInput
                      label="อำเภอ/เขต"
                      name="district"
                      value={formData.district}
                      onChange={handleInputChange}
                    />
                    <FormInput
                      label="จังหวัด"
                      name="province"
                      value={formData.province}
                      onChange={handleInputChange}
                    />
                    <FormInput
                      label="รหัสไปรษณีย์"
                      name="zipCode"
                      value={formData.zipCode}
                      onChange={handleInputChange}
                    />
                  </div>
                ) : (
                  <div className="space-y-8 px-2 md:px-10 mt-10">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-5">
                        <InfoBox
                          label="ชื่อ-นามสกุล"
                          value={`${reserveData.title}${reserveData.firstName} ${reserveData.lastName}`}
                          icon={<User size={18} />}
                        />
                        <InfoBox
                          label="เบอร์โทรศัพท์"
                          value={reserveData.phone}
                          icon={<Phone size={18} />}
                        />
                        <InfoBox
                          label="เลขบัตรประชาชน"
                          value={reserveData.nationalId}
                          icon={<IdCard size={18} />}
                        />
                      </div>
                      <div className="space-y-5">
                        <InfoBox
                          label="วันที่เข้าพัก"
                          value={reserveData.checkInDate}
                          icon={<Calendar size={18} />}
                        />
                        <InfoBox
                          label="ค่ามัดจำ"
                          value={`${Number(reserveData.deposit).toLocaleString()} บาท`}
                          icon={<Wallet size={18} />}
                          color="text-blue-400"
                        />
                        <InfoBox
                          label="ที่อยู่"
                          value={reserveData.addressNo}
                          icon={<MapPin size={18} />}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </RoomHeader>
    </div>
  );
};

const InfoBox = ({ label, value, icon, color = "text-gray-700" }) => (
  <div className="flex items-start gap-4">
    <div className="flex justify-center items-center mt-1 text-orange-400 w-8 h-8 rounded-xl bg-gray-50">
      {icon}
    </div>
    <div>
      <p className="text-[13px] font-medium text-gray-400 uppercase tracking-wide">
        {label}
      </p>
      <p className={`text-base ${color}`}>{value || "-"}</p>
    </div>
  </div>
);

export default RoomReserve;