import React, { useState } from "react";
import { Zap, Droplets, LayoutList, Calendar as CalendarIcon } from "lucide-react";
import MeterTable from "../components/MeterTable";
import ChangeMeterModal from "../components/ChangeMeterModal";
import { SaveButton, DownloadButton } from "../components/ActionButtons";

// --- Helper Functions ---
const formatThaiMonth = (dateStr) => {
  if (!dateStr) return "-";
  const [year, month] = dateStr.split("-").map(Number);
  const date = new Date(year, month - 1);
  const monthNames = [
    "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน",
    "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"
  ];
  return `${monthNames[date.getMonth()]} ${date.getFullYear() + 543}`;
};

const getPrevMonthStr = (dateStr) => {
  if (!dateStr) return "";
  const [year, month] = dateStr.split("-").map(Number);
  const date = new Date(year, month - 1 - 1, 1);
  const prevYear = date.getFullYear();
  const prevMonth = String(date.getMonth() + 1).padStart(2, "0");
  return `${prevYear}-${prevMonth}`;
};

const Meter = () => {
  // --- State ---
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().slice(0, 7)); 
  const [recordDate, setRecordDate] = useState(new Date().toISOString().split("T")[0]); 
  const [meterType, setMeterType] = useState("water"); 
  const [activeFloor, setActiveFloor] = useState("1");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedRoomForModal, setSelectedRoomForModal] = useState(null);

  // Mock Data
  const [rooms, setRooms] = useState([
    { id: 1, floor: "1", roomId: "101", prevWater: 120, prevElec: 450, currWater: "", currElec: "" },
    { id: 2, floor: "1", roomId: "102", prevWater: 125, prevElec: 460, currWater: "", currElec: "" },
    { id: 3, floor: "2", roomId: "201", prevWater: 130, prevElec: 470, currWater: "", currElec: "" },
    { id: 4, floor: "2", roomId: "202", prevWater: 135, prevElec: 480, currWater: "", currElec: "" },
  ]);

  // --- Logic ---
  const floors = ["1", "2", "3", "4", "5"];
  const filteredRooms = rooms.filter(r => r.floor === activeFloor);
  const currentMonthLabel = formatThaiMonth(selectedDate);
  const prevMonthLabel = formatThaiMonth(getPrevMonthStr(selectedDate));

  const handleInputChange = (id, field, value) => {
    setRooms(prev => prev.map(r => r.id === id ? { ...r, [field]: value } : r));
  };

  const handleOpenModal = (room) => {
    setSelectedRoomForModal(room);
    setIsModalOpen(true);
  };

   const handleSaveChangeMeter = (roomId, type, data) => {
   console.log(`เปลี่ยนมิเตอร์ห้อง ${roomId} (${type}):`, data);
   setRooms((prev) =>
     prev.map((r) => {
       if (r.id === roomId) {
         if (type === "electricity") {
           return {
             ...r,
             ChangeElectricityMeterStart: data.newMeterStart,
             ChangeElectricityMeterEnd: data.oldMeterEnd,
           };
         } else {
           return {
             ...r,
             ChangeWaterMeterStart: data.newMeterStart,
             ChangeWaterMeteEnd: data.oldMeterEnd,
           };
         }
       }
       return r;
     }),
   );
   alert("บันทึกการเปลี่ยนมิเตอร์เรียบร้อย");
 };

  const handleMainSave = () => {
    console.log("Saving...", { recordDate, rooms });
    alert("บันทึกข้อมูลเรียบร้อย");
  };

  return (
    <div className="bg-white min-h-screen">
      
      <div className="max-w-7xl mx-auto bg-white rounded-3xl p-6 shadow-lg border border-gray-200 min-h-[85vh] relative pb-32">
        
        <h1 className="text-3xl font-bold text-center mb-8 text-gray-800">
          จดมิเตอร์ {currentMonthLabel}
        </h1>

        {/* --- Toolbar (ปรับใหม่) --- */}
        <div className="flex flex-col items-center gap-6 mb-8">
          
          {/* Row 1: Month | Record Date | Download */}
          {/* ใช้ flex-row เพื่อให้อยู่บรรทัดเดียวกัน และ items-stretch เพื่อให้สูงเท่ากัน */}
          <div className="flex flex-col md:flex-row w-full max-w-4xl gap-3 items-stretch">
            
            {/* 1. Month Picker */}
            <div className="flex-1 relative min-w-50">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                <CalendarIcon size={20} />
              </div>
              <input
                type="month"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:border-[#f3a638] text-gray-700 font-bold cursor-pointer h-full"
              />
            </div>

            {/* 2. Record Date (ย้ายมาตรงนี้) */}
            <div className="flex-1 flex items-center gap-3 bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 min-w-50 h-full relative focus-within:border-[#f3a638]">
              <span className="text-gray-500 text-sm font-bold whitespace-nowrap">วันที่จด:</span>
              <input 
                type="date" 
                value={recordDate}
                onChange={(e) => setRecordDate(e.target.value)}
                className="bg-transparent border-none outline-none text-gray-700 font-bold w-full cursor-pointer"
              />
            </div>
            
            {/* 3. Download Button */}
            <div className="flex-none">
                <DownloadButton className="h-full px-6" onClick={() => console.log("Download")} />
            </div>
          </div>

          {/* Row 2: Meter Type Tabs */}
          <div className="flex bg-gray-100 p-1 rounded-2xl w-full max-w-2xl">
            {[
              { id: "water", label: "น้ำประปา", icon: Droplets },
              { id: "electricity", label: "ไฟฟ้า", icon: Zap },
            ].map((type) => (
              <button
                key={type.id}
                onClick={() => setMeterType(type.id)}
                className={`flex-1 flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl font-bold transition-all ${
                  meterType === type.id
                    ? type.id === 'water' ? "bg-[#009CDE] text-white shadow-md" : "bg-[#f3a638] text-white shadow-md"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                <type.icon size={18} />
                {type.label}
              </button>
            ))}
          </div>
        </div>

        {/* --- Floor Selection --- */}
        <div className="flex justify-center mb-6">
          <div className="flex flex-col sm:flex-row items-center gap-4 bg-gray-50 p-4 rounded-2xl border border-gray-100">
            <span className="font-bold text-gray-700 whitespace-nowrap">กำลังจดชั้น :</span>
            <div className="flex gap-2 overflow-x-auto no-scrollbar max-w-[80vw] sm:max-w-none p-1">
              {floors.map(floor => (
                <button
                  key={floor}
                  onClick={() => setActiveFloor(floor)}
                  className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl font-bold transition-all flex items-center justify-center border-2 shrink-0 ${
                    activeFloor === floor
                      ? "border-[#f3a638] bg-[#FFF7ED] text-[#f3a638] shadow-sm"
                      : "border-gray-200 bg-white text-gray-400 hover:border-[#f3a638] hover:text-[#f3a638]"
                  }`}
                >
                  {floor}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* --- Content Area --- */}
        <div className="max-w-5xl mx-auto">
          <div className="mb-2 flex items-center justify-end gap-2 text-xs text-gray-400 font-medium px-2">
            <span>ข้อมูลของ:</span>
            <span className="text-gray-600 font-bold">{prevMonthLabel}</span>
            <span>➜</span>
            <span className="text-[#f3a638] font-bold">{currentMonthLabel}</span>
          </div>

          <MeterTable
            rooms={filteredRooms}
            meterType={meterType}
            onInputChange={handleInputChange}
            onOpenChangeMeterModal={(room) => handleOpenModal(room)}
            prevMonthLabel={prevMonthLabel}
            currentMonthLabel={currentMonthLabel}
          />
        </div>

      </div>

      {/* --- Sticky Footer (เหลือแค่ปุ่มบันทึก) --- */}
      <div className="fixed bottom-0 left-0 right-0 bg-white py-2 z-30 overflow-visible">
       <div className="max-w-7xl mx-auto px-6 flex justify-end">
          
       <SaveButton
           onClick={handleMainSave}
           className="w-35 py-2.5! px-10! text-base! sm:w-auto"
         />

        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <ChangeMeterModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSave={handleSaveChangeMeter}
          room={selectedRoomForModal}
          meterType={meterType}
        />
      )}
    </div>
  );
};

export default Meter;