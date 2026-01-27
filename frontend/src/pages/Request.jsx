import React, { useState } from "react";
import {
  Wrench,
  Sparkles,
  LogOut,
  FileText,
  CheckCircle2,
  XCircle,
  Clock,
  Plus,
  LayoutList,   
  CalendarDays,
} from "lucide-react";
import SearchBar from "../components/SearchBar";
import FilterButton from "../components/FilterButton";
import FilterModal from "../components/FilterModal";
import RequestModal from "../components/AddRequestModal";
import RequestItem from "../components/RequestItem";
import EditRequestModal from "../components/EditRequestModal";
import RequestCalendar from "../components/RequestCalendar";

const Request = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeSubject, setActiveSubject] = useState("all"); // 'all', 'fix', 'clean', 'leave', 'other'
  const [activeStatusFilters, setActiveStatusFilters] = useState([]); // 'pending', 'finish', 'cancel'
  const [showFilterModal, setShowFilterModal] = useState(false);

  const [showRequestModal, setShowRequestModal] = useState(false);
  //สำหรับ edit modal
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  //สำหรับเปลี่ยนมุมมองปฏิทิน
  const [viewMode, setViewMode] = useState("list");

  // ฟังก์ชันเมื่อกดที่รายการ
  const handleItemClick = (req) => {
    setSelectedRequest(req);
    setShowEditModal(true);
  };

  // ฟังก์ชันแก้ไขข้อมูล
  const handleEditSave = (updatedData) => {
    setRequests((prev) =>
      prev.map((item) => (item.id === updatedData.id ? updatedData : item)),
    );
  };

  // ฟังก์ชันลบข้อมูล
  const handleDelete = (id) => {
    setRequests((prev) => prev.filter((item) => item.id !== id));
    setShowEditModal(false);
  };

  // ฟังก์ชันสำหรับรับข้อมูลเมื่อกดบันทึก
  const handleSaveRequest = (newData) => {
    console.log("ข้อมูลที่ส่งมา:", newData);
    // ในอนาคตคุณสามารถนำ newData ไปจัดการต่อ (เช่น setRequests หรือส่งเข้า API)
    // setRequests([ { id: Date.now(), ...newData }, ...requests ]);
  };

  // จำลองข้อมูลตาม Schema ที่ระบุ โดยเก็บวันที่เป็น String 'YYYY-MM-DD'
  const [requests, setRequests] = useState([
    {
      id: 1,
      roomId: "201",
      requestDate: "2025-11-11",
      subject: "fix",
      body: "ประตูห้องน้ำชำรุด",
      status: "finish",
      appointmentDate: "2026-01-18",
      isTenantCost: false,
      cost: 0,
      note: "เปลี่ยนลูกบิดใหม่",
    },
    {
      id: 2,
      roomId: "411",
      requestDate: "2025-11-09",
      subject: "clean",
      body: "ทำความสะอาดเฉพาะบริเวณระเบียง",
      status: "cancel",
      appointmentDate: "2026-01-12",
      isTenantCost: true,
      cost: 100,
      note: "ผู้เช่ายกเลิกเนื่องจากติดธุระ",
    },
    {
      id: 3,
      roomId: "307",
      requestDate: "2025-11-08",
      subject: "leave",
      body: "ย้ายออกวันที่ 18 พ.ย. 2568",
      status: "pending",
      appointmentDate: "2026-01-18",
      isTenantCost: false,
      cost: 0,
      note: "",
    },
    {
      id: 4,
      roomId: "407",
      requestDate: "2025-11-02",
      subject: "other",
      body: "ขอเปลี่ยนรหัส Wi-Fi",
      status: "pending",
      appointmentDate: "2026-01-18",
      isTenantCost: false,
      cost: 0,
      note: "",
    },
  ]);

  // คลาสและไอคอนสำหรับแต่ละ Subject
  const subjectConfig = {
    fix: {
      label: "แจ้งซ่อม",
      icon: <Wrench size={40} />,
      color: "bg-[#E6D1F2] text-[#6B21A8]",

    },
    clean: {
      label: "ทำความสะอาด",
      icon: <Sparkles size={40} />,
      color: "bg-[#BAE6FD] text-[#0369A1]",
    },
    leave: {
      label: "ย้ายออก",
      icon: <LogOut size={40} />,
      color: "bg-[#E5E7EB] text-[#374151]",
    },
    other: {
      label: "อื่นๆ",
      icon: <FileText size={40} />,
      color: "bg-[#FED7AA] text-[#9A3412]",
    },
  };

  const statusConfig = {
    pending: {
      label: "รอดำเนินการ",
      color: "bg-[#FEF9C3] text-[#854D0E]",
      icon: <Clock size={20} />,
    },
    finish: {
      label: "สำเร็จ",
      color: "bg-[#DCFCE7] text-[#166534]",
      icon: <CheckCircle2 size={20} />,
    },
    cancel: {
      label: "ยกเลิก",
      color: "bg-[#FEE2E2] text-[#991B1B]",
      icon: <XCircle size={20} />,
    },
  };

  // 1. Logic การกรองข้อมูลสำหรับ "List View" (กรองครบทุกอย่าง: Search + Subject + Status)
  const filteredRequests = requests.filter((req) => {
    const matchesSearch =
      req.roomId.includes(searchTerm) ||
      req.body.toLowerCase().includes(searchTerm.toLowerCase());
    
    // List ต้องกรองตาม Tab ที่เลือก
    const matchesSubject =
      activeSubject === "all" || req.subject === activeSubject;
      
    const matchesStatus =
      activeStatusFilters.length === 0 ||
      activeStatusFilters.includes(req.status);

    return matchesSearch && matchesSubject && matchesStatus;
  });
  

  // 2. [เพิ่มใหม่] Logic การกรองข้อมูลสำหรับ "Calendar View" 
  // (ตัด matchesSubject ออก เพื่อให้โชว์ทุกหัวข้อเสมอ แต่ยังค้นหาเลขห้องได้)
  const calendarRequests = requests.filter((req) => {
    const matchesSearch =
      req.roomId.includes(searchTerm) ||
      req.body.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus =
      activeStatusFilters.length === 0 ||
      activeStatusFilters.includes(req.status);

    // *สำคัญ* : ไม่กรอง matchesSubject ที่นี่
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="bg-white min-h-screen ">
      <div className="max-w-7xl mx-auto bg-white rounded-3xl p-6 shadow-lg border border-gray-200 min-h-[85vh]">
        <h1 className="text-3xl font-bold text-center mb-8 text-gray-800">
          การแจ้ง
        </h1>

        {/* --- Toolbar --- */}
        <div className="flex flex-col items-center gap-6 mb-8">
          <div className="flex w-full max-w-2xl gap-4">
            <SearchBar
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <FilterButton
              onClick={() => setShowFilterModal(true)}
              activeCount={activeStatusFilters.length}
            />
            
            {/* ปฏิทิน ปุ่มสลับมุมมอง Calendar กับ List request item */}
            <div className="bg-gray-100 p-1 rounded-xl flex shrink-0">
              <button
                onClick={() => setViewMode("list")}
                className={`p-2 rounded-lg transition-all ${viewMode === "list" ? "bg-white shadow text-[#f3a638]" : "text-gray-400 hover:text-gray-600"}`}
              >
                <LayoutList size={24} />
              </button>
              <button
                onClick={() => setViewMode("calendar")}
                className={`p-2 rounded-lg transition-all ${viewMode === "calendar" ? "bg-white shadow text-[#f3a638]" : "text-gray-400 hover:text-gray-600"}`}
              >
                <CalendarDays size={24} />
              </button>
            </div>
          </div>

         

          {/* แถบ Filter(แถบยาว) ตามเรื่องที่ Request (Subject Tabs) */}
          <div className="max-w-3xl w-full flex flex-col gap-4 md-2">

            {/* [แก้ไข] แสดงแถบ Filter เฉพาะตอนอยู่ในหน้า List */}
            {viewMode === "list" && (
            <div className="flex bg-gray-100 p-1 rounded-2xl w-full overflow-x-auto no-scrollbar">
              <button
                onClick={() => setActiveSubject("all")}
                className={`flex-1 px-6 py-2 rounded-xl font-bold transition-all ${activeSubject === "all" ? "bg-[#f3a638] text-white shadow-md" : "text-gray-500 hover:text-gray-700"}`}
              >
                ทั้งหมด
              </button>
              {Object.entries(subjectConfig).map(([key, config]) => (
                <button
                  key={key}
                  onClick={() => setActiveSubject(key)}
                  className={`flex-1 px-6 py-2 rounded-xl font-bold whitespace-nowrap transition-all ${activeSubject === key ? "bg-[#f3a638] text-white shadow-md" : "text-gray-500 hover:text-gray-700"}`}
                >
                  {config.label}
                </button>
              ))}
            </div>
            )}


            {/* ปุ่มจะชิดขวาของกรอบ 3xl ซึ่งจะตรงกับตำแหน่งปุ่มสุดท้ายของแถบด้านบนพอดี */}
            <button
              onClick={() => setShowRequestModal(true)}
              className="ml-auto bg-[#f3a638] text-white px-8 py-2.5 rounded-xl font-bold flex items-center gap-2 hover:bg-[#e29528] transition-all shadow-md"
            >
              <Plus size={20} /> เพิ่มการแจ้ง
            </button>
          </div>
        </div>

        {/* --- Content Area --- */}
        {viewMode === "list" ? (
          /* มุมมอง List: ใช้ filteredRequests (ตาม Tab) */
          <div className="space-y-4">
            {filteredRequests.map((req) => (
              <RequestItem
                key={req.id}
                req={req}
                onClick={() => handleItemClick(req)}
              />
            ))}
            {filteredRequests.length === 0 && (
              <div className="text-center py-20 text-gray-400 font-bold">
                ไม่พบข้อมูลการแจ้ง
              </div>
            )}
          </div>
        ) : (
          /* มุมมอง Calendar: ใช้ calendarRequests (โชว์ทุกหัวข้อที่แจ้ง) */
          <RequestCalendar 
            requests={calendarRequests}  
            subjectConfig={subjectConfig}
            onItemClick={handleItemClick}
          />
        )}

          {/* --- เรียกใช้ RequestModal --- */}
          <RequestModal
            isOpen={showRequestModal}
            onClose={() => setShowRequestModal(false)}
            onSave={handleSaveRequest}
          />
          
          {/* Modal สำหรับแก้ไข */}
          <EditRequestModal
            isOpen={showEditModal}
            onClose={() => setShowEditModal(false)}
            initialData={selectedRequest}
            onSave={handleEditSave}
            onDelete={handleDelete}
          />

      
      {/* --- Filter Modal สำหรับ Status --- */}
      <FilterModal
        isOpen={showFilterModal}
        onClose={() => setShowFilterModal(false)}
        title="สถานะการดำเนินการ"
        onClear={() => setActiveStatusFilters([])}
        onConfirm={() => setShowFilterModal(false)}
        maxWidth="max-w-md" // ปรับความกว้างให้พอดีกับเนื้อหา 1 คอลัมน์
      >
        {/* ส่วนเนื้อหาภายใน (children) */}
        <div className="grid grid-cols-1 gap-3">
          {Object.entries(statusConfig).map(([key, config]) => (
            <button
              key={key}
              onClick={() => {
                setActiveStatusFilters((prev) =>
                  prev.includes(key)
                    ? prev.filter((s) => s !== key)
                    : [...prev, key],
                );
              }}
              className={`py-4 rounded-2xl text-md font-bold border-2 transition-all flex items-center justify-between px-6 
          ${
            activeStatusFilters.includes(key)
              ? "border-[#F5A623] bg-[#FFF7ED] text-[#F5A623]"
              : "border-gray-100 bg-gray-50 text-gray-500 hover:border-gray-200"
          }`}
            >
              {config.label}
            </button>
          ))}
        </div>
      </FilterModal>
    </div>
  </div>
  );
};

export default Request;
