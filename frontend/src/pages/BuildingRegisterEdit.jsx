import React, { useState, useEffect } from "react";
import { ChevronRight, ChevronLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { apartmentService } from "../api/ApartmentApi";
import { roomService } from "../api/RoomApi";
import { ExitButton } from "../components/ActionButtons";

const BuildingRegisterEdit = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [savedBuildingId, setSavedBuildingId] = useState(null);

  const handleClose = () => {
    navigate("/settings");
  };

  const [formData, setFormData] = useState({
    Name: "",
    Phone: "",
    Email: "",
    LineID: "",
    Address: "",
    PaymentDueStart: "",
    PaymentDueEnd: "",
    Floors: "",
  });

  const [roomsPerFloor, setRoomsPerFloor] = useState({});

  useEffect(() => {
    const initData = async () => {
      try {
        const apartments = await apartmentService.getAllApartment();
        if (apartments && apartments.length > 0) {
          const apartmentData = apartments[0];
          setSavedBuildingId(apartmentData.id);

          setFormData((prev) => ({
            ...prev,
            Name: apartmentData.name || "",
            Phone: apartmentData.phone || "",
            Email: apartmentData.email || "",
            LineID: apartmentData.lineId || "",
            Address: apartmentData.address || "",
            PaymentDueStart: apartmentData.paymentDueStart?.toString() || "",
            PaymentDueEnd: apartmentData.paymentDueEnd?.toString() || "",
          }));
        }

        const rooms = await roomService.getAllRooms();
        if (rooms && rooms.length > 0) {
          const counts = {};
          let maxFloor = 0;

          rooms.forEach((room) => {
            const f = parseInt(room.floor);
            if (!isNaN(f)) {
              counts[f] = (counts[f] || 0) + 1;
              if (f > maxFloor) maxFloor = f;
            }
          });

          setRoomsPerFloor(counts);
          setFormData((prev) => ({
            ...prev,
            Floors: maxFloor.toString(),
          }));
        }
      } catch (error) {
        console.error("Error fetching initial data:", error);
      }
    };

    initData();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === "Floors" && value !== "" && Number(value) < 1) return;
    if (name === "Phone" && value.length > 10) return;
    if (
      (name === "PaymentDueStart" || name === "PaymentDueEnd") &&
      (value < 0 || value > 31)
    )
      return;
    setFormData({ ...formData, [name]: value });
  };

  const handleRoomChange = (floor, value) => {
    if (value !== "" && Number(value) < 1) return;
    setRoomsPerFloor({ ...roomsPerFloor, [floor]: value });
  };

  const validateStep = () => {
    if (step === 1) {
      if (!formData.Name.trim()) return "กรุณากรอกชื่อหอพัก";
      if (!/^[0-9]{10}$/.test(formData.Phone))
        return "กรุณากรอกเบอร์โทรให้ถูกต้อง";
      if (formData.Email && !/\S+@\S+\.\S+/.test(formData.Email))
        return "รูปแบบอีเมลไม่ถูกต้อง";
      if (!formData.LineID.trim()) return "กรุณากรอก Line ID";
    }

    if (step === 3) {
      const billValue = formData.PaymentDueStart;
      if (billValue && billValue !== "") {
        const billNum = Number(billValue);
        if (isNaN(billNum) || billNum < 1 || billNum > 31)
          return "หากระบุวันออกบิล ต้องเป็นตัวเลขวันที่ 1 - 31 เท่านั้น";
      }

      const dueValue = formData.PaymentDueEnd;
      if (dueValue && dueValue !== "") {
        const dueNum = Number(dueValue);
        if (isNaN(dueNum) || dueNum < 1 || dueNum > 31)
          return "หากระบุวันสิ้นสุดชำระ ต้องเป็นตัวเลขวันที่ 1 - 31 เท่านั้น";
      }

      if (
        !formData.Floors ||
        isNaN(Number(formData.Floors)) ||
        Number(formData.Floors) <= 0
      ) {
        return "จำนวนชั้นต้องเป็นตัวเลขที่มากกว่า 0";
      }

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

  const handleNext = () => {
    const error = validateStep();
    if (error) {
      alert(error);
      return;
    }
    setStep(step + 1);
  };

  const handleSubmit = async () => {
    const error = validateStep();
    if (error) return alert(error);

    const payload = {
      Name: formData.Name,
      Address: formData.Address,
      Phone: formData.Phone,
      LineId: formData.LineID,
      Email: formData.Email,
      PaymentDueStart: formData.PaymentDueStart
        ? parseInt(formData.PaymentDueStart)
        : null,
      PaymentDueEnd: formData.PaymentDueEnd
        ? parseInt(formData.PaymentDueEnd)
        : null,
    };

    try {
      if (savedBuildingId) {
        await apartmentService.putApartment(savedBuildingId, payload);
        alert("แก้ไขข้อมูลสำเร็จ!");
      }
      navigate("/settings");
    } catch (error) {
      console.error("API Error:", error);
      const errorMsg =
        error.response?.data?.message || "เกิดข้อผิดพลาดในการบันทึกข้อมูล";
      alert(errorMsg);
    }
  };

  return (
    <div className="min-h-110vh">
      <div className="relative px-4">
        <ExitButton onClick={handleClose} className="absolute right-0 top-0" />
        <div className="flex-1 px-2 py-0.5 overflow-y-auto pr-2 custom-scrollbar md:max-w-xl items-center justify mx-auto">
          <h1 className="text-2xl font-bold text-center text-gray-800 mb-6">
            แก้ไขข้อมูลหอพัก
          </h1>

          <StepIndicator step={step} />

          <div className="flex-1 px-2 py-0.5 overflow-y-auto pr-2 custom-scrollbar md:max-w-xl items-center justify mx-auto">
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

            {step === 2 && (
              <div className="space-y-4 animate-in fade-in duration-300">
                <p className="text-center font-bold text-xl text-gray-600 mb-2">
                  ที่อยู่หอพัก
                </p>
                <div className="space-y-1">
                  <textarea
                    name="Address"
                    value={formData.Address}
                    onChange={handleChange}
                    placeholder="รายละเอียดที่อยู่..."
                    className="w-full p-3 bg-white border border-gray-400 rounded-xl outline-none focus:ring focus:ring-orange-400 h-44 text-md leading-relaxed"
                  />
                </div>
              </div>
            )}

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
                    min="1"
                    max="31"
                    placeholder="1-31"
                  />
                  <InputField
                    label="วันสิ้นสุดชำระ"
                    name="PaymentDueEnd"
                    value={formData.PaymentDueEnd}
                    onChange={handleChange}
                    min="1"
                    max="31"
                    placeholder="1-31"
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
    </div>
  );
};

const StepIndicator = ({ step }) => (
  <div className="flex items-center justify-center gap-2 mb-8">
    {[1, 2, 3].map((s) => (
      <React.Fragment key={s}>
        <div
          className={`w-9 h-9 rounded-full flex items-center justify-center font-bold shadow-sm transition-all text-sm ${step >= s ? "bg-[#f3a638] text-white" : "bg-white text-gray-300 border border-gray-200"}`}
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
      className="w-full p-2.5 bg-white border border-gray-300 rounded-xl outline-none text-sm focus:ring focus:ring-orange-400 transition-all placeholder:text-gray-300"
      {...props}
    />
  </div>
);

export default BuildingRegisterEdit;
