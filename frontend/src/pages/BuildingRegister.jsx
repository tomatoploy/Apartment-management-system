import React, { useState, useEffect } from "react";
import { X, ChevronRight, ChevronLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

const BuildingRegister = ({ buildingId = null, onClose }) => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const isEditMode = Boolean(buildingId);
  //   const isEditMode = true; // ทดสอบโหมดแก้ไข แต่ยังไม่ได้ส่งข้อมูลใหม่กลับเมื่อบันทึก

  // State ข้อมูลตามตาราง Database
  const [formData, setFormData] = useState({
    Name: "",
    Phone: "",
    Email: "",
    LineID: "",
    AddressNo: "",
    Village: "",
    Alley: "",
    Road: "",
    SubDistrict: "",
    District: "",
    Province: "",
    ZipCode: "",
    Address: "",
    PaymentDueStart: "",
    PaymentDueEnd: "",
    Floors: "",
  });

  const [roomsPerFloor, setRoomsPerFloor] = useState({});

  // --- ดึงข้อมูลเดิมกรณีแก้ไข (Edit Mode) ---
  useEffect(() => {
    if (isEditMode) {
      // ตัวอย่าง Mock ข้อมูลเก่าจาก Database
      const mockOldData = {
        Name: "หอพักสุขสบาย",
        Phone: "0812345678",
        Email: "contact@home.com",
        LineID: "@home123",
        Address:
          "123/4 หมู่บ้านรวยทรัพย์ ซอย 5 ถนนสุขุมวิท แขวงคลองเตย เขตคลองเตย กรุงเทพฯ 10110",
        PaymentDueStart: "25",
        PaymentDueEnd: "5",
        Floors: "2",
      };
      setFormData(mockOldData);
      setRoomsPerFloor({ 1: "10", 2: "10" }); // ดึงจำนวนห้องเดิม
    }
  }, [buildingId, isEditMode]);

  // --- Input Validation & Mapping Logic ---
  const handleChange = (e) => {
    const { name, value } = e.target;

    // ดักจับจำนวนชั้น: ห้ามใส่ค่า <= 0
    if (name === "Floors") {
      // ถ้ามีการใส่ค่า และค่านั้นน้อยกว่า 1 ให้ไม่ทำอะไร (ป้องกันการพิมพ์ 0 หรือติดลบ)
      if (value !== "" && Number(value) < 1) return;
    }

    // ดักจับ Type: เบอร์โทร (10 หลัก) และ รหัสไปรษณีย์ (5 หลัก)
    if (name === "Phone" && value.length > 10) return;
    if (name === "ZipCode" && value.length > 5) return;
    if (
      (name === "PaymentDueStart" || name === "PaymentDueEnd") &&
      (value < 0 || value > 31)
    )
      return;

    setFormData({ ...formData, [name]: value });
  };

  const handleRoomChange = (floor, value) => {
    // ถ้ามีการใส่ค่า และค่านั้นน้อยกว่า 1 จะไม่อัปเดต State
    if (value !== "" && Number(value) < 1) return;
    setRoomsPerFloor({ ...roomsPerFloor, [floor]: value });
  };

  // --- ฟังก์ชัน Validation ---
  const validateStep = () => {
    if (step === 1) {
      if (!formData.Name.trim()) return "กรุณากรอกชื่อหอพัก";
      if (!/^[0-9]{10}$/.test(formData.Phone))
        return "กรุณากรอกเบอร์โทรให้ถูกต้อง";
      if (formData.Email && !/\S+@\S+\.\S+/.test(formData.Email))
        return "รูปแบบอีเมลไม่ถูกต้อง";
      if (!formData.LineID.trim()) return "กรุณากรอก Line ID";
    }

    if (step === 2 && !isEditMode) {
      if (!formData.AddressNo.trim()) return "กรุณากรอกบ้านเลขที่";
      if (!formData.SubDistrict.trim()) return "กรุณากรอกตำบล/แขวง";
      if (!/^[0-9]{5}$/.test(formData.ZipCode))
        return "กรุณากรอกรหัสไปรษณีย์ให้ถูกต้อง";
    }

    if (step === 3) {
      // 1. ตรวจสอบวันออกบิล (Optional: ไม่กรอกผ่านได้)
      const billValue = formData.PaymentDueStart;
      if (billValue && billValue !== "") {
        // ถ้ามีการกรอกข้อมูลเข้ามา
        const billNum = Number(billValue);
        if (isNaN(billNum) || billNum < 1 || billNum > 28) {
          return "หากระบุวันออกบิล ต้องเป็นตัวเลขวันที่ 1 - 28 เท่านั้น";
        }
      }

      // 2. ตรวจสอบวันสิ้นสุดชำระ (Optional: ไม่กรอกผ่านได้)
      const dueValue = formData.PaymentDueEnd;
      if (dueValue && dueValue !== "") {
        const dueNum = Number(dueValue);
        if (isNaN(dueNum) || dueNum < 1 || dueNum > 28) {
          return "หากระบุวันสิ้นสุดชำระ ต้องเป็นตัวเลขวันที่ 1 - 28 เท่านั้น";
        }
      }
      // --- 3. ตรวจสอบจำนวนชั้น ---
      if (
        !formData.Floors ||
        isNaN(Number(formData.Floors)) ||
        Number(formData.Floors) <= 0
      ) {
        return "จำนวนชั้นต้องเป็นตัวเลขที่มากกว่า 0";
      }

      // --- 4. ตรวจสอบจำนวนห้องในแต่ละชั้น ---
      const floorCount = Number(formData.Floors);
      for (let i = 1; i <= floorCount; i++) {
        const rooms = Number(roomsPerFloor[i]);
        if (isNaN(rooms) || rooms <= 0) {
          return `จำนวนห้องของชั้นที่ ${i} ต้องเป็นตัวเลขที่มากกว่า 0`;
        }
      }
    }
    return null;
  };

  // --- ปรับปรุงปุ่มกดถัดไป ---
  const handleNext = () => {
    const error = validateStep();
    if (error) {
      alert(error);
      return;
    }
    setStep(step + 1);
  };

  // --- ปรับปรุงปุ่มบันทึก ---
  const handleSubmit = (e) => {
    e.preventDefault();
    const error = validateStep();
    if (error) {
      alert(error);
      return;
    }

    // การบันทึกข้อมูล
    alert("บันทึกข้อมูลสำเร็จ!");
    navigate("/dashboard");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-linear-to-br from-[#2485cf] via-[#f0d49a] to-[#d65d2c]">
      <div className="bg-white/95 backdrop-blur-md w-full max-w-lg rounded-[40px] p-8 shadow-2xl relative flex flex-col max-h-[90vh]">
        <button
          onClick={() => navigate("/login")}
          className="absolute right-6 top-6 text-gray-400 hover:text-black transition-colors"
        >
          <X size={24} strokeWidth={3} />
        </button>

        <h1 className="text-2xl font-bold text-center text-gray-800 mb-6">
          {isEditMode ? "แก้ไขข้อมูลหอพัก" : "ลงทะเบียนหอพัก"}
        </h1>

        <StepIndicator step={step} />

        <div className="flex-1 px-2 py-0.5 overflow-y-auto pr-2 custom-scrollbar">
          {/* Step 1: ข้อมูลทั่วไป */}
          {step === 1 && (
            <div className="space-y-4 animate-in fade-in duration-300">
              <p className="text-center font-bold text-xl text-gray-600 mb-2">
                ข้อมูลทั่วไป
              </p>
              <InputField
                label="ชื่อหอพัก"
                name="Name"
                value={formData.Name}
                onChange={handleChange}
                required
                placeholder="ระบุชื่อหอพัก"
              />
              <InputField
                label="หมายเลขโทรศัพท์"
                name="Phone"
                value={formData.Phone}
                onChange={handleChange}
                type="text"
                inputMode="numeric"
                required
                placeholder="08XXXXXXXX"
              />
              <InputField
                label="อีเมล"
                name="Email"
                value={formData.Email}
                onChange={handleChange}
                type="email"
                placeholder="example@mail.com"
              />
              <InputField
                label="Line Id"
                name="LineID"
                value={formData.LineID}
                onChange={handleChange}
                required
                placeholder="LineID"
              />
            </div>
          )}

          {/* Step 2: ที่อยู่ (Logic แยก Create/Edit) */}
          {step === 2 && (
            <div className="space-y-4 animate-in fade-in duration-300">
              <p className="text-center font-bold text-xl text-gray-600 mb-2">
                ที่อยู่หอพัก
              </p>
              {!isEditMode ? (
                <div className="grid grid-cols-2 gap-4">
                  <InputField
                    label="ที่อยู่เลขที่"
                    name="AddressNo"
                    value={formData.AddressNo}
                    onChange={handleChange}
                    required
                  />
                  <InputField
                    label="หมู่บ้าน/อาคาร"
                    name="Village"
                    value={formData.Village}
                    onChange={handleChange}
                  />
                  <InputField
                    label="ตำบล/แขวง"
                    name="SubDistrict"
                    value={formData.SubDistrict}
                    onChange={handleChange}
                    required
                  />
                  <InputField
                    label="อำเภอ/เขต"
                    name="District"
                    value={formData.District}
                    onChange={handleChange}
                    required
                  />
                  <InputField
                    label="จังหวัด"
                    name="Province"
                    value={formData.Province}
                    onChange={handleChange}
                    required
                  />
                  <InputField
                    label="รหัสไปรษณีย์"
                    name="ZipCode"
                    value={formData.ZipCode}
                    onChange={handleChange}
                    type="number"
                    required
                  />
                </div>
              ) : (
                <div className="space-y-1">
                  <label className="block text-[16px] font-bold mb-1 ml-1">
                    แก้ไขที่อยู่
                  </label>
                  <textarea
                    name="Address"
                    value={formData.Address}
                    onChange={handleChange}
                    className="w-full p-3 bg-white border border-gray-400 rounded-xl outline-none focus:ring-2 focus:ring-orange-400 h-44 text-md leading-relaxed"
                  />
                </div>
              )}
            </div>
          )}

          {/* Step 3: การตั้งค่าชั้น/ห้อง */}
          {step === 3 && (
            <div className="space-y-4 animate-in fade-in duration-300">
              <p className="text-center font-bold text-xl text-gray-600 mb-2">
                การตั้งค่า
              </p>
              <div className="grid grid-cols-2 gap-4">
                <InputField
                  label="วันที่ออกบิล"
                  name="PaymentDueStart"
                  value={formData.PaymentDueStart}
                  onChange={handleChange}
                  //   type="number" เพื่อดักจับเฉพาะตัวเลข
                  min="1"
                  max="28"
                  placeholder="1-28"
                />
                <InputField
                  label="วันสิ้นสุดชำระ"
                  name="PaymentDueEnd"
                  value={formData.PaymentDueEnd}
                  onChange={handleChange}
                  //   type="number"
                  min="1"
                  max="28"
                  placeholder="1-28"
                />
              </div>
              <InputField
                label="จำนวนชั้น"
                name="Floors"
                value={formData.Floors}
                onChange={handleChange}
                type="number"
                min="1"
                required
                placeholder="ระบุจำนวนชั้น"
              />

              {Number(formData.Floors) > 0 && (
                <div className="bg-gray-50 p-4 rounded-2xl border border-gray-200 space-y-3 max-h-48 overflow-y-auto">
                  {[...Array(Number(formData.Floors))].map((_, i) => (
                    <div
                      key={i + 1}
                      className="flex items-center justify-between gap-4 bg-white p-2 px-4 rounded-xl shadow-sm border border-gray-100"
                    >
                      <span className="text-sm font-bold text-gray-600">
                        ชั้นที่ {i + 1}
                      </span>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min="1"
                          value={roomsPerFloor[i + 1] || ""}
                          onChange={(e) =>
                            handleRoomChange(i + 1, e.target.value)
                          }
                          className="w-16 text-center border-b border-gray-300 outline-none focus:border-orange-400 font-bold"
                        />
                        <span className="text-xs text-gray-400 font-bold">
                          ห้อง
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* --- Footer Buttons --- */}
        <div className="pt-6 flex gap-3">
          {step > 1 && (
            <button
              onClick={() => setStep(step - 1)}
              className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-600 font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2"
            >
              <ChevronLeft size={18} /> กลับ
            </button>
          )}
          {step < 3 ? (
            <button
              onClick={handleNext}
              className="flex-2 bg-[#f3a638] hover:bg-[#e29528] text-white font-bold py-3 rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
            >
              ถัดไป <ChevronRight size={18} />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              className="flex-2 bg-[#f3a638] hover:bg-[#e29528] text-white font-bold py-3 rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
            >
              บันทึก
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

// --- Reusable Components ---
const StepIndicator = ({ step }) => (
  <div className="flex items-center justify-center gap-2 mb-8">
    {[1, 2, 3].map((s) => (
      <React.Fragment key={s}>
        <div
          className={`w-9 h-9 rounded-full flex items-center justify-center font-bold shadow-sm transition-all text-sm
          ${step >= s ? "bg-[#f3a638] text-white" : "bg-white text-gray-300 border border-gray-200"}`}
        >
          {s}
        </div>
        {s < 3 && (
          <div
            className={`w-8 h-1 ${step > s ? "bg-[#f3a638]" : "bg-gray-100"}`}
          />
        )}
      </React.Fragment>
    ))}
  </div>
);

const InputField = ({ label, required, type = "text", ...props }) => (
  <div className="w-full">
    <label className="block text-[15px] font-bold mb-1 ml-1 text-gray-600">
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    <input
      type={type}
      className="w-full p-2.5 bg-white border border-gray-300 rounded-xl outline-none text-sm focus:ring-2 focus:ring-orange-400 transition-all placeholder:text-gray-300"
      {...props}
    />
  </div>
);

export default BuildingRegister;
