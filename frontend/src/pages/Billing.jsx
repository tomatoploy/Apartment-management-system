import React, { useState, useMemo } from "react";
import {
  Calendar as CalendarIcon,
  HelpCircle,
  CheckSquare,
  Printer,
  FileText,
  Send,
  Plus,
  X,
  Filter as FilterIcon, // เปลี่ยนชื่อเพื่อให้ไม่ซ้ำกับตัวแปรอื่น
} from "lucide-react";

import RoomCard from "../components/RoomCard";
import FilterButton from "../components/FilterButton";
import FilterModal from "../components/FilterModal";
import SearchBar from "../components/SearchBar";
import {
  BlueButton,
  GreenButton,
  OrangeButton,
  DownloadButton,
  SelectAllFloorButton,
  WhiteButton,
} from "../components/ActionButtons";
import { useNavigate } from "react-router-dom";

const Billing = () => {
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().slice(0, 7),
  );
  const [searchTerm, setSearchTerm] = useState("");
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [activeStatusFilters, setActiveStatusFilters] = useState([]);
  const [selectedRooms, setSelectedRooms] = useState([]);
  const [isSelectMode, setIsSelectMode] = useState(false);
  const activeFilterCount = activeStatusFilters.length;
  const navigate = useNavigate();

  //การทำงานแสดงเฉพาะห้องที่ไม่ว่าง เพื่อออกบิล
  // Mock Data
  const [roomsData] = useState([
    {
      roomId: 1,
      roomNumber: "102",
      floor: 1,
      status: "overdue",
      tenantFirstName: "มิ้น",
      rent: 3000,
      water: 200,
      electric: 300,
      otherService: 0,
      total: 3500,
      icons: [],
    },
    {
      roomId: 2,
      roomNumber: "104",
      floor: 1,
      status: "occupied",
      tenantFirstName: "กวาง",
      rent: 2000,
      water: 250,
      electric: 250,
      otherService: 0,
      total: 2500,
      icons: [],
    },
    {
      roomId: 3,
      roomNumber: "201",
      floor: 2,
      status: "occupied",
      tenantFirstName: "บิว",
      rent: 3000,
      water: 150,
      electric: 400,
      otherService: 0,
      total: 3550,
      icons: [],
    },
    {
      roomId: 4,
      roomNumber: "207",
      floor: 2,
      status: "overdue",
      tenantFirstName: "แพม",
      rent: 3000,
      water: 143,
      electric: 300,
      otherService: 0,
      total: 3443,
      icons: [],
    },
    {
      roomId: 5,
      roomNumber: "210",
      floor: 2,
      status: "pending",
      tenantFirstName: "มาร์ค",
      rent: 2800,
      water: 117,
      electric: 300,
      otherService: 0,
      total: 3217,
      icons: [],
    },
  ]);

  // Filter Logic
  const filteredRoomsByFloor = useMemo(() => {
    const grouped = {};
    roomsData.forEach((room) => {
      const matchesSearch =
        room.roomNumber.includes(searchTerm) ||
        (room.tenantFirstName && room.tenantFirstName.includes(searchTerm));
      const matchesStatus =
        activeStatusFilters.length === 0 ||
        activeStatusFilters.includes(room.status);
      if (matchesSearch && matchesStatus) {
        if (!grouped[room.floor]) grouped[room.floor] = [];
        grouped[room.floor].push(room);
      }
    });
    return grouped;
  }, [roomsData, searchTerm, activeStatusFilters]);

  const floors = Object.keys(filteredRoomsByFloor).sort();

  // Handlers
  const toggleRoomSelection = (roomNum) => {
    setSelectedRooms((prev) =>
      prev.includes(roomNum)
        ? prev.filter((id) => id !== roomNum)
        : [...prev, roomNum],
    );
  };

  const selectAllInFloor = (floor) => {
    const floorRoomNums =
      filteredRoomsByFloor[floor]?.map((r) => r.roomNumber) || [];
    setSelectedRooms((prev) => [...new Set([...prev, ...floorRoomNums])]);
  };

  const toggleStatusFilter = (status) => {
    setActiveStatusFilters((prev) =>
      prev.includes(status)
        ? prev.filter((s) => s !== status)
        : [...prev, status],
    );
  };

  // รับ Props มาจาก App.jsx
  return (
    <div className="bg-white min-h-screen">
      <div className="max-w-7xl mx-auto bg-white rounded-3xl p-6 shadow-lg border border-gray-200">
        <h1 className="text-3xl font-bold text-center mb-8 text-gray-800">
          การออกบิล
        </h1>

        {/* --- Toolbar & Action Buttons --- */}
        <div className="flex flex-col gap-6 mb-10">
          {/* ส่วนที่ 1: รอบบิล และ สร้างบิลใหม่ */}
          <div className="flex flex-col md:flex-row items-center justify-center gap-4">
            <div className="flex items-center gap-3 w-full md:w-auto">
              <span className="font-bold text-gray-600">รอบบิล</span>
              <div className="relative flex-1 md:w-64">
                <CalendarIcon
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                  size={20}
                />
                <input
                  type="month"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:border-[#f3a638] font-bold"
                />
              </div>
            </div>
            <OrangeButton
              label="สร้างบิลใหม่"
               onClick={() => {
                  alert("สร้างบิลสำเร็จ!");}}
              className="shadow-md"
              icon={Plus}
              
            />
          </div>

          {/* ส่วนที่ 2: Search และ Filter (จัดกลางหน้า) */}
          <div className="flex flex-col px-4 w-full max-w-3xl mx-auto md:flex-row items-center gap-4">
            {/* Search Bar */}
            <div className="w-full md:flex-1">
              <SearchBar value={searchTerm} onChange={setSearchTerm} />
            </div>

            {/* กลุ่มปุ่ม Filter และ คำอธิบาย */}
            <div className="flex gap-3 w-full md:w-auto">
              <FilterButton
                label="Filter"
                icon={FilterIcon}
                onClick={() => setShowFilterModal(true)}
                activeCount={activeFilterCount}
                className="md:flex-1 "
              />

              <div className="flex-1 md:w-40">
                <WhiteButton
                  label="คำอธิบาย"
                  icon={HelpCircle}
                  onClick={() => setShowHelpModal(true)}
                />
              </div>
            </div>
          </div>

          <div className="mx-auto max-w-3xl grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 px-4 w-full">
            <WhiteButton label="พิมพ์บิลค่าเช่า" icon={Printer} />
            <WhiteButton label="พิมพ์ใบสรุปบิล" icon={FileText} />
            <DownloadButton label="ดาวน์โหลด Excel" />
            <GreenButton
              label={`ส่งบิล (${selectedRooms.length})`}
              icon={Send}
              onClick={() => setShowSummary(true)}
            />
          </div>

          {/* ส่วนที่ 4: โหมดเลือกห้อง */}
          <div className="flex gap-3 w-full max-w-3xl mx-auto justify-end px-4">
            {!isSelectMode ? (
              <BlueButton label="เลือกห้อง"
              className="w-full px-20 md:w-auto" 
              onClick={() => setIsSelectMode(true)} />
              
            ) : (
              <>
                <BlueButton
                  label="เลือกทั้งหมด"
                  onClick={() =>
                    setSelectedRooms(roomsData.map((r) => r.roomNumber))
                  }                />
                <BlueButton
                  label="ยกเลิก"
                  onClick={() => {
                    setSelectedRooms([]);
                    setIsSelectMode(false);
                  }}
                />
              </>
            )}
          </div>
        </div>

        {/* --- ส่วนแสดงผลห้องแยกตามชั้น --- */}
        <div className="space-y-8">
          {floors.map((floor) => (
            <div
              key={floor}
              className="bg-gray-50 p-6 rounded-[35px] border border-gray-200 shadow-sm"
            >
              <div className="flex justify-between items-center mb-6 px-4">
                <h2 className="text-xl font-bold text-gray-700">
                  ชั้น {floor}
                </h2>
                <SelectAllFloorButton onClick={() => selectAllInFloor(floor)} />
              </div>

              <div className="grid grid-cols-2 md:grid-cols-5 gap-10 justify-items-center">
                {filteredRoomsByFloor[floor]?.map((room) => {
                  const isSelected = selectedRooms.includes(room.roomNumber);
                  return (
                    <div
                      key={room.roomId}
                      onClick={() => {
                        if (isSelectMode) {
                          toggleRoomSelection(room.roomNumber);
                        } else {
                          navigate(`/billings/${room.roomNumber}`);
                        }
                      }}
                      className="relative cursor-pointer hover:scale-105 transition-all"
                    >
                      <RoomCard
                        roomNumber={room.roomNumber}
                        tenantName={room.tenantFirstName || ""}
                        status={room.status}
                      />

                      {/* ยอดเงินในกราฟิก */}
                      <div className="absolute inset-10 left-0 right-0 text-center z-20">
                        <span className="text-[18px] text-white font-bold">
                          {room.total.toLocaleString()} ฿
                        </span>
                      </div>

                      {isSelected && (
                        <div className="absolute -top-3 -right-3 bg-[#3498DB] text-white rounded-full p-1.5 shadow-lg z-30">
                          <CheckSquare size={20} />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* --- Modal ตารางสรุป --- */}
      {showSummary && (
        <div
          className="fixed inset-0 z-60 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          onClick={() => setShowSummary(false)}
        >
          <div
            className="bg-white rounded-[40px] w-full max-w-6xl p-10 shadow-2xl flex flex-col max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex relative justify-between items-center mb-8">
              <h3 className="text-3xl font-black text-gray-800">
                ตรวจสอบยอดรวมก่อนส่งบิล
              </h3>
              <button
                onClick={() => setShowSummary(false)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X size={32} strokeWidth={3} />
              </button>
            </div>

            <div className="overflow-x-auto rounded-3xl border-2 border-gray-100 mb-8">
              <table className="w-full text-left border-collapse">
                <thead className="bg-gray-50 text-gray-600 text-sm uppercase sticky top-0">
                  <tr>
                    <th className="p-5 font-black border-r border-gray-200 text-center w-24">
                      ห้อง
                    </th>
                    <th className="p-5 font-black border-r border-gray-200">
                      ชื่อผู้เช่า
                    </th>
                    <th className="p-5 font-black border-r border-gray-200 text-right">
                      ค่าเช่า
                    </th>
                    <th className="p-4 font-bold border-r border-gray-200 text-right">
                      ค่าน้ำ
                    </th>
                    <th className="p-4 font-bold border-r border-gray-200 text-right">
                      ค่าไฟ
                    </th>
                    <th className="p-4 font-bold border-r border-gray-200 text-right">
                      บริการอื่นๆ
                    </th>
                    <th className="p-5 font-black text-right text-[#2E86C1] bg-blue-50/50">
                      ยอดรวมสุทธิ
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {roomsData
                    .filter((r) => selectedRooms.includes(r.roomNumber))
                    .map((r) => (
                      <tr
                        key={r.roomNumber}
                        className="hover:bg-blue-50/20 transition-colors"
                      >
                        <td className="p-5 font-black text-gray-700 border-r border-gray-100 text-center bg-gray-50/30">
                          {r.roomNumber}
                        </td>
                        <td className="p-5 text-gray-600 font-bold border-r border-gray-100">
                          {r.tenantFirstName || "-"}
                        </td>
                        <td className="p-5 text-right font-medium border-r border-gray-100">
                          {r.rent.toLocaleString()}
                        </td>
                        <td className="p-4 text-right border-r border-gray-100">
                          {r.water.toLocaleString()}
                        </td>
                        <td className="p-4 text-right border-r border-gray-100">
                          {r.electric.toLocaleString()}
                        </td>
                        <td className="p-4 text-right border-r border-gray-100  ">
                          {(r.otherService || 0).toLocaleString()}
                        </td>
                        <td className="p-5 text-right font-black text-[#2E86C1] bg-blue-50/30">
                          {r.total.toLocaleString()}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end gap-5">
              <GreenButton
                label="ยืนยันการส่งบิล"
                icon={Send}
                onClick={() => {
                  alert("ส่งบิลสำเร็จ!");
                  setShowSummary(false);
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* --- Help Modal (คำอธิบายสถานะห้อง) --- */}
      {showHelpModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
          onClick={() => setShowHelpModal(false)}
        >
          <div
            className="bg-white rounded-[40px] w-full max-w-xl p-10 relative shadow-2xl animate-in fade-in zoom-in duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setShowHelpModal(false)}
              className="absolute right-8 top-8 text-gray-400 hover:text-black transition-colors"
            >
              <X size={28} strokeWidth={3} />
            </button>
            <h3 className="text-2xl font-bold text-center mb-10">
              คำอธิบายสถานะห้อง
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
              {[
                { color: "bg-[#10b981]", label: "ชำระเงินแล้ว" },
                { color: "bg-[#fb7185]", label: "ค้างชำระ" },
                { color: "bg-[#94a3b8]", label: "รอการชำระเงิน" },
              ].map((item, idx) => (
                <div key={idx} className="flex flex-col items-center gap-3">
                  <div
                    className={`w-18 h-18 ${item.color} rounded-2xl shadow-inner`}
                  ></div>
                  <span className="text-[18px] font-bold text-gray-700">
                    {item.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* --- Filter Modal --- */}

      <FilterModal
        isOpen={showFilterModal}
        onClose={() => setShowFilterModal(false)}
        title="สถานะการชำระเงิน"
        activeCount={activeFilterCount}
        onConfirm={() => setShowFilterModal(false)}
        onClear={() => setActiveStatusFilters([])}
        maxWidth="max-w-xl"
      >
        <div className="grid grid-cols-2 gap-4">
          {[
            { id: "occupied", label: "จ่ายแล้ว" },
            { id: "overdue", label: "ค้างชำระ" },
            { id: "pending", label: "รอการชำระเงิน" },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => toggleStatusFilter(item.id)}
              className={`py-4 rounded-2xl text-base font-bold border-2 transition-all
                ${activeStatusFilters.includes(item.id) ? "border-[#F5A623] bg-[#FFF7ED] text-[#F5A623]" : "border-gray-100 bg-gray-50 text-gray-500 hover:border-gray-200"}`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </FilterModal>
    </div>
  );
};

export default Billing;
