import { useNavigate } from "react-router-dom";
import React, { useState } from "react";
import { ChevronLeft, Zap, Droplets, CheckSquare, X } from "lucide-react";
import SearchBar from "../components/SearchBar";
import PriceSettingModal from "../components/PriceSettingModal";
import FilterButton from "../components/FilterButton";
import FilterModal from "../components/FilterModal";
import { SelectAllFloorButton, BlueButton } from "../components/ActionButtons";

const UtilitySetting = () => {
  const navigate = useNavigate();

  // เก็บค่าเป็น { title: string, color: string, type: 'simple'|'list' } หรือ null เมื่อปิด
  const [modalConfig, setModalConfig] = useState(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [selectedRooms, setSelectedRooms] = useState([]);

  // ปรับระบบ Filter ให้เป็น Array เพื่อให้เลือกกรองได้มากกว่า 1 สถานะ
  const [activeStatusFilters, setActiveStatusFilters] = useState([]);

  // กำหนดจำนวนห้องแต่ละชั้น [ชั้น 1 มี 5 ห้อง, ชั้น 2-5 มีชั้นละ 15 ห้อง]
  const floorsConfig = [5, 15, 15, 15, 15];

  // จำลองข้อมูลห้องพัก
  const roomsData = [
    { roomNumber: "101", status: "occupied", electricPrice: 5, waterPrice: 10 },
    {
      roomNumber: "102",
      status: "overdue",
      electricPrice: null,
      waterPrice: null,
    },
    { roomNumber: "201", status: "reserved", electricPrice: 7, waterPrice: 15 },
    { roomNumber: "210", status: "occupied", electricPrice: 5, waterPrice: 10 },
    {
      roomNumber: "202",
      status: "available",
      electricPrice: null,
      waterPrice: null,
    },
    {
      roomNumber: "103",
      status: "close",
      electricPrice: null,
      waterPrice: null,
    },
    {
      roomNumber: "104",
      status: "reserved",
      electricPrice: null,
      waterPrice: null,
    },
    { roomNumber: "301", status: "occupied", electricPrice: 7, waterPrice: 15 },
  ];

  // ฟังก์ชันสลับการเลือกห้องรายตัว
  const toggleRoomSelection = (roomNum) => {
    setSelectedRooms((prev) =>
      prev.includes(roomNum)
        ? prev.filter((r) => r !== roomNum)
        : [...prev, roomNum],
    );
  };

  // ฟังก์ชันเลือกทั้งชั้น
  const selectAllInFloor = (floor, count) => {
    const floorRooms = Array.from(
      { length: count },
      (_, i) => `${floor}${String(i + 1).padStart(2, "0")}`,
    );
    setSelectedRooms((prev) => [...new Set([...prev, ...floorRooms])]);
  };

  // ฟังก์ชันเลือกทั้งหมด (ทุกชั้น ทุกห้อง)
  const selectAllRooms = () => {
    const all = [];
    floorsConfig.forEach((count, idx) => {
      const floor = idx + 1;
      for (let i = 1; i <= count; i++) {
        all.push(`${floor}${String(i).padStart(2, "0")}`);
      }
    });
    setSelectedRooms(all);
  };

  // ฟังก์ชันการเลือก Filter
  const toggleStatusFilter = (status) => {
    setActiveStatusFilters((prev) =>
      prev.includes(status)
        ? prev.filter((s) => s !== status)
        : [...prev, status],
    );
  };

  return (
    <div className="flex-1 bg-white min-h-screen">
      <div className="max-w-7xl mx-auto bg-white rounded-[40px] p-8 shadow-lg border border-gray-200 min-h-[calc(100vh-100px)] flex flex-col">
        {/* Header */}
        <div className="relative text-center mb-8">
          <button
            onClick={() => navigate("/settings")}
            className="absolute p-2 right-0 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X size={24} strokeWidth={3} />
          </button>
          <h1 className="text-3xl font-bold text-gray-800">
            กำหนดราคา ค่าน้ำ/ค่าไฟ ต่อหน่วย
          </h1>
        </div>

        {/* Toolbar */}
        <div className="flex flex-col items-center gap-6 mb-10">
          <div className="flex w-full max-w-2xl gap-4">
            <SearchBar
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <FilterButton
              onClick={() => setShowFilterModal(true)}
              activeCount={activeStatusFilters.length}
            />
          </div>

          <div className="flex flex-col sm:flex-row gap-4 w-full justify-center">
            <button
              onClick={() =>
                setModalConfig({
                  title: "กำหนดราคาค่าไฟฟ้า",
                  type: "simple",
                  color: "bg-[#FFCCAC]",
                })
              }
              className="bg-[#e58530] text-white px-6 py-2.5 rounded-2xl font-bold flex items-center gap-2 shadow-md hover:scale-105 transition-all"
            >
              <Zap size={18} fill="currentColor" /> กำหนดค่าไฟฟ้า
            </button>

            <button
              onClick={() =>
                setModalConfig({
                  title: "กำหนดราคาค่าน้ำประปา",
                  type: "simple",
                  color: "bg-[#D1F1F9]",
                })
              }
              className="bg-[#3498DB] text-white px-6 py-2.5 rounded-2xl font-bold flex items-center gap-2 shadow-md hover:scale-105 transition-all"
            >
              <Droplets size={18} fill="currentColor" /> กำหนดค่าน้ำประปา
            </button>
            <BlueButton label="เลือกทั้งหมด" onClick={selectAllRooms} />
            <BlueButton label="ยกเลิก" onClick={() => setSelectedRooms([])} />
          </div>
        </div>

        {/* Room Layout per Floor */}
        <div className="space-y-10">
          {floorsConfig.map((roomCount, idx) => {
            const floor = idx + 1;
            return (
              <div
                key={floor}
                className="bg-gray-50 p-6 rounded-[35px] border border-gray-200"
              >
                <div className="flex justify-between items-center mb-6 px-4">
                  <h2 className="text-xl font-bold text-gray-700">
                    ชั้น {floor}
                  </h2>
                  <SelectAllFloorButton
                    label="เลือกทั้งชั้น"
                    onClick={() => selectAllInFloor(floor, roomCount)}
                  />
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-6 justify-items-center">
                  {Array.from({ length: roomCount }).map((_, roomIdx) => {
                    const roomNum = `${floor}${String(roomIdx + 1).padStart(2, "0")}`;
                    const roomInfo = roomsData.find(
                      (r) => r.roomNumber === roomNum,
                    ) || { status: "available" };
                    const isSelected = selectedRooms.includes(roomNum);

                    // Logic Filter
                    const matchesSearch = roomNum.includes(searchTerm);
                    const matchesStatus =
                      activeStatusFilters.length === 0 ||
                      activeStatusFilters.includes(roomInfo.status);
                    const isVisible = matchesSearch && matchesStatus;

                    // สไตล์สีตามสถานะ
                    const statusStyles = {
                      occupied: "bg-white border-[#10b981] shadow-green-100",
                      overdue: "bg-white border-[#fb7185] shadow-[#fb7185]/10",
                      reserved: "bg-white border-[#facc15] shadow-yellow-100",
                      available: "bg-white border-gray-100",
                      close: "bg-gray-100 border-gray-300 ",
                    };

                    return (
                      <div
                        key={roomNum}
                        onClick={() => toggleRoomSelection(roomNum)}
                        className={`relative w-full max-w-40 p-4 rounded-3xl border-2 transition-all duration-300 flex flex-col gap-2 cursor-pointer 
                          ${isVisible ? "opacity-100 scale-100" : "opacity-20 scale-95 pointer-events-none"}
                          ${isSelected ? "ring-4 ring-[#3498DB]/30 border-[#3498DB]" : statusStyles[roomInfo.status]}`}
                      >
                        <div
                          className={`py-1.5 rounded-xl text-[13px] text-center font-bold ${roomInfo.electricPrice ? "bg-orange-100 text-orange-600" : "bg-gray-100 text-gray-400"}`}
                        >
                          {roomInfo.electricPrice
                            ? `ค่าไฟ ${roomInfo.electricPrice} บาท`
                            : "ค่าไฟ ยังไม่กำหนด"}
                        </div>
                        <div
                          className={`py-1.5 rounded-xl text-[13px] text-center font-bold ${roomInfo.waterPrice ? "bg-blue-100 text-blue-600" : "bg-gray-100 text-gray-400"}`}
                        >
                          {roomInfo.waterPrice
                            ? `ค่าน้ำ ${roomInfo.waterPrice} บาท`
                            : "ค่าน้ำ ยังไม่กำหนด"}
                        </div>
                        <div className="text-center font-bold text-gray-800 text-lg py-1">
                          {roomNum}
                        </div>
                        {isSelected && (
                          <div className="absolute -top-2 -right-2 bg-[#3498DB] text-white rounded-full p-1 shadow-md">
                            <CheckSquare size={18} />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Filter Modal (กรองได้มากกว่า 1) */}
      <FilterModal
        isOpen={showFilterModal}
        onClose={() => setShowFilterModal(false)}
        title="สถานะห้อง"
        onClear={() => setActiveStatusFilters([])}
        onConfirm={() => setShowFilterModal(false)}
        maxWidth="max-w-xl" // กำหนดความกว้างตามโครงเดิมของคุณ
      >
        {/* ส่วนเนื้อหาภายในที่ต้องการให้เป็น 2 คอลัมน์ */}
        <div className="grid grid-cols-2 gap-4">
          {[
            { id: "occupied", label: "มีผู้เช่า" },
            { id: "overdue", label: "ค้างชำระ" },
            { id: "reserved", label: "ติดจอง" },
            { id: "available", label: "ว่าง" },
            { id: "close", label: "ปิดปรับปรุง" },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => toggleStatusFilter(item.id)}
              className={`py-4 rounded-2xl text-base font-bold border-2 transition-all 
          ${
            activeStatusFilters.includes(item.id)
              ? "border-[#F5A623] bg-[#FFF7ED] text-[#F5A623]"
              : "border-gray-100 bg-gray-50 text-gray-500 hover:border-gray-200"
          }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </FilterModal>

      {modalConfig && (
        <PriceSettingModal
          title={modalConfig.title}
          type={modalConfig.type}
          color={modalConfig.color}
          onClose={() => setModalConfig(null)}
          onSave={(data) => {
            console.log("บันทึกค่าน้ำ/ไฟ:", data);
            setModalConfig(null);
          }}
        />
      )}
    </div>
  );
};

export default UtilitySetting;
