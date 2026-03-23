import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { 
  Home, Banknote, DoorOpen, Package, PlusCircle, 
  Loader2, Users, ArrowRight, CheckCircle2, TrendingUp, Calendar as CalendarIcon
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';

import { adminService } from '../api/AdminApi';
import { apartmentService } from '../api/ApartmentApi';
import { paymentService } from '../api/PaymentApi';

/* ── Helpers ────────────────────────────────────────────────────── */
const extractArray = (res) => {
  if (!res) return [];
  if (Array.isArray(res)) return res;
  if (res.$values) return res.$values;
  if (res.data && Array.isArray(res.data)) return res.data;
  if (res.data?.$values) return res.data.$values;
  return [];
};

const isToday = (dateString) => {
  if (!dateString) return false;
  const d = new Date(dateString);
  const today = new Date();
  return d.getDate() === today.getDate() && 
         d.getMonth() === today.getMonth() && 
         d.getFullYear() === today.getFullYear();
};

/* ── Components ย่อย ────────────────────────────────────────────── */
const StatCard = ({ label, value, subtext, icon: Icon, color, bgIcon }) => (
  <div className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100 flex items-start justify-between transition-transform hover:scale-[1.02]">
    <div>
      <p className="text-gray-500 text-sm font-bold mb-1">{label}</p>
      <p className="text-2xl lg:text-3xl font-black text-gray-800">{value}</p>
      {subtext && <p className="text-xs font-bold mt-2 text-gray-400">{subtext}</p>}
    </div>
    <div className={`p-3 rounded-2xl shrink-0 ${bgIcon}`}>
      <Icon size={26} className={color} strokeWidth={2.5} />
    </div>
  </div>
);

const QuickActionButton = ({ label, icon: Icon, onClick, colorClass }) => (
  <button 
    onClick={onClick}
    className="flex-1 min-w-[110px] p-4 rounded-2xl border border-gray-100 bg-white shadow-sm hover:shadow-md transition-all flex flex-col items-center justify-center gap-2 group"
  >
    <div className={`p-3 rounded-xl transition-colors ${colorClass}`}>
      <Icon size={22} strokeWidth={2.5} />
    </div>
    <span className="text-[13px] font-bold text-gray-600 group-hover:text-gray-900">{label}</span>
  </button>
);

const TaskItem = ({ title, desc, time, type }) => {
  const typeConfig = {
    moveIn:  { color: "text-blue-600", bg: "bg-blue-100", icon: ArrowRight },
    moveOut: { color: "text-red-600", bg: "bg-red-100", icon: DoorOpen },
    parcel:  { color: "text-purple-600", bg: "bg-purple-100", icon: Package },
  };
  const c = typeConfig[type] || typeConfig.parcel;
  const Icon = c.icon;

  return (
    <div className="flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 rounded-2xl transition-colors mb-2">
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-xl ${c.bg}`}>
          <Icon size={18} className={c.color} />
        </div>
        <div>
          <p className="text-sm font-bold text-gray-800">{title}</p>
          <p className="text-[11px] font-bold text-gray-500">{desc}</p>
        </div>
      </div>
      {time && <span className="text-xs font-black text-gray-400">{time}</span>}
    </div>
  );
};

/* ── Main Dashboard ─────────────────────────────────────────────── */
const Dashboard = () => {
  const navigate = useNavigate();

  const [isLoading, setIsLoading] = useState(true);
  const [apartmentName, setApartmentName] = useState("กำลังโหลด...");
  const [adminName, setAdminName] = useState("Admin");
  const [chartMode, setChartMode] = useState("month"); // "month" หรือ "year"
  
  const [data, setData] = useState({
    rooms: [],
    contracts: [],
    payments: [],
    requests: [],
    parcels: []
  });

  const today = new Date();
  const currentDateLabel = today.toLocaleDateString('th-TH', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  // 1. Fetch Data
  useEffect(() => {
    const fetchDashboardData = async () => {
      setIsLoading(true);
      try {
        // สมมติ Admin ID = 1 และ Apartment ID = 1 (คุณสามารถเปลี่ยนไปดึงจาก Token/Context ได้)
        const [adminRes, aptRes, roomsRes, contractsRes, paymentsRes, requestsRes, parcelsRes] = await Promise.all([
          adminService.getAdmin(1).catch(() => ({ data: { firstName: "แอดมิน", lastName: "" } })),
          apartmentService.getApartment(1).catch(() => ({ data: { name: "หอพัก" } })),
          axios.get("http://localhost:5252/Rooms").catch(() => ({ data: [] })),
          axios.get("http://localhost:5252/Contracts").catch(() => ({ data: [] })),
          paymentService.getPayments().catch(() => []), // paymentService.getPayments คืนค่าเป็น data ให้อยู่แล้ว
          axios.get("http://localhost:5252/Requests").catch(() => ({ data: [] })),
          axios.get("http://localhost:5252/Parcels").catch(() => ({ data: [] }))
        ]);

        if (adminRes?.firstName) setAdminName(`${adminRes.firstName} ${adminRes.lastName || ''}`.trim());
        else if (adminRes?.data?.firstName) setAdminName(`${adminRes.data.firstName} ${adminRes.data.lastName || ''}`.trim());

        if (aptRes?.name) setApartmentName(aptRes.name);
        else if (aptRes?.data?.name) setApartmentName(aptRes.data.name);

        setData({
          rooms: extractArray(roomsRes),
          contracts: extractArray(contractsRes),
          payments: extractArray(paymentsRes),
          requests: extractArray(requestsRes),
          parcels: extractArray(parcelsRes)
        });
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  // 2. Data Processing
  const processedData = useMemo(() => {
    const { rooms, contracts, payments, requests, parcels } = data;

    // --- ห้องพัก ---
    const totalRooms = rooms.length;
    const availableRooms = rooms.filter(r => r.status?.toLowerCase() === 'available').length;
    const occupiedRooms = rooms.filter(r => r.status?.toLowerCase() === 'occupied').length;

    // --- งานวันนี้ (Today's Tasks) ---
    const todayTasks = [];
    
    // 1. คนย้ายเข้าวันนี้
    contracts.filter(c => isToday(c.startDate) && c.status === "Active").forEach(c => {
      const roomNum = rooms.find(r => r.id === c.roomId)?.number || c.roomId;
      todayTasks.push({ id: `in_${c.id}`, title: `ห้อง ${roomNum} ย้ายเข้า`, desc: "สัญญาเริ่มต้นวันนี้", type: "moveIn" });
    });

    // 2. คนย้ายออกวันนี้
    contracts.filter(c => isToday(c.endDate)).forEach(c => {
      const roomNum = rooms.find(r => r.id === c.roomId)?.number || c.roomId;
      todayTasks.push({ id: `out_${c.id}`, title: `ห้อง ${roomNum} ย้ายออก`, desc: "สัญญาสิ้นสุดวันนี้", type: "moveOut" });
    });

    // 3. พัสดุมาถึงวันนี้
    // สมมติว่า parcels ไม่มีตารางมารับของ ให้ใช้ของที่บันทึกวันนี้
    parcels.filter(p => isToday(p.createdAt || p.receivedDate || p.id)).forEach(p => {
      const roomNum = rooms.find(r => r.id === p.roomId)?.number || p.roomId;
      todayTasks.push({ id: `p_${p.id}`, title: `พัสดุ ห้อง ${roomNum}`, desc: p.shippingCompany || "มีพัสดุเข้า", type: "parcel" });
    });

    // --- ข้อมูลกราฟ รายรับ-รายจ่าย ---
    // รายรับ = Payments (Paid)
    // รายจ่าย = Requests (isTenantCost == false) (หอพักจ่ายเอง)
    
    const curYear = today.getFullYear();
    const curMonth = today.getMonth();

    let chartData = [];
    let incomeSummary = 0;

    if (chartMode === "month") {
      // โหมดรายเดือน: Group ตาม "วัน" ในเดือนปัจจุบัน
      const daysInMonth = new Date(curYear, curMonth + 1, 0).getDate();
      chartData = Array.from({ length: daysInMonth }, (_, i) => ({
        name: `${i + 1}`, income: 0, expense: 0
      }));

      payments.forEach(p => {
        if (p.status?.toLowerCase() === 'paid') {
          const d = new Date(p.recordDate || p.createdAt);
          if (d.getFullYear() === curYear && d.getMonth() === curMonth) {
            chartData[d.getDate() - 1].income += Number(p.paidAmount || p.totalAmount || 0);
            incomeSummary += Number(p.paidAmount || p.totalAmount || 0);
          }
        }
      });

      requests.forEach(r => {
        if (!r.isTenantCost && r.cost > 0) {
          const d = new Date(r.createdAt || r.updatedAt);
          if (d.getFullYear() === curYear && d.getMonth() === curMonth) {
            chartData[d.getDate() - 1].expense += Number(r.cost);
          }
        }
      });
    } else {
      // โหมดรายปี: Group ตาม "เดือน" ในปีปัจจุบัน
      const monthNames = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];
      chartData = monthNames.map(m => ({ name: m, income: 0, expense: 0 }));

      payments.forEach(p => {
        if (p.status?.toLowerCase() === 'paid') {
          const d = new Date(p.recordDate || p.createdAt);
          if (d.getFullYear() === curYear) {
            chartData[d.getMonth()].income += Number(p.paidAmount || p.totalAmount || 0);
            if (d.getMonth() === curMonth) incomeSummary += Number(p.paidAmount || p.totalAmount || 0);
          }
        }
      });

      requests.forEach(r => {
        if (!r.isTenantCost && r.cost > 0) {
          const d = new Date(r.createdAt || r.updatedAt);
          if (d.getFullYear() === curYear) {
            chartData[d.getMonth()].expense += Number(r.cost);
          }
        }
      });
    }

    return { totalRooms, availableRooms, occupiedRooms, todayTasks, chartData, incomeSummary };
  }, [data, chartMode, today]);

  if (isLoading) {
    return (
      <div className="w-full h-[80vh] flex flex-col items-center justify-center gap-4">
        <Loader2 className="w-10 h-10 text-[#f3a638] animate-spin" />
        <p className="text-gray-500 font-bold animate-pulse">กำลังโหลดข้อมูลหอพัก...</p>
      </div>
    );
  }

  return (
    <div className="w-full pb-20 space-y-6">
      
      {/* 1. Header */}
      <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex items-center justify-between">
        <div>
          <div className="inline-block bg-[#f3a638] text-white px-3 py-1 rounded-lg font-black text-xs mb-2 shadow-sm tracking-wider">
            {apartmentName}
          </div>
          <h1 className="text-2xl font-black text-gray-800">สวัสดี, {adminName} 👋</h1>
          <p className="text-sm font-bold text-gray-500 mt-1 flex items-center gap-1">
            <CalendarIcon size={14} /> {currentDateLabel}
          </p>
        </div>
      </div>

      {/* 2. สถิติหลัก (Stats) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard 
          label="รายรับเดือนนี้ (บาท)" 
          value={processedData.incomeSummary.toLocaleString()} 
          subtext="เฉพาะบิลที่รับชำระแล้ว"
          icon={TrendingUp} color="text-emerald-600" bgIcon="bg-emerald-50" 
        />
        <StatCard 
          label="มีผู้เช่า (Occupied)" 
          value={processedData.occupiedRooms} 
          subtext={`อัตราเข้าพัก ${processedData.totalRooms ? Math.round((processedData.occupiedRooms / processedData.totalRooms) * 100) : 0}%`}
          icon={Home} color="text-blue-600" bgIcon="bg-blue-50" 
        />
        <StatCard 
          label="ห้องว่าง (Available)" 
          value={processedData.availableRooms} 
          subtext="พร้อมทำสัญญาเช่า"
          icon={DoorOpen} color="text-orange-500" bgIcon="bg-orange-50" 
        />
      </div>

      {/* 3. เมนูด่วน (Quick Actions) */}
      <div>
        <div className="flex flex-wrap gap-3">
          {/* ส่ง State ไปที่ /room-map เพื่อให้ filter ห้องว่าง อัตโนมัติ */}
          <QuickActionButton 
            label="ทำสัญญาใหม่" icon={PlusCircle} 
            onClick={() => navigate('/room-map', { state: { defaultFilter: 'available' } })} 
            colorClass="bg-emerald-50 text-emerald-600 group-hover:bg-emerald-100" 
          />
          <QuickActionButton label="จัดการบิล" icon={Banknote} onClick={() => navigate('/billings')} colorClass="bg-blue-50 text-blue-600 group-hover:bg-blue-100" />
          <QuickActionButton label="รับพัสดุ" icon={Package} onClick={() => navigate('/parcels')} colorClass="bg-purple-50 text-purple-600 group-hover:bg-purple-100" />
          <QuickActionButton label="ผังห้องทั้งหมด" icon={Home} onClick={() => navigate('/room-map')} colorClass="bg-orange-50 text-orange-600 group-hover:bg-orange-100" />
          <QuickActionButton label="ลูกบ้านทั้งหมด" icon={Users} onClick={() => navigate('/tenants')} colorClass="bg-gray-50 text-gray-600 group-hover:bg-gray-200" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* 4. กราฟ รายรับ-รายจ่าย (กินพื้นที่ 2 ส่วน) */}
        <div className="lg:col-span-2 bg-white rounded-3xl p-6 shadow-sm border border-gray-100 flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-black text-gray-800 text-lg">สรุปรายรับ - รายจ่าย</h3>
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button 
                onClick={() => setChartMode("month")}
                className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${chartMode === "month" ? "bg-white text-gray-800 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
              >
                เดือนนี้
              </button>
              <button 
                onClick={() => setChartMode("year")}
                className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${chartMode === "year" ? "bg-white text-gray-800 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
              >
                ปีนี้
              </button>
            </div>
          </div>
          
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={processedData.chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#9ca3af', fontWeight: 'bold' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#9ca3af', fontWeight: 'bold' }} dx={-10} />
                <Tooltip 
                  cursor={{ fill: '#f3f4f6' }}
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.08)', fontWeight: 'bold' }}
                  formatter={(value) => [`${value.toLocaleString()} ฿`]}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', fontWeight: 'bold', paddingTop: '20px' }} />
                <Bar dataKey="income" name="รายรับ" fill="#34d399" radius={[4, 4, 0, 0]} maxBarSize={40} />
                <Bar dataKey="expense" name="รายจ่าย" fill="#f87171" radius={[4, 4, 0, 0]} maxBarSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 5. To-do วันนี้ & Block ห้องพัก (ด้านขวา) */}
        <div className="space-y-6 flex flex-col">
          
          {/* ปฏิทินงานวันนี้ */}
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 flex-1">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-black text-gray-800 text-lg">รายการวันนี้</h3>
              <span className="text-xs font-black bg-blue-100 text-blue-600 px-2 py-1 rounded-lg">
                {processedData.todayTasks.length} รายการ
              </span>
            </div>
            <div className="space-y-1">
              {processedData.todayTasks.length > 0 ? (
                processedData.todayTasks.map(task => (
                  <TaskItem key={task.id} title={task.title} desc={task.desc} type={task.type} />
                ))
              ) : (
                <div className="h-32 flex flex-col items-center justify-center text-gray-400 font-bold text-sm">
                  <CheckCircle2 size={32} className="text-emerald-200 mb-2" />
                  ไม่มีงานที่ต้องทำวันนี้
                </div>
              )}
            </div>
          </div>

          {/* Block ห้องพักทั้งหมด */}
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-black text-gray-800 text-lg">ผังห้องทั้งหมด</h3>
              <span className="text-xs font-bold text-gray-400">{processedData.totalRooms} ห้อง</span>
            </div>
            
            {/* Grid ของสี่เหลี่ยมห้อง */}
            <div className="grid grid-cols-5 sm:grid-cols-8 lg:grid-cols-5 xl:grid-cols-6 gap-2 mb-4">
              {data.rooms.sort((a,b) => String(a.number).localeCompare(String(b.number), undefined, {numeric: true})).map(room => {
                const s = room.status?.toLowerCase();
                let colorClass = "bg-gray-100"; // default: ว่าง (Available)
                if (s === "occupied") colorClass = "bg-blue-400";
                else if (s === "reserved") colorClass = "bg-orange-400";
                else if (s === "maintenance" || s === "close") colorClass = "bg-red-400";

                return (
                  <div 
                    key={room.id} 
                    className={`aspect-square rounded-md ${colorClass} transition-transform hover:scale-110 cursor-help`}
                    title={`ห้อง ${room.number} (${s})`}
                  />
                );
              })}
            </div>

            {/* Legend อธิบายสีห้อง */}
            <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2">
              <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-sm bg-blue-400"></div><span className="text-[10px] font-bold text-gray-500">มีคนเช่า</span></div>
              <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-sm bg-gray-100 border border-gray-200"></div><span className="text-[10px] font-bold text-gray-500">ว่าง</span></div>
              <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-sm bg-orange-400"></div><span className="text-[10px] font-bold text-gray-500">จอง</span></div>
              <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-sm bg-red-400"></div><span className="text-[10px] font-bold text-gray-500">ปิดปรับปรุง</span></div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Dashboard;