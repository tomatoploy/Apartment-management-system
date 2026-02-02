import { useState, useEffect, useMemo, useRef } from "react";
import { utilityMeterService } from "../api/UtilityMeterApi";
import { Zap, Droplets, LayoutList, Calendar as CalendarIcon } from "lucide-react";
import MeterTable from "../components/MeterTable";
import ChangeMeterModal from "../components/ChangeMeterModal";
import { SaveButton, DownloadButton } from "../components/ActionButtons";
import * as XLSX from "xlsx";

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
const toNumberOrNull = (v) => {
  if (v === "" || v == null) return null;
  const n = Number(v);
  return isNaN(n) ? null : n;
};
const getPrevMonthStr = (dateStr) => {
  if (!dateStr) return "";

  const [year, month] = dateStr.split("-").map(Number);

  const date = new Date(year, month - 1, 1);
  date.setMonth(date.getMonth() - 1);

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
  const [isSaving, setIsSaving] = useState(false);
  const cacheRef = useRef({});

  // Export Excel (เฉพาะเดือนที่เลือก)
  const handleDownload = async () => {
    try {
      const confirmDownload = window.confirm("ต้องการดาวน์โหลดข้อมูลมิเตอร์ประจำเดือนนี้ใช่หรือไม่?");
      if (!confirmDownload) return;

      const [year, month] = selectedDate.split("-").map(Number);
      const thaiMonth = formatThaiMonth(selectedDate);

      // 1. ดึงข้อมูล
      let monthlyData = await utilityMeterService.getUtilityMetersByMonth(year, month);

      if (!monthlyData || monthlyData.length === 0) {
        alert(`ไม่พบข้อมูลของเดือน ${thaiMonth}`);
        return;
      }

      // เรียงลำดับตาม RoomId
      monthlyData.sort((a, b) => a.roomId - b.roomId);

      // 2. เตรียมข้อมูลแบบ Array of Arrays (วิธีนี้ชัวร์ที่สุด)
      
      // 2.1 หัวข้อคอลัมน์ (Row 2)
      const tableHeaders = [
        "ห้อง", 
        "ชั้น", 
        "มิเตอร์ไฟ (เดือนก่อน)", 
        "มิเตอร์ไฟ (เดือนนี้)", 
        "ไฟที่ใช้ (หน่วย)", 
        "เปลี่ยนมิเตอร์ไฟ (เก่า)", 
        "เปลี่ยนมิเตอร์ไฟ (ใหม่)",
        "มิเตอร์น้ำ (เดือนก่อน)", 
        "มิเตอร์น้ำ (เดือนนี้)", 
        "น้ำที่ใช้ (หน่วย)", 
        "เปลี่ยนมิเตอร์น้ำ (เก่า)", 
        "เปลี่ยนมิเตอร์น้ำ (ใหม่)",
        "หมายเหตุ"
      ];

      // 2.2 ข้อมูลเนื้อหา (Row 3 เป็นต้นไป)
      const dataRows = monthlyData.map((item) => [
        item.roomNumber,                                // A
        item.floor,                                     // B
        item.prevElectricityUnit ?? "-",                // C
        item.electricityUnit ?? "-",                    // D
        item.electricityUsed ?? "0",                    // E
        item.changeElectricityMeterEnd ?? "-",          // F
        item.changeElectricityMeterStart ?? "-",        // G
        item.prevWaterUnit ?? "-",                      // H
        item.waterUnit ?? "-",                          // I
        item.waterUsed ?? "0",                          // J
        item.changeWaterMeterEnd ?? "-",                // K
        item.changeWaterMeterStart ?? "-",              // L
        item.note ?? ""                                 // M
      ]);

      // 2.3 รวมข้อมูลทั้งหมด: [ [Title], [Headers], ...[Data] ]
      const finalData = [
        [`รายงานมิเตอร์ประจำเดือน ${thaiMonth}`], // Row 1: Title
        tableHeaders,                             // Row 2: Headers
        ...dataRows                               // Row 3+: Data
      ];

      // 3. สร้าง Worksheet
      const worksheet = XLSX.utils.aoa_to_sheet(finalData);

      // --- จัดการ Layout ---

      // Merge Title (A1 ถึง M1) -> (M คือ index 12)
      worksheet["!merges"] = [
        { s: { r: 0, c: 0 }, e: { r: 0, c: 12 } } 
      ];

      // ตั้งค่าความกว้างคอลัมน์
      worksheet["!cols"] = [
        { wch: 10 }, // A ห้อง
        { wch: 5 },  // B ชั้น
        { wch: 18 }, // C ไฟเก่า
        { wch: 18 }, // D ไฟใหม่
        { wch: 15 }, // E ไฟใช้
        { wch: 20 }, // F เปลี่ยนไฟเก่า
        { wch: 20 }, // G เปลี่ยนไฟใหม่
        { wch: 18 }, // H น้ำเก่า
        { wch: 18 }, // I น้ำใหม่
        { wch: 15 }, // J น้ำใช้
        { wch: 20 }, // K เปลี่ยนน้ำเก่า
        { wch: 20 }, // L เปลี่ยนน้ำใหม่
        { wch: 30 }, // M หมายเหตุ
      ];

      // ✅ Freeze Panes (ล็อค 2 แถวบน) - ใช้ !views เพื่อความชัวร์ใน Excel
      worksheet["!views"] = [
        { state: "frozen", xSplit: 0, ySplit: 2 }
      ];

      // 4. สร้าง Workbook และดาวน์โหลด
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Meter Report");

      const fileName = `Meter_Report_${selectedDate}.xlsx`;
      XLSX.writeFile(workbook, fileName);

    } catch (err) {
      console.error("Download Error:", err);
      alert("เกิดข้อผิดพลาดในการดาวน์โหลด");
    }
  };

  const [rooms, setRooms] = useState([]);

  useEffect(() => {
    if (!selectedDate) return;

    // ใช้วันแรกของเดือนที่เลือก
    setRecordDate(`${selectedDate}-01`);
  }, [selectedDate]);

  useEffect(() => {
    if (cacheRef.current[selectedDate]) {
      setRooms(cacheRef.current[selectedDate]);
      return;
    }
    const fetchMeters = async () => {
      try {
        const [year, month] = selectedDate.split("-").map(Number);
        const data = await utilityMeterService.getUtilityMetersByMonth(year, month);

        const mappedRooms = data.map((m) => ({
          meterId: m.id ?? null,

          roomId: m.roomId,
          floor: String(m.floor),
          roomNumber: m.roomNumber,

          prevWater: m.prevWaterUnit,
          prevElec: m.prevElectricityUnit,

          currWater: m.waterUnit ?? "",
          currElec: m.electricityUnit ?? "",

          usedWater: m.waterUsed ?? 0,
          usedElec: m.electricityUsed ?? 0,

          changeWaterMeterStart: m.changeWaterMeterStart,
          changeWaterMeterEnd: m.changeWaterMeterEnd,
          changeElectricityMeterStart: m.changeElectricityMeterStart,
          changeElectricityMeterEnd: m.changeElectricityMeterEnd,
        }));

        cacheRef.current[selectedDate] = mappedRooms;
        setRooms(mappedRooms);
      } catch (err) {
        console.error("โหลดข้อมูลมิเตอร์ไม่สำเร็จ", err);
      }
    };
    fetchMeters();
  }, [selectedDate]);

  // --- Logic ---
  const floors = ["1", "2", "3", "4", "5"];
  const filteredRooms = useMemo(
    () => rooms.filter(r => r.floor === activeFloor),
    [rooms, activeFloor]
  );
  const currentMonthLabel = formatThaiMonth(selectedDate);
  const prevMonthLabel = formatThaiMonth(getPrevMonthStr(selectedDate));

  const handleInputChange = (roomId, field, value) => {
    setRooms(prev =>
      prev.map(r =>
        r.roomId === roomId
          ? { ...r, [field]: value }
          : r
      )
    );
  };

  const handleOpenModal = (room, type) => {
    setSelectedRoomForModal({ ...room, meterType: type });
    setIsModalOpen(true);
  };

// Helper แปลงตัวเลข (วางไว้นอก Component หรือใน Component ก็ได้)
  const toSafeInt = (val) => {
    if (val === "" || val == null) return null;
    const num = Number(val);
    if (isNaN(num)) return null;
    if (num < 0) return 0;
    return Math.round(num);
  };

  // ✅ ฟังก์ชัน Save ฉบับแก้ไข (เช็ค ID แม่นยำ + Log ละเอียด)
  const handleSaveChangeMeter = async (roomId, type, data) => {
    try {
      // 1. หาข้อมูลห้อง (แปลง ID เป็น String ทั้งคู่เพื่อความชัวร์)
      const room = rooms.find((r) => String(r.roomId) === String(roomId));
      
      if (!room) {
        return;
      }

      // 2. เตรียม Payload
      const payload = {
        roomId: room.roomId,
        recordDate: recordDate,
        electricityUnit: toSafeInt(room.currElec),
        waterUnit: toSafeInt(room.currWater),

        // ค่าใหม่จาก Modal
        changeElectricityMeterStart: type === "electricity" ? toSafeInt(data.newMeterStart) : toSafeInt(room.changeElectricityMeterStart),
        changeElectricityMeterEnd: type === "electricity" ? toSafeInt(data.oldMeterEnd) : toSafeInt(room.changeElectricityMeterEnd),
        
        changeWaterMeterStart: type === "water" ? toSafeInt(data.newMeterStart) : toSafeInt(room.changeWaterMeterStart),
        changeWaterMeterEnd: type === "water" ? toSafeInt(data.oldMeterEnd) : toSafeInt(room.changeWaterMeterEnd),
        
        note: ""
      };

      if (room.meterId != null) payload.id = room.meterId;

      // 3. ยิง API
      await utilityMeterService.bulkUpsertUtilityMeters([payload]);

      // 4. อัปเดต State หน้าจอ (จุดสำคัญ)
      setRooms((prevRooms) => {
        const updatedRooms = prevRooms.map((r) => {
          // ใช้ String() เทียบ ID เพื่อความชัวร์
          if (String(r.roomId) === String(roomId)) {
            const newData = type === "electricity"
              ? {
                  ...r,
                  changeElectricityMeterStart: data.newMeterStart, // เก็บค่าที่พิมพ์ลงไปเลย (ไม่ต้อง toSafeInt เพื่อให้แสดงผลตามที่พิมพ์)
                  changeElectricityMeterEnd: data.oldMeterEnd,
                }
              : {
                  ...r,
                  changeWaterMeterStart: data.newMeterStart,
                  changeWaterMeterEnd: data.oldMeterEnd,
                };
             return newData;
          }
          return r;
        });

        // อัปเดต Cache
        if (cacheRef.current) {
            cacheRef.current[selectedDate] = updatedRooms;
        }

        return updatedRooms;
      });

      setIsModalOpen(false);
      alert("บันทึกข้อมูลเรียบร้อย ✅");

    } catch (err) {
      alert("เกิดข้อผิดพลาดในการบันทึก");
    }
  };

  const handleMainSave = async () => {
    try {
      setIsSaving(true);
      const payload = rooms
      .filter(r => {
        return [
          r.currElec,
          r.currWater,
          r.changeElectricityMeterStart,
          r.changeElectricityMeterEnd,
          r.changeWaterMeterStart,
          r.changeWaterMeterEnd,
        ].some(v => v !== "" && v != null);
      })
      .map((r) => {
        const payload = {
          roomId: r.roomId,
          recordDate,
          electricityUnit: r.currElec === "" ? null : toNumberOrNull(r.currElec),
          waterUnit: r.currWater === "" ? null : toNumberOrNull(r.currWater),
          changeElectricityMeterStart: r.changeElectricityMeterStart,
          changeElectricityMeterEnd: r.changeElectricityMeterEnd,
          changeWaterMeterStart: r.changeWaterMeterStart,
          changeWaterMeterEnd: r.changeWaterMeterEnd,
          note: "",
        };

        if (r.meterId != null) {
          payload.id = r.meterId;
        }

        return payload;
      });

      await utilityMeterService.bulkUpsertUtilityMeters(payload);

      alert("บันทึกข้อมูลเรียบร้อย");
    } catch (err) {
      console.error(err);
      alert("บันทึกข้อมูลไม่สำเร็จ");
    } finally {
      setIsSaving(false);
    }
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
                onChange={(e) => { const newDate = e.target.value;
                  if (newDate.startsWith(selectedDate)) {setRecordDate(newDate);}}
                }
                className="bg-transparent border-none outline-none text-gray-700 font-bold w-full cursor-pointer"
              />
            </div>
            
            {/* 3. Download Button */}
            <div className="flex-none">
                <DownloadButton className="h-full px-6" onClick={() => handleDownload()} disabled={!rooms || rooms.length === 0}/>
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
            onOpenChangeMeterModal={(room, type) =>
              handleOpenModal(room, type)
            }
            prevMonthLabel={prevMonthLabel}
            currentMonthLabel={currentMonthLabel}
          />
        </div>

      </div>

      {/* --- Sticky Footer (เหลือแค่ปุ่มบันทึก) --- */}
      <div className="fixed bottom-0 left-0 right-0 bg-white py-2 z-30 overflow-visible">
       <div className="max-w-7xl mx-auto px-6 flex justify-end">
          
       <SaveButton
          disabled={isSaving}
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