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
  ChevronRight,
} from "lucide-react";
import SearchBar from "../components/SearchBar";
import FilterButton from "../components/FilterButton";
import FilterModal from "../components/FilterModal";

const Request = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeSubject, setActiveSubject] = useState("all"); // 'all', 'fix', 'clean', 'leave', 'other'
  const [activeStatusFilters, setActiveStatusFilters] = useState([]); // 'pending', 'finish', 'cancel'
  const [showFilterModal, setShowFilterModal] = useState(false);

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
  ]);

  // คลาสและไอคอนสำหรับแต่ละ Subject
  const subjectConfig = {
    fix: {
      label: "แจ้งซ่อม",
      icon: <Wrench size={24} />,
      color: "bg-[#D8B4FE] text-[#6B21A8]",
    },
    clean: {
      label: "ทำความสะอาด",
      icon: <Sparkles size={24} />,
      color: "bg-[#BAE6FD] text-[#0369A1]",
    },
    leave: {
      label: "ย้ายออก",
      icon: <LogOut size={24} />,
      color: "bg-[#E5E7EB] text-[#374151]",
    },
    other: {
      label: "อื่นๆ",
      icon: <FileText size={24} />,
      color: "bg-[#FED7AA] text-[#9A3412]",
    },
  };

  const statusConfig = {
    pending: {
      label: "รอดำเนินการ",
      color: "bg-[#FEF9C3] text-[#854D0E]",
      icon: <Clock size={16} />,
    },
    finish: {
      label: "สำเร็จ",
      color: "bg-[#DCFCE7] text-[#166534]",
      icon: <CheckCircle2 size={16} />,
    },
    cancel: {
      label: "ยกเลิก",
      color: "bg-[#FEE2E2] text-[#991B1B]",
      icon: <XCircle size={16} />,
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
    <div className="bg-white min-h-screen">
      <div className="max-w-7xl mx-auto bg-white rounded-3xl p-6 shadow-lg border border-gray-200">
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

          {/* แถบ Filter ตามเรื่องที่ Request (Subject Tabs) */}
          <div className="flex bg-gray-100 p-1 rounded-2xl w-full max-w-3xl overflow-x-auto no-scrollbar">
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

          <button className="bg-[#f3a638] text-white px-8 py-2.5 rounded-xl font-bold flex items-center gap-2 hover:bg-[#e29528] transition-all shadow-md ml-auto">
            <Plus size={20} /> เพิ่มการแจ้ง +
          </button>
        </div>

        {/* --- รายการคำร้อง --- */}
        <div className="space-y-4">
          {filteredRequests.map((req) => (
            <div
              key={req.id}
              className="flex items-center gap-6 bg-white border border-gray-100 p-5 rounded-[25px] hover:shadow-md transition-all cursor-pointer group"
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
                  <span className="text-2xl font-bold text-gray-800">
                    {req.roomId}
                  </span>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 ${statusConfig[req.status].color}`}
                  >
                    {statusConfig[req.status].icon}{" "}
                    {statusConfig[req.status].label}
                  </span>
                </div>
                <p className="font-bold text-gray-700">
                  {subjectConfig[req.subject].label}
                </p>
                <p className="text-sm text-gray-500 line-clamp-1">{req.body}</p>
              </div>

              {/* วันที่และปุ่มดูรายละเอียด */}
              <div className="text-right flex flex-col items-end gap-2">
                <p className="text-xs text-gray-400 font-medium">
                  แจ้งเมื่อ : {req.requestDate}
                </p>
                <div className="p-2 bg-gray-50 rounded-full text-gray-400 group-hover:bg-[#f3a638] group-hover:text-white transition-all">
                  <ChevronRight size={20} />
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
      {/* {showFilterModal && (

        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm p-4" onClick={() => setShowFilterModal(false)}>
          <div className="bg-white p-8 rounded-[40px] shadow-2xl w-full max-w-md animate-in zoom-in duration-200" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-800">สถานะการดำเนินการ</h2>
              <button onClick={() => setShowFilterModal(false)} className="p-2 hover:bg-gray-100 rounded-full transition-colors"><Plus className="rotate-45" size={24} /></button>
            </div>

            <div className="grid grid-cols-1 gap-3 mb-6">
              {Object.entries(statusConfig).map(([key, config]) => (
                <button
                  key={key}
                  onClick={() => {
                    setActiveStatusFilters(prev => 
                      prev.includes(key) ? prev.filter(s => s !== key) : [...prev, key]
                    );
                  }}
                  className={`py-4 rounded-2xl text-md font-bold border-2 transition-all flex items-center justify-between px-6 
                    ${activeStatusFilters.includes(key) ? "border-[#F5A623] bg-[#FFF7ED] text-[#F5A623]"
                        : "border-gray-100 bg-gray-50 text-gray-500 hover:border-gray-200"}`}
                >
                  {config.label}
                  {activeStatusFilters.includes(key)}
                </button>
              ))}
            </div>

            <div className="flex gap-4 border-t pt-4">
              <button onClick={() => setActiveStatusFilters([])} className="flex-1 py-3 font-bold text-gray-400 hover:bg-gray-50 rounded-xl">ล้างทั้งหมด</button>
              <button onClick={() => setShowFilterModal(false)} className="flex-2 bg-[#f3a638] text-white py-3 rounded-xl font-bold shadow-lg">ตกลง</button>
            </div>
          </div>
        </div>
      )} */}
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
