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
} from "lucide-react";
import SearchBar from "../components/SearchBar";
import FilterButton from "../components/FilterButton";
import FilterModal from "../components/FilterModal";
import RequestModal from "../components/RequestModal";

const Request = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeSubject, setActiveSubject] = useState("all"); // 'all', 'fix', 'clean', 'leave', 'other'
  const [activeStatusFilters, setActiveStatusFilters] = useState([]); // 'pending', 'finish', 'cancel'
  const [showFilterModal, setShowFilterModal] = useState(false);

  const [showRequestModal, setShowRequestModal] = useState(false);

  // ฟังก์ชันสำหรับรับข้อมูลเมื่อกดบันทึก
  const handleSaveRequest = (newData) => {
    console.log("ข้อมูลที่ส่งมา:", newData);
    // ในอนาคตคุณสามารถนำ newData ไปจัดการต่อ (เช่น setRequests หรือส่งเข้า API)
    // setRequests([ { id: Date.now(), ...newData }, ...requests ]);
  };

  // จำลองข้อมูลตาม Schema ที่ระบุ
  const [requests, setRequests] = useState([
    {
      id: 1,
      roomId: "201",
      requestDate: "11 พฤศจิกายน 2568",
      subject: "fix",
      body: "ประตูห้องน้ำชำรุด",
      status: "finish",
      appointmentDate: "12 พ.ย. 2568",
      isTenantCost: false,
      cost: 0,
      note: "เปลี่ยนลูกบิดใหม่",
    },
    {
      id: 2,
      roomId: "411",
      requestDate: "9 พฤศจิกายน 2568",
      subject: "clean",
      body: "ทำความสะอาดเฉพาะบริเวณระเบียง",
      status: "cancel",
      appointmentDate: null,
      isTenantCost: true,
      cost: 100,
      note: "ผู้เช่ายกเลิกเนื่องจากติดธุระ",
    },
    {
      id: 3,
      roomId: "307",
      requestDate: "8 พฤศจิกายน 2568",
      subject: "leave",
      body: "ย้ายออกวันที่ 18 พ.ย. 2568",
      status: "pending",
      appointmentDate: "18 พ.ย. 2568",
      isTenantCost: false,
      cost: 0,
      note: "",
    },
    {
      id: 4,
      roomId: "407",
      requestDate: "2 พฤศจิกายน 2568",
      subject: "other",
      body: "ขอเปลี่ยนรหัส Wi-Fi",
      status: "pending",
      appointmentDate: "18 พ.ย. 2568",
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
      color: "bg-[#D8B4FE] text-[#6B21A8]",
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

  // Logic การกรองข้อมูล
  const filteredRequests = requests.filter((req) => {
    const matchesSearch =
      req.roomId.includes(searchTerm) ||
      req.body.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSubject =
      activeSubject === "all" || req.subject === activeSubject;
    const matchesStatus =
      activeStatusFilters.length === 0 ||
      activeStatusFilters.includes(req.status);
    return matchesSearch && matchesSubject && matchesStatus;
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
          </div>

          {/* แถบ Filter(แถบยาว) ตามเรื่องที่ Request (Subject Tabs) */}
          <div className="max-w-3xl w-full flex flex-col gap-4 md-2">
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

            {/* ปุ่มจะชิดขวาของกรอบ 3xl ซึ่งจะตรงกับตำแหน่งปุ่มสุดท้ายของแถบด้านบนพอดี */}
            <button
              onClick={() => setShowRequestModal(true)}
              className="ml-auto bg-[#f3a638] text-white px-8 py-2.5 rounded-xl font-bold flex items-center gap-2 hover:bg-[#e29528] transition-all shadow-md"
            >
              <Plus size={20} /> เพิ่มการแจ้ง
            </button>
          </div>
        </div>

        {/* --- เรียกใช้ RequestModal --- */}
        <RequestModal
          isOpen={showRequestModal}
          onClose={() => setShowRequestModal(false)}
          onSave={handleSaveRequest}
        />

        {/* --- รายการคำร้อง --- */}
        <div className="space-y-4">
          {filteredRequests.map((req) => (
            <div
              key={req.id}
              className="flex overflow-hidden max-w-3xl mx-auto items-center gap-6 bg-gray-50 border border-gray-300 p-5 rounded-[25px] hover:shadow-md transition-all cursor-pointer group"
            >
              {/* ไอคอนตามประเภทเรื่อง */}
              <div
                className={`p-4 rounded-2xl ${subjectConfig[req.subject].color} shrink-0`}
              >
                {subjectConfig[req.subject].icon}
              </div>

              {/* ข้อมูลเนื้อหา */}
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-1">
                  {/* เลขห้อง */}
                  <span className="text-2xl font-bold text-gray-800">
                    {req.roomId}
                  </span>
                </div>
                <p className="font-bold text-gray-700">
                  {subjectConfig[req.subject].label}
                </p>
                <p className="text-sm text-gray-500 line-clamp-1">{req.body}</p>
              </div>

              <div className="flex flex-col justify-between items-end self-stretch min-w-30 sm:min-w-35">
                <div className="flex flex-col items-end">
                  <span
                    className={`w-28 py-1.5 rounded-full text-[11px] font-bold flex items-center justify-center gap-1.5 shadow-sm transition-transform group-hover:scale-105 ${statusConfig[req.status].color}`}
                  >
                    {statusConfig[req.status].icon}
                    {statusConfig[req.status].label}
                  </span>
                </div>

                <div className="text-right">
                  <p className="text-[10px] sm:text-[11px] text-gray-400 font-semibold tracking-wide uppercase">
                    แจ้งเมื่อ : {req.requestDate}
                  </p>
                </div>
              </div>
            </div>
          ))}

          {filteredRequests.length === 0 && (
            <div className="text-center py-20 text-gray-400 font-bold">
              ไม่พบข้อมูลการแจ้ง
            </div>
          )}
        </div>
      </div>

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
  );
};

export default Request;
