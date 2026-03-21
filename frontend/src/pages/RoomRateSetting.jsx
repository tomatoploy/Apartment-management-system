import { useNavigate } from "react-router-dom";
import React, { useState, useEffect, useMemo } from "react";
import { Zap, Droplets, CheckSquare, X, Loader2 } from "lucide-react";
import SearchBar from "../components/SearchBar";
import PriceSettingModal from "../components/PriceSettingModal";
import FilterButton from "../components/FilterButton";
import FilterModal from "../components/FilterModal";
import { SelectAllFloorButton, BlueButton, ExitButton } from "../components/ActionButtons";

// ✨ Import Services
import { roomService } from "../api/RoomApi";
import { contractService } from "../api/ContractApi";
import { paymentService } from "../api/PaymentApi"; // เพิ่มเพื่อจัดการ AdditionalCost

const UtilitySetting = () => {
  const navigate = useNavigate();

  const [modalConfig, setModalConfig] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [selectedRooms, setSelectedRooms] = useState([]);
  const [activeStatusFilters, setActiveStatusFilters] = useState([]);

  const [roomsData, setRoomsData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // --- 1. ดึงข้อมูลจาก API ---
  const fetchData = async () => {
    setIsLoading(true);
    try {
      const res = await roomService.getRoomOverview();
      const data = Array.isArray(res) ? res : (res?.$values || []);
      setRoomsData(data);
    } catch (error) {
      console.error("Error fetching rooms:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // --- 2. จัดกลุ่มห้องตามชั้น ---
  const roomsByFloor = useMemo(() => {
    const groups = {};
    roomsData.forEach((room) => {
      const floor = String(room.roomFloor || "1");
      if (!groups[floor]) groups[floor] = [];
      groups[floor].push(room);
    });
    Object.keys(groups).forEach(floor => {
      groups[floor].sort((a, b) => a.roomNumber.localeCompare(b.roomNumber, undefined, {numeric: true}));
    });
    return groups;
  }, [roomsData]);

  const floors = Object.keys(roomsByFloor).sort((a, b) => Number(a) - Number(b));

  const toggleRoomSelection = (roomNum) => {
    setSelectedRooms((prev) =>
      prev.includes(roomNum) ? prev.filter((r) => r !== roomNum) : [...prev, roomNum]
    );
  };

  const selectAllInFloor = (floor) => {
    const floorRoomNums = roomsByFloor[floor].map(r => r.roomNumber);
    setSelectedRooms((prev) => [...new Set([...prev, ...floorRoomNums])]);
  };

  const selectAllRooms = () => {
    setSelectedRooms(roomsData.map(r => r.roomNumber));
  };

  const toggleStatusFilter = (status) => {
    setActiveStatusFilters((prev) =>
      prev.includes(status) ? prev.filter((s) => s !== status) : [...prev, status]
    );
  };

  // --- 3. บันทึกข้อมูล (ลอจิกแยกตามประเภทค่าใช้จ่าย) ---
  const handleSaveSettings = async (data) => {
    if (selectedRooms.length === 0) return alert("กรุณาเลือกห้องที่ต้องการกำหนดราคา");
    
    setIsLoading(true);
    try {
      const targetRooms = roomsData.filter(r => selectedRooms.includes(r.roomNumber));
      const today = new Date();
      const currentYear = today.getFullYear();
      const currentMonth = today.getMonth() + 1;

      for (const room of targetRooms) {
        if (modalConfig.type === "simple") {
          // 🏠 CASE: แก้ไขค่าเช่าห้อง (MonthlyRent ในสัญญา)
          if (room.contractId) {
            await contractService.putContract(room.contractId, {
              ...room, 
              monthlyRent: Number(data.price || data) // รับค่าจาก Simple Modal
            });
          }
        } else {
          // 🛠️ CASE: ค่าบริการอื่นๆ (อัปเดต AdditionalCost ในบิลเดือนปัจจุบัน)
          const totalServiceFee = data.reduce((sum, item) => sum + Number(item.cost || 0), 0);
          const serviceDetails = data.map(item => `${item.subject} (${Number(item.cost).toLocaleString()}บ.)`).join(", ");

          // ใช้ API สำหรับอัปเดต AdditionalCost (ถ้าไม่มีบิลให้สร้างใหม่)
          await paymentService.upsertAdditionalCost({
            roomId: room.roomId || room.id,
            year: currentYear,
            month: currentMonth,
            additionalCost: totalServiceFee,
            additionalDetail: serviceDetails
          });
        }
      }

      alert("บันทึกข้อมูลเรียบร้อยแล้ว");
      setModalConfig(null);
      setSelectedRooms([]);
      fetchData(); 
    } catch (error) {
      console.error("Save Error:", error);
      alert("เกิดข้อผิดพลาดในการบันทึกข้อมูล");
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading && roomsData.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <Loader2 className="animate-spin text-orange-500" size={40} />
        <p className="font-bold text-gray-500">กำลังโหลดข้อมูลห้องพัก...</p>
      </div>
    );
  }

  return (
    <>
      {/* Header */}
      <div className="relative text-center mb-8">
        <ExitButton onClick={() => navigate("/settings")} className="absolute p-2 right-0 hover:bg-gray-100 rounded-full transition-colors" />
        <h1 className="text-3xl font-bold text-gray-800">กำหนดค่าเช่าห้อง</h1>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col items-center gap-6 mb-10">
        <div className="flex w-full max-w-2xl gap-4 px-4">
          <SearchBar value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
          <FilterButton onClick={() => setShowFilterModal(true)} activeCount={activeStatusFilters.length} />
        </div>

        <div className="flex flex-col sm:flex-row gap-4 w-full justify-center px-4">
          {/* 🟠 เปลี่ยนเป็นสีส้ม และ Popup พื้นหลังขาว */}
          <button
            onClick={() => setModalConfig({ title: "กำหนดราคาค่าเช่าห้อง", type: "simple", color: "bg-white" })}
            className="bg-[#f3a638] text-white px-6 py-2.5 rounded-2xl font-bold flex items-center gap-2 shadow-md hover:scale-105 transition-all"
          >
            กำหนดค่าเช่าห้อง
          </button>
          <button
            onClick={() => setModalConfig({ title: "กำหนดราคาค่าบริการอื่นๆ", type: "list", color: "bg-white" })}
            className="bg-[#f3a638] text-white px-6 py-2.5 rounded-2xl font-bold flex items-center gap-2 shadow-md hover:scale-105 transition-all"
          >
            กำหนดค่าบริการอื่นๆ
          </button>

          <BlueButton label="เลือกทั้งหมด" onClick={selectAllRooms} />
          <BlueButton label="ยกเลิก" onClick={() => setSelectedRooms([])} />
        </div>
      </div>

      {/* Room Layout per Floor */}
      <div className="space-y-10 px-4">
        {floors.map((floor) => (
          <div key={floor} className="bg-gray-50 p-6 rounded-[35px] border border-gray-200">
            <div className="flex justify-between items-center mb-6 px-4">
              <h2 className="text-xl font-bold text-gray-700">ชั้น {floor}</h2>
              <SelectAllFloorButton label="เลือกทั้งชั้น" onClick={() => selectAllInFloor(floor)} />
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-6 justify-items-center">
              {roomsByFloor[floor].map((roomInfo) => {
                const roomNum = roomInfo.roomNumber;
                const isSelected = selectedRooms.includes(roomNum);

                const matchesSearch = roomNum.includes(searchTerm);
                const matchesStatus = activeStatusFilters.length === 0 || activeStatusFilters.includes(roomInfo.roomStatus?.toLowerCase());
                if (!matchesSearch || !matchesStatus) return null;

                const statusStyles = {
                  occupied: "bg-white border-[#10b981] shadow-green-100",
                  overdue: "bg-white border-[#fb7185] shadow-[#fb7185]/10",
                  reserved: "bg-white border-[#facc15] shadow-yellow-100",
                  available: "bg-white border-gray-100", 
                  maintenance: "bg-gray-100 border-gray-300 ",
                };

                const currentStatus = roomInfo.roomStatus?.toLowerCase() || "available";

                return (
                  <div
                    key={roomNum}
                    onClick={() => toggleRoomSelection(roomNum)}
                    className={`relative w-full max-w-40 p-4 rounded-3xl border-2 transition-all duration-300 flex flex-col gap-2 cursor-pointer 
                      ${isSelected ? "ring-4 ring-[#3498DB]/30 border-[#3498DB]" : statusStyles[currentStatus] || statusStyles.available}`}
                  >
                    {/* แสดงยอด MonthlyRent จากสัญญาจริง */}
                    <div className={`py-1.5 rounded-xl text-[12px] text-center font-bold ${roomInfo.monthlyRent ? "bg-orange-100 text-orange-600" : "bg-gray-100 text-gray-400"}`}>
                      {roomInfo.monthlyRent ? `ค่าเช่า ${roomInfo.monthlyRent.toLocaleString()} บ.` : "ยังไม่กำหนด"}
                    </div>
                    {/* แสดงยอด AdditionalCost (ถ้ามี) */}
                    <div className={`py-1.5 rounded-xl text-[12px] text-center font-bold ${roomInfo.additionalCost ? "bg-blue-100 text-blue-600" : "bg-gray-100 text-gray-400"}`}>
                      {roomInfo.additionalCost ? `บริการ ${roomInfo.additionalCost.toLocaleString()} บ.` : "บริการ 0 บ."}
                    </div>
                    <div className="text-center font-bold text-gray-800 text-lg py-1">{roomNum}</div>
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
        ))}
      </div>

      {/* Filter Modal */}
      <FilterModal isOpen={showFilterModal} onClose={() => setShowFilterModal(false)} title="สถานะห้อง" onClear={() => setActiveStatusFilters([])} onConfirm={() => setShowFilterModal(false)} maxWidth="max-w-xl">
        <div className="grid grid-cols-2 gap-4">
          {[
            { id: "occupied", label: "มีผู้เช่า" },
            { id: "overdue", label: "ค้างชำระ" },
            { id: "reserved", label: "ติดจอง" },
            { id: "available", label: "ว่าง" },
            { id: "maintenance", label: "ปิดปรับปรุง" },
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

      {/* Modal กำหนดราคา */}
      {modalConfig && (
        <PriceSettingModal
          {...modalConfig}
          onClose={() => setModalConfig(null)}
          onSave={handleSaveSettings}
        />
      )}
    </>
  );
};

export default UtilitySetting;