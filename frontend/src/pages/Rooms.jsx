import React, { useState, useEffect, useMemo } from "react";
import {
  Search,
  Filter,
  HelpCircle,
  X,
  LogIn,
  LogOut,
  Wrench,
  Sparkles,
  Package,
  Clock,
} from "lucide-react";
import RoomCard from "../components/RoomCard";

import FilterButton from "../components/FilterButton";
import { roomService } from "../api/RoomApi";

const Rooms = () => {
  const [showLegend, setShowLegend] = useState(false);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  // State สำหรับเก็บ Filter ทั้ง 2 แบบ
  const [activeStatusFilters, setActiveStatusFilters] = useState([]); // กรองสี
  const [activeIconFilters, setActiveIconFilters] = useState([]); // กรองไอคอน

  const [roomsData, setRoomsData] = useState([]);

  const roomsByFloor = useMemo(() => {
    return roomsData.reduce((acc, room) => {
      if (!acc[room.floor]) acc[room.floor] = [];
      acc[room.floor].push(room);
      return acc;
    }, {});
  }, [roomsData]);

  const floors = useMemo(() => {
    return [...new Set(roomsData.map(r => r.floor))]
      .sort((a, b) => Number(a) - Number(b));
  }, [roomsData]);

  // const roomsData = [
  //   {
  //     roomNumber: "101",
  //     floor: 1,
  //     status: "reserved",
  //     icons: ["moveIn", "clean"],
  //     tenantName: "แอปเปิ้ล",
  //   },
  //   {
  //     roomNumber: "102",
  //     floor: 1,
  //     status: "overdue",
  //     icons: ["moveOut"],
  //     tenantName: "มิ้น",
  //   },
  //   {
  //     roomNumber: "104",
  //     floor: 1,
  //     status: "occupied",
  //     icons: ["package"],
  //     tenantName: "กวาง",
  //   },
  //   {
  //     roomNumber: "202",
  //     floor: 2,
  //     status: "occupied",
  //     icons: ["moveOut"],
  //     tenantName: "การ์ตูน",
  //   },
  //   {
  //     roomNumber: "206",
  //     floor: 2,
  //     status: "reserved",
  //     icons: [],
  //     tenantName: "",
  //   },
  //   {
  //     roomNumber: "207",
  //     floor: 2,
  //     status: "overdue",
  //     icons: [],
  //     tenantName: "แพม",
  //   },
  //   {
  //     roomNumber: "208",
  //     floor: 2,
  //     status: "maintenance",
  //     icons: [],
  //     tenantName: "",
  //   },
  //   {
  //     roomNumber: "210",
  //     floor: 2,
  //     status: "occupied",
  //     icons: ["clean"],
  //     tenantName: "มาร์ค",
  //   },
  // ];

  //โหลดข้อมูลจาก backend (useEffect)
useEffect(() => {
    const loadRooms = async () => {
      try {
        const data = await roomService.getRoomOverview();
        const rawRooms = Array.isArray(data) ? data : data?.$values ?? [];

        const today = new Date();

        const normalized = rawRooms.map((room) => {
          const icons = [];

          if (room.ContractStartDate) {
            if (new Date(room.ContractStartDate) <= today) {
              icons.push("moveIn");
            }
          }

          if (room.ContractEndDate) {
            const diffDays =
              (new Date(room.ContractEndDate) - today) /
              (1000 * 60 * 60 * 24);
            if (diffDays <= 30) icons.push("urgent");
          }

          if (room.IsOverdue) icons.push("overdue");

          return {
            ...room,
            floor: String(room.roomFloor),
            building: room.roomBuilding,
            status: room.roomStatus?.toLowerCase(),
            icons,
          };
        });

        setRoomsData(normalized);
      } catch (err) {
        console.error("โหลดผังห้องไม่สำเร็จ", err);
      }
    };

    loadRooms();
  }, []);

  const [activeBuilding, setActiveBuilding] = useState("ALL");

  const filteredRoomsByFloor = useMemo(() => {
    const result = {};

    roomsData.forEach((room) => {
      const matchesIcon =
        activeIconFilters.length === 0 ||
        activeIconFilters.some(i => room.icons.includes(i));

      const matchesStatus =
        activeStatusFilters.length === 0 ||
        activeStatusFilters.includes(room.status);

      const matchesBuilding =
        activeBuilding === "ALL" || room.building === activeBuilding;

      const matchesSearch =
        searchTerm === "" ||
        room.roomNumber?.includes(searchTerm) ||
        room.tenantFirstName?.includes(searchTerm);

      if (
        matchesIcon &&
        matchesStatus &&
        matchesBuilding &&
        matchesSearch
      ) {
        const floor = room.floor;
        if (!result[floor]) result[floor] = [];
        result[floor].push(room);
      }
    });

    Object.values(result).forEach(arr =>
      arr.sort((a, b) =>
        a.roomNumber.localeCompare(b.roomNumber, "th", { numeric: true })
      )
    );

    return result;
  }, [
    roomsData,
    activeIconFilters,
    activeStatusFilters,
    activeBuilding,
    searchTerm,
  ]);

  const buildings = useMemo(() => {
    return ["ALL", ...new Set(roomsData.map(r => r.building).filter(Boolean))];
  }, [roomsData]);

    const buildIcons = (room) => {
      const icons = [];
      const today = new Date();

      if (room.ContractStartDate) {
        const start = new Date(room.ContractStartDate);
        if (start <= today) icons.push("moveIn");
      }

      if (room.ContractEndDate) {
        const end = new Date(room.ContractEndDate);
        const diffDays = (end - today) / (1000 * 60 * 60 * 24);
        if (diffDays <= 30) icons.push("urgent");
      }

      if (room.IsOverdue) {
        icons.push("overdue");
      }

      return icons;
    };

  // ฟังก์ชันปิดเมื่อกดพื้นหลัง
  const handleBackdropClick = (e, closeFunction) => {
    if (e.target === e.currentTarget) {
      closeFunction(false);
    }
  };

  // ฟังก์ชันสลับการเลือก Filter
  const toggleStatusFilter = (status) => {
    setActiveStatusFilters((prev) =>
      prev.includes(status)
        ? prev.filter((s) => s !== status)
        : [...prev, status],
    );
  };

  const toggleIconFilter = (icon) => {
    setActiveIconFilters((prev) =>
      prev.includes(icon) ? prev.filter((i) => i !== icon) : [...prev, icon],
    );
  };


  return (
    <div className="bg-white min-h-screen">
      <div className="max-w-7xl mx-auto bg-white rounded-3xl p-6 shadow-lg border border-gray-200">
        <h1 className="text-3xl font-bold text-center mb-8 text-gray-800">
          ผังห้อง
        </h1>

        {/* --- แถบ Toolbar --- */}
        <div className="flex flex-wrap justify-center gap-4 mb-5">
          <div className="relative w-full max-w-md">
            <input
              type="text"
              placeholder="ค้นหาจากเลขห้องหรือชื่อ"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-xl shadow-sm border border-gray-200 focus:ring-2 focus:ring-[#F5A623] outline-none transition-all"
            />
            <Search
              className="absolute left-3 top-2.5 text-gray-400"
              size={20}
            />
          </div>

          <FilterButton
            onClick={() => setShowFilterModal(true)}
            activeCount={activeStatusFilters.length + activeIconFilters.length}
          />
          {/* ปุ่มฟิลเตอร์เดิม แต่ย้ายไปสร้าง componentแทน */}
          {/* <button 
            onClick={() => setShowFilterModal(true)}
            className="bg-[#F5A623] text-white px-20 py-2 rounded-xl font-bold hover:bg-[#e29528] flex items-center gap-2 shadow-md transition-all"
          >
            <FilterIcon size={18} /> Filter
            {(activeStatusFilters.length > 0 || activeIconFilters.length > 0) && (
              <span className="bg-white text-[#F5A623] w-5 h-5 rounded-full text-xs flex items-center justify-center">
                {activeStatusFilters.length + activeIconFilters.length}
              </span>
            )}
          </button> */}

          <button
            onClick={() => setShowLegend(true)}
            className="bg-[#f5d4ad] text-[#6e4a1f] px-6 py-2 rounded-xl font-bold flex items-center gap-2 shadow-md hover:bg-[#f0c594] transition-all"
          >
            คำอธิบาย <HelpCircle size={18} />
          </button>
        </div>

        <div className="flex gap-2 flex-wrap justify-center mb-10">
          {buildings.map((b) => (
            <button
              key={b}
              onClick={() => setActiveBuilding(b)}
              className={`px-3 py-2 rounded-xl font-bold transition-all
                ${
                  activeBuilding === b
                    ? "bg-[#F5A623] text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
            >
              อาคาร {b}
            </button>
          ))}
        </div>
        

        {/* --- ส่วนแสดงผังห้องแยกตามชั้น --- */}
        <div className="space-y-8">
          {floors.map((floor) => (
            <div key={floor} className="bg-gray-100 p-6 rounded-3xl">
              <h2 className="text-xl font-bold mb-6">ชั้น {floor}</h2>

              <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
                {filteredRoomsByFloor[floor]?.map((room) => (
                  <RoomCard
                    key={room.roomId}
                    roomNumber={room.roomNumber}
                    building={room.building}
                    tenantName={room.tenantFirstName || ""}
                    status={room.status}
                    icons={room.icons}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* --- Filter Modal --- */}
      {showFilterModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm p-4"
          onClick={(e) => handleBackdropClick(e, setShowFilterModal)}
        >
          <div className="bg-white p-8 rounded-[40px] shadow-2xl w-full max-w-2xl border border-gray-100 animate-in zoom-in duration-200">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">ตัวกรองผังห้อง</h2>
              <button
                onClick={() => setShowFilterModal(false)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            {/* หมวดหมู่ 1: กรองตามสถานะ (สี) */}
            <div className="mb-8">
              <p className="text-lg font-bold text-gray-600 mb-4">สถานะห้อง</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {[
                  { id: "occupied", label: "มีผู้เช่า" },
                  { id: "overdue", label: "ค้างชำระ" },
                  { id: "reserved", label: "จอง" },
                  { id: "available", label: "ว่าง" },
                  { id: "maintenance", label: "ปิดปรับปรุง" },
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => toggleStatusFilter(item.id)}
                    className={`py-3 rounded-xl text-base font-bold transition-all border-2 ${activeStatusFilters.includes(item.id) ? "border-[#F5A623] bg-[#FFF7ED] text-[#F5A623]" : "border-gray-100 bg-gray-50 text-gray-500 hover:border-gray-200"}`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* หมวดหมู่ 2: กรองตามกิจกรรม (Icon) */}
            <div className="mb-8">
              <p className="text-lg font-bold text-gray-600 mb-4">
                กิจกรรม/การแจ้งเตือน
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {[
                  { id: "moveIn", label: "ย้ายเข้า" },
                  { id: "moveOut", label: "ย้ายออก" },
                  { id: "repair", label: "แจ้งซ่อม" },
                  { id: "clean", label: "ทำความสะอาด" },
                  { id: "package", label: "ค้างรับพัสดุ" },
                  { id: "urgent", label: "ใกล้ครบสัญญา" },
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => toggleIconFilter(item.id)}
                    className={`py-3 rounded-xl text-base font-bold transition-all border-2 ${activeIconFilters.includes(item.id) ? "border-[#F5A623] bg-[#FFF7ED] text-[#F5A623]" : "border-gray-100 bg-gray-50 text-gray-500 hover:border-gray-200"}`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-4 pt-4 border-t">
              <button
                onClick={() => {
                  setActiveStatusFilters([]);
                  setActiveIconFilters([]);
                }}
                className="flex-1 py-3 text-gray-500 font-bold hover:bg-gray-50 rounded-xl transition-all"
              >
                ล้างทั้งหมด
              </button>
              <button
                onClick={() => setShowFilterModal(false)}
                className="flex-2 bg-[#F5A623] text-white py-3 rounded-xl font-bold shadow-lg hover:shadow-orange-200 transition-all"
              >
                ตกลง
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- Modal คำอธิบาย --- */}
      {showLegend && <LegendModal onClose={() => setShowLegend(false)} />}
    </div>
  );
}
// --- Component ย่อย (ปรับปรุงการรับส่งฟังก์ชัน) ---
const LegendModal = ({ onClose }) => {
  // สร้างฟังก์ชันภายในคอมโพเนนต์เองเพื่อให้ทำงานได้
  const internalBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
      onClick={internalBackdropClick}
    >
      <div
        className="bg-white rounded-[40px] w-full max-w-2xl p-8 relative shadow-2xl animate-in fade-in zoom-in duration-200"
        onClick={(e) => e.stopPropagation()} // ป้องกันการปิดเมื่อคลิกข้างในกล่อง
      >
        <button
          onClick={onClose}
          className="absolute right-6 top-6 text-gray-400 hover:text-black"
        >
          <X size={24} strokeWidth={3} />
        </button>
        {/* ... (เนื้อหาข้างในเหมือนเดิม) ... */}
        <h3 className="text-2xl font-bold text-center mb-10">
          คำอธิบายสถานะห้อง
        </h3>

        <div className="grid grid-cols-5 gap-4 mb-12 text-center">
          <LegendItem color="bg-[#10b981]" label="มีผู้เช่า" />
          <LegendItem color="bg-[#fb7185]" label="ค้างชำระ" />
          <LegendItem color="bg-[#facc15]" label="ติดจอง" />
          <LegendItem color="bg-white border-2 border-gray-200" label="ว่าง" />
          <LegendItem color="bg-[#4b5563]" label="ปิดปรับปรุง" />
        </div>

        <div className="grid grid-cols-2 gap-y-6 gap-x-8 px-4">
          <IconDetail
            icon={<LogIn className="text-green-600" />}
            text="วันย้ายเข้า"
          />
          <IconDetail
            icon={<Wrench className="text-blue-600" />}
            text="แจ้งซ่อมบำรุง"
          />
          <IconDetail
            icon={<LogOut className="text-red-600" />}
            text="วันย้ายออก"
          />
          <IconDetail
            icon={<Sparkles className="text-cyan-500" />}
            text="แจ้งทำความสะอาด"
          />
          <div className="flex items-start gap-3">
            <div className="p-1 bg-orange-100 rounded-md">
              <Clock className="text-orange-500" size={26} />
            </div>
            <div>
              <p className="font-bold text-[18px] ">ใกล้ครบสัญญา</p>
              <p className="text-[14px] text-gray-500">
                เหลือเวลาสัญญาน้อยกว่า 30 วัน
              </p>
            </div>
          </div>
          <IconDetail
            icon={<Package className="text-amber-800" />}
            text="ค้างรับพัสดุ"
          />
        </div>
      </div>
    </div>
  );
};

const LegendItem = ({ color, label }) => (
  <div className="flex flex-col items-center gap-2">
    <div className={`w-18 h-18 rounded-xl ${color}`}></div>
    <span className="text-[18px] text-gray-700 font-bold">{label}</span>
  </div>
);

const IconDetail = ({ icon, text }) => (
  <div className="flex items-center gap-3">
    <div className="p-1 bg-gray-100 rounded-md">
      {React.cloneElement(icon, { size: 26 })}
    </div>
    <span className="font-bold text-gray-700 text-[18px]">{text}</span>
  </div>
);

export default Rooms;