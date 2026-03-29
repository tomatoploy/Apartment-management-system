import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, AreaChart, Area
} from 'recharts';
import {
  Home, DoorOpen, Package, CheckCircle2, Calendar,
  Clock, RefreshCw, Wrench, ChevronRight, Activity,
  UserCheck, AlertCircle, BarChart2, ArrowRight,
  Sparkles, Banknote, FileText, LogOut, Wallet
} from 'lucide-react';

/* ─────────────────────────────────────────────
   CONFIG
───────────────────────────────────────────── */
const API_BASE = 'https://apartment-management-system-zllm.onrender.com';
const REFRESH_INTERVAL = 60_000;

/* ─────────────────────────────────────────────
   HELPERS
───────────────────────────────────────────── */
const arr = (res) => {
  if (!res) return [];
  if (Array.isArray(res)) return res;
  if (res.$values) return res.$values;
  if (res.data) return arr(res.data);
  return [];
};

const get = (endpoint) => axios.get(`${API_BASE}${endpoint}`).then(r => arr(r.data)).catch(() => []);

const isToday = (ds) => {
  if (!ds) return false;
  const d = new Date(ds), t = new Date();
  return d.getDate() === t.getDate() && d.getMonth() === t.getMonth() && d.getFullYear() === t.getFullYear();
};

const daysUntil = (ds) => {
  if (!ds) return Infinity;
  return Math.ceil((new Date(ds) - new Date()) / 86_400_000);
};

const thaiDate = (ds) => {
  if (!ds) return '-';
  return new Date(ds).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: '2-digit' });
};

const fmt = (n) => Number(n || 0).toLocaleString('th-TH', { minimumFractionDigits: 0, maximumFractionDigits: 0 });

const MONTH_TH = ['ม.ค.','ก.พ.','มี.ค.','เม.ย.','พ.ค.','มิ.ย.','ก.ค.','ส.ค.','ก.ย.','ต.ค.','พ.ย.','ธ.ค.'];

const getFloorFromRoomNumber = (roomNumber) => {
  const numStr = String(roomNumber || '').replace(/\D/g, '');
  if (numStr.length >= 3) return numStr.substring(0, numStr.length - 2);
  return '1';
};

/* ─────────────────────────────────────────────
   SMALL COMPONENTS
───────────────────────────────────────────── */
const PulseDot = ({ color = 'bg-emerald-400' }) => (
  <span className="relative flex h-2.5 w-2.5">
    <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${color} opacity-60`} />
    <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${color}`} />
  </span>
);

const MiniStat = ({ label, value, icon: Icon, colorClass, bgClass }) => (
  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-3.5 sm:p-4 flex items-center gap-3">
    <div className={`p-2.5 rounded-xl shrink-0 ${bgClass}`}>
      <Icon size={18} className={colorClass} />
    </div>
    <div className="min-w-0 flex-1">
      <p className="text-[10px] sm:text-[11px] font-bold text-gray-400 uppercase tracking-wider truncate mb-0.5">{label}</p>
      <p className="text-lg sm:text-xl font-black text-gray-900 leading-none truncate">{value}</p>
    </div>
  </div>
);

const AlertRow = ({ icon: Icon, color, bg, title, sub, badge, onClick }) => (
  <button onClick={onClick} className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors text-left group">
    <div className={`p-2 rounded-lg shrink-0 ${bg}`}><Icon size={15} className={color} /></div>
    <div className="flex-1 min-w-0">
      <p className="text-sm font-bold text-gray-800 truncate">{title}</p>
      <p className="text-[11px] font-medium text-gray-400 truncate">{sub}</p>
    </div>
    {badge && <span className={`shrink-0 text-[10px] font-black px-2 py-0.5 rounded-full ${badge.style}`}>{badge.label}</span>}
    <ChevronRight size={14} className="text-gray-300 group-hover:text-gray-500 shrink-0" />
  </button>
);

const SectionHeader = ({ title, action, actionLabel }) => (
  <div className="flex items-center justify-between mb-3 sm:mb-4">
    <h2 className="text-sm sm:text-base font-black text-gray-800">{title}</h2>
    {action && (
      <button onClick={action} className="text-xs font-bold text-[#f3a638] hover:text-orange-600 flex items-center gap-1">
        {actionLabel} <ChevronRight size={12} />
      </button>
    )}
  </div>
);

const ChartTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-gray-100 shadow-lg rounded-xl p-3 text-xs">
      <p className="font-black text-gray-700 mb-2">{label}</p>
      {payload.map((p, i) => (
        <p key={`tt-${i}`} style={{ color: p.color }} className="font-bold">
          {p.name}: ฿{fmt(p.value)}
        </p>
      ))}
    </div>
  );
};

/* ─────────────────────────────────────────────
   MAIN DASHBOARD
───────────────────────────────────────────── */
const Dashboard = () => {
  const navigate = useNavigate();
  const refreshTimer = useRef(null);

  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState(new Date());
  const [chartMode, setChartMode] = useState('month'); 
  const [apartmentName, setApartmentName] = useState('');
  const [adminName, setAdminName] = useState('');

  const [raw, setRaw] = useState({
    rooms: [], contracts: [], payments: [], requests: [],
    parcels: [], tenants: [], documents: []
  });

  const fetchAll = useCallback(async () => {
    try {
      const adminId = localStorage.getItem('adminId') || 1;
      
      const [
        adminRes, aptRes, rooms, contracts, payments,
        requests, parcels, tenants, documents
      ] = await Promise.allSettled([
        axios.get(`${API_BASE}/Admins/${adminId}`).catch(() => null),
        axios.get(`${API_BASE}/Apartments`).then(r => arr(r.data)),
        get('/Rooms'), get('/Contracts'), get('/Payments'),
        get('/Requests'), get('/Parcels'), get('/Tenants'),
        get('/Documents'),
      ]);

      const resolve = (r) => r.status === 'fulfilled' ? r.value : (Array.isArray(r.value) ? [] : null);
      
      const adminData = adminRes.status === 'fulfilled' && adminRes.value ? adminRes.value.data : null;
      
      if (adminData && adminData.firstName) { 
        setAdminName(`${adminData.firstName} ${adminData.lastName || ''}`.trim());
      } else if (adminData && adminData.FirstName) { 
        setAdminName(`${adminData.FirstName} ${adminData.LastName || ''}`.trim());
      } else {
        let localName = 'ผู้ดูแลระบบ';
        try {
          const userStr = localStorage.getItem('user');
          if (userStr) {
            const userObj = JSON.parse(userStr);
            if (userObj.firstName) localName = `${userObj.firstName} ${userObj.lastName || ''}`.trim();
            else if (userObj.FirstName) localName = `${userObj.FirstName} ${userObj.LastName || ''}`.trim();
            else if (userObj.username) localName = userObj.username;
          }
        } catch(e) {}
        setAdminName(localName);
      }

      const apts = resolve(aptRes) || [];
      setApartmentName(apts[0]?.name || 'ระบบจัดการหอพัก');

      setRaw({
        rooms: resolve(rooms) || [],
        contracts: resolve(contracts) || [],
        payments: resolve(payments) || [],
        requests: resolve(requests) || [],
        parcels: resolve(parcels) || [],
        tenants: resolve(tenants) || [],
        documents: resolve(documents) || [],
      });

      setLastRefresh(new Date());
    } catch (e) {
      console.error('Dashboard fetch error:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
    refreshTimer.current = setInterval(fetchAll, REFRESH_INTERVAL);
    return () => clearInterval(refreshTimer.current);
  }, [fetchAll]);

  const computed = useMemo(() => {
    const { rooms, contracts, payments, requests, parcels } = raw;
    const now = new Date();
    const curYear = now.getFullYear();
    const curMonth = now.getMonth();

    const contractByRoom = {};
    contracts.forEach(c => {
      const status = (c.status || c.Status || "").toLowerCase();
      if (status === "active" || status === "reserved") {
        const rId = Number(c.roomId || c.RoomId);
        if (rId) contractByRoom[rId] = c;
      }
    });

    const overdueCountByContract = {};
    const currentMonthStatusByContract = {};
    payments.forEach(p => {
      const cid = Number(p.contractId || p.ContractId);
      const status = (p.status || p.Status || "").toLowerCase();
      const d = new Date(p.recordDate || p.createdAt || p.RecordDate);
      if (!isNaN(d)) {
        if (status === "unpaid") overdueCountByContract[cid] = (overdueCountByContract[cid] || 0) + 1;
        if (d.getFullYear() === curYear && d.getMonth() === curMonth) {
          currentMonthStatusByContract[cid] = status;
        }
      }
    });

    const parcelMap = {};
    parcels.forEach(p => {
      if (!p.pickupDate) parcelMap[p.roomId || p.RoomId] = true;
    });

    const reqCounts = { fix: 0, clean: 0, leave: 0, other: 0 };
    const requestMap = {};
    requests.forEach(r => {
      if (r.status !== "finish" && r.status !== "cancel") {
        const rId = r.roomId || r.RoomId;
        if (rId) {
          if (!requestMap[rId]) requestMap[rId] = [];
          requestMap[rId].push(r);
        }
        const sub = (r.subject || "").toLowerCase();
        if (reqCounts[sub] !== undefined) reqCounts[sub]++;
        else reqCounts.other++;
      }
    });

    const waitingParcelsCount = parcels.filter(p => !p.pickupDate).length;

    const expiringContractsCount = contracts.filter(c => {
      const d = daysUntil(c.endDate || c.EndDate);
      const status = (c.status || c.Status || "").toLowerCase();
      return status === 'active' && d >= 0 && d <= 30;
    }).length;

    const normalizedRooms = rooms.map(room => {
      const roomId = Number(room.roomId || room.id || room.Id);
      const contract = contractByRoom[roomId];
      const contractId = Number(contract?.id || contract?.Id || 0);
      const icons = [];
      const overdueCount = overdueCountByContract[contractId] || 0;
      const currentMonthPay = currentMonthStatusByContract[contractId];
      
      let finalStatus = (room.roomStatus || room.status || "available").toLowerCase();
      if (currentMonthPay === "paid") finalStatus = "occupied";
      else if (currentMonthPay === "unpaid" || overdueCount > 0) finalStatus = "overdue";
      else if (finalStatus === "close") finalStatus = "maintenance";

      if (finalStatus === "reserved") icons.push("moveIn");
      if (parcelMap[roomId]) icons.push("package");
      
      const roomReqs = requestMap[roomId] || [];
      roomReqs.forEach((req) => {
        const sub = (req.subject || "").toLowerCase();
        if (["fix", "clean", "leave", "other"].includes(sub) && !icons.includes(sub)) icons.push(sub);
      });

      return {
        ...room, id: roomId, floor: String(room.roomFloor || room.floor || getFloorFromRoomNumber(room.number || room.roomNumber)),
        status: finalStatus, icons, waitingParcelsCount, expiringContractsCount
      };
    });

    const totalRooms = normalizedRooms.length;
    const occupied = normalizedRooms.filter(r => r.status === 'occupied').length;
    const reserved = normalizedRooms.filter(r => r.status === 'reserved').length;
    const available = normalizedRooms.filter(r => r.status === 'available').length;
    const maintenance = normalizedRooms.filter(r => ['maintenance', 'close'].includes(r.status)).length;
    // 🌟 คำนวณอัตราเข้าพัก โดยดึงจาก Room table โดยตรง 🌟
    const rawOccupied = rooms.filter(r => (r.status || r.roomStatus || '').toLowerCase() === 'occupied').length;
    const rawReserved = rooms.filter(r => (r.status || r.roomStatus || '').toLowerCase() === 'reserved').length;
    const occupancyRate = rooms.length ? Math.round(((rawOccupied + rawReserved) / rooms.length) * 100) : 0;

    let paidThisMonth = 0;
    let unpaidThisMonth = 0;

    payments.forEach(p => {
      const d = new Date(p.recordDate || p.createdAt || p.RecordDate);
      if (d.getFullYear() === curYear && d.getMonth() === curMonth) {
        const status = (p.status || p.Status || "").toLowerCase();
        const amt = Number(p.paidAmount || p.totalAmount || p.PaidAmount || p.TotalAmount || 0);
        if (status === 'paid') paidThisMonth += amt;
        else if (status === 'unpaid') unpaidThisMonth += amt;
      }
    });

    const allUnpaidPayments = payments.filter(p => (p.status || p.Status || "").toLowerCase() === 'unpaid').sort((a, b) => new Date(a.recordDate || a.RecordDate) - new Date(b.recordDate || b.RecordDate));

    const todayTasks = [];
    contracts.forEach(c => {
      if (isToday(c.startDate)) {
        const room = normalizedRooms.find(r => r.id === c.roomId);
        todayTasks.push({ id: `in-${c.id}`, type: 'moveIn', title: `ห้อง ${room?.number || c.roomId} ย้ายเข้า`, sub: 'เริ่มสัญญาวันนี้' });
      }
      if (isToday(c.endDate)) {
        const room = normalizedRooms.find(r => r.id === c.roomId);
        todayTasks.push({ id: `out-${c.id}`, type: 'moveOut', title: `ห้อง ${room?.number || c.roomId} ย้ายออก`, sub: 'สิ้นสุดสัญญาวันนี้' });
      }
    });

    const daysInMonth = new Date(curYear, curMonth + 1, 0).getDate();
    const monthChart = Array.from({ length: daysInMonth }, (_, i) => ({ name: `${i + 1}`, income: 0, expense: 0 }));
    const yearChart = MONTH_TH.map(m => ({ name: m, income: 0, expense: 0 }));
    const compareChart = Array.from({ length: 6 }, (_, i) => {
      const d = new Date(curYear, curMonth - 5 + i, 1);
      return { name: `${MONTH_TH[d.getMonth()]} ${String(d.getFullYear()).slice(2)}`, income: 0, expense: 0 };
    });

    payments.forEach(p => {
      if ((p.status || p.Status || "").toLowerCase() === 'paid') {
        const d = new Date(p.recordDate || p.createdAt || p.RecordDate);
        const amt = Number(p.paidAmount || p.totalAmount || p.PaidAmount || p.TotalAmount || 0);
        if (d.getFullYear() === curYear && d.getMonth() === curMonth) monthChart[d.getDate() - 1].income += amt;
        if (d.getFullYear() === curYear) yearChart[d.getMonth()].income += amt;
        for (let i = 0; i < 6; i++) {
          const ref = new Date(curYear, curMonth - 5 + i, 1);
          if (d.getFullYear() === ref.getFullYear() && d.getMonth() === ref.getMonth()) compareChart[i].income += amt;
        }
      }
    });
    
    requests.forEach(r => {
      const isTenant = r.isTenantCost === 1 || r.isTenantCost === "1" || r.isTenantCost === true;
      if (!isTenant && Number(r.cost) > 0) {
        const d = new Date(r.createdAt || r.updatedAt || r.requestDate);
        if (d.getFullYear() === curYear && d.getMonth() === curMonth) monthChart[d.getDate() - 1].expense += Number(r.cost);
        if (d.getFullYear() === curYear) yearChart[d.getMonth()].expense += Number(r.cost);
        for (let i = 0; i < 6; i++) {
          const ref = new Date(curYear, curMonth - 5 + i, 1);
          if (d.getFullYear() === ref.getFullYear() && d.getMonth() === ref.getMonth()) compareChart[i].expense += Number(r.cost);
        }
      }
    });

    const chartData = chartMode === 'month' ? monthChart : chartMode === 'year' ? yearChart : compareChart;
    const roomsByFloor = normalizedRooms.reduce((acc, room) => {
      if (!acc[room.floor]) acc[room.floor] = [];
      acc[room.floor].push(room);
      return acc;
    }, {});

    const expectedTotalThisMonth = paidThisMonth + unpaidThisMonth;
    const paymentProgress = expectedTotalThisMonth > 0 ? Math.round((paidThisMonth / expectedTotalThisMonth) * 100) : 0;

    return {
      totalRooms, occupied, reserved, available, maintenance, occupancyRate,
      paidThisMonth, unpaidThisMonth, expectedTotalThisMonth, paymentProgress,
      allUnpaidPayments, todayTasks, chartData,
      reqCounts, roomsByFloor, waitingParcelsCount, expiringContractsCount
    };
  }, [raw, chartMode]);

  if (loading) {
    return (
      <div className="w-full h-[80vh] flex flex-col items-center justify-center gap-3">
        <div className="w-12 h-12 rounded-full border-4 border-orange-100 border-t-[#f3a638] animate-spin" />
        <p className="text-sm font-bold text-gray-400 animate-pulse">กำลังโหลดข้อมูล...</p>
      </div>
    );
  }

  const { totalRooms, occupied, reserved, available, maintenance, occupancyRate,
    paidThisMonth, unpaidThisMonth, expectedTotalThisMonth, paymentProgress,
    allUnpaidPayments, todayTasks, chartData, reqCounts, roomsByFloor, waitingParcelsCount, expiringContractsCount } = computed;

  const taskIconMap = {
    moveIn: { icon: ArrowRight, bg: 'bg-emerald-50', color: 'text-emerald-600' },
    moveOut: { icon: DoorOpen, bg: 'bg-red-50', color: 'text-red-500' },
  };

  const getRoomColor = (status) => {
    const s = (status || "").toLowerCase();
    if (s === "occupied") return "bg-[#10b981] text-white hover:-translate-y-1 hover:shadow-md";
    if (s === "overdue") return "bg-[#fb7185] text-white hover:-translate-y-1 hover:shadow-md";
    if (s === "reserved") return "bg-[#facc15] text-white hover:-translate-y-1 hover:shadow-md";
    if (s === "maintenance" || s === "close") return "bg-[#4b5563] text-white hover:-translate-y-1 hover:shadow-md";
    return "bg-white border-[2px] border-gray-200 text-gray-500 hover:border-gray-400 hover:-translate-y-1 hover:shadow-md";
  };

  return (
    <div className="w-full pb-24 space-y-4 sm:space-y-5 max-w-7xl mx-auto px-2 sm:px-0">
      
      {/* ══ HEADER ══ */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 bg-[#f3a638]/10 text-[#f3a638] px-3 py-1 rounded-lg text-[10px] sm:text-[11px] font-black tracking-widest uppercase mb-1.5 sm:mb-2">
            <Home size={11} /> {apartmentName}
          </div>
          <h1 className="text-lg sm:text-xl font-black text-gray-900">สวัสดี, {adminName} 👋</h1>
          <p className="text-[11px] sm:text-xs font-semibold text-gray-400 mt-1 flex items-center gap-1.5">
            <Calendar size={12} />
            {new Date().toLocaleDateString('th-TH', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <div className="flex items-center gap-2 self-end sm:self-auto">
          <div className="flex items-center gap-1.5 text-[10px] sm:text-[11px] font-bold text-gray-400 bg-gray-50 px-3 py-1.5 rounded-xl">
            <PulseDot /> อัปเดต {lastRefresh.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}
          </div>
          <button onClick={() => { setLoading(true); fetchAll(); }} className="p-2 sm:p-2.5 rounded-xl border border-gray-100 bg-white hover:bg-gray-50 transition-colors text-gray-500">
            <RefreshCw size={14} />
          </button>
        </div>
      </div>

      {/* ══ TODAY'S TASKS ══ */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 sm:p-5">
        <div className="flex items-center justify-between mb-3 sm:mb-4 border-b border-gray-100 pb-2 sm:pb-3">
          <h2 className="text-sm sm:text-base font-black text-gray-800 flex items-center gap-2">
            <Activity size={17} className="text-[#f3a638]" /> รายการวันนี้
          </h2>
        </div>
        {todayTasks.length > 0 ? (
          <div className="flex overflow-x-auto gap-2.5 sm:gap-3 pb-2 -mx-1 px-1 custom-scrollbar">
            {todayTasks.map((task) => {
              const cfg = taskIconMap[task.type] || { icon: ArrowRight, bg: 'bg-gray-100', color: 'text-gray-500' };
              const Icon = cfg.icon;
              return (
                <div key={task.id} className="flex items-center gap-2.5 sm:gap-3 p-2.5 sm:p-3 bg-gray-50 border border-gray-100 rounded-xl min-w-[200px] sm:min-w-[220px] shrink-0">
                  <div className={`p-2 sm:p-2.5 rounded-xl shrink-0 ${cfg.bg}`}><Icon size={14} className={cfg.color} /></div>
                  <div className="min-w-0">
                    <p className="text-xs sm:text-sm font-bold text-gray-800 truncate">{task.title}</p>
                    <p className="text-[10px] sm:text-[11px] font-medium text-gray-400 truncate">{task.sub}</p>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex items-center justify-center text-gray-400 py-4 sm:py-6 gap-2">
            <CheckCircle2 size={18} className="text-emerald-300" />
            <p className="text-xs sm:text-sm font-bold text-gray-500">ไม่มีรายการสำคัญในวันนี้</p>
          </div>
        )}
      </div>

      {/* ══ STATS & REQUESTS ══ */}
      <div className="flex flex-col gap-3">
        {/* แถวที่ 1: ภาพรวมสถานะห้องและการเงิน */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
          <MiniStat label="อัตราเข้าพัก" value={`${occupancyRate}%`} icon={UserCheck} colorClass="text-blue-600" bgClass="bg-blue-50" />
          <MiniStat label="ห้องว่าง" value={`${available} ห้อง`} icon={DoorOpen} colorClass="text-emerald-600" bgClass="bg-emerald-50" />
          <MiniStat label="ซ่อม/ปิด" value={`${maintenance} ห้อง`} icon={Wrench} colorClass="text-gray-500" bgClass="bg-gray-100" />
          <MiniStat label="ค้างชำระ" value={`${allUnpaidPayments.length} บิล`} icon={Banknote} colorClass="text-rose-600" bgClass="bg-rose-50" />
        </div>
        
        {/* แถวที่ 2: งานที่ต้องจัดการ (พัสดุ, สัญญา, แจ้งซ่อม, ทำความสะอาด) */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
          <MiniStat label="พัสดุรอรับ" value={`${waitingParcelsCount} ชิ้น`} icon={Package} colorClass="text-purple-600" bgClass="bg-purple-50" />
          <MiniStat label="สัญญาใกล้หมด" value={`${expiringContractsCount} ราย`} icon={Clock} colorClass="text-amber-600" bgClass="bg-amber-50" />
          <MiniStat label="แจ้งซ่อม" value={`${reqCounts.fix} รายการ`} icon={Wrench} colorClass="text-indigo-600" bgClass="bg-indigo-50" />
          <MiniStat label="แจ้งทำความสะอาด" value={`${reqCounts.clean} รายการ`} icon={Sparkles} colorClass="text-sky-600" bgClass="bg-sky-50" />
        </div>
      </div>

      {/* ══ ROOM MAP ══ */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 sm:p-5 relative overflow-hidden">
        <SectionHeader title={`ผังห้องพัก (${totalRooms} ห้อง)`} />
        <div className="flex flex-wrap gap-x-3 gap-y-2 mb-4 sm:mb-6 border-b border-gray-100 pb-3 sm:pb-4">
          {[
            { id: 'l1', color: 'bg-[#10b981]', label: 'มีผู้เช่า' },
            { id: 'l2', color: 'bg-[#fb7185]', label: 'ค้างชำระ' },
            { id: 'l3', color: 'bg-[#facc15]', label: 'จอง' },
            { id: 'l4', color: 'bg-white border-2 border-gray-200', label: 'ว่าง' },
            { id: 'l5', color: 'bg-[#4b5563]', label: 'ซ่อม/ปิด' },
          ].map(({ id, color, label }) => (
            <div key={id} className="flex items-center gap-1.5">
              <div className={`w-3 h-3 sm:w-3.5 sm:h-3.5 rounded-sm sm:rounded-md ${color}`} />
              <span className="text-[10px] sm:text-[11px] font-bold text-gray-500">{label}</span>
            </div>
          ))}
        </div>

        <div className="pl-12 sm:pl-16 relative">
          <div className="absolute left-[2.75rem] sm:left-[3.75rem] top-3 bottom-8 w-0.5 bg-gray-200"></div>
          {Object.keys(roomsByFloor).sort((a, b) => Number(a) - Number(b)).map((floor) => (
            <div key={`floor-${floor}`} className="relative pb-6 sm:pb-8 last:pb-2">
              <div className="absolute -left-12 sm:-left-16 top-0 w-10 sm:w-14 text-right pr-2">
                <span className="font-black text-gray-500 text-xs sm:text-sm">ชั้น {floor}</span>
              </div>
              <div className="absolute -left-[0.8rem] sm:-left-[0.55rem] top-1.5 w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-gray-300 ring-4 ring-white z-10"></div>
              <div className="flex flex-wrap gap-1.5 sm:gap-2 pl-1 sm:pl-2">
                {roomsByFloor[floor]
                  .sort((a, b) => String(a.number || a.roomNumber).localeCompare(String(b.number || b.roomNumber), undefined, { numeric: true }))
                  .map(room => (
                    <button
                      key={room.id}
                      onClick={() => navigate(`/rooms/${room.number || room.roomNumber}`)}
                      className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl flex items-center justify-center font-black text-[10px] sm:text-xs transition-all relative ${getRoomColor(room.status)}`}
                      title={`ห้อง ${room.number || room.roomNumber} — ${room.status}`}
                    >
                      {room.number || room.roomNumber}
                      {room.icons && room.icons.length > 0 && (
                        <span className="absolute -top-1 -right-1 flex h-2 w-2 sm:h-2.5 sm:w-2.5 items-center justify-center rounded-full bg-red-500 border border-white animate-pulse" />
                      )}
                    </button>
                  ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ══ CHART & OVERVIEW/UNPAID TABLE GRID ══ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-5">
        
        {/* CHART */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm p-4 sm:p-5">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 sm:mb-5 gap-3 sm:gap-4">
            <div>
              <h2 className="text-sm sm:text-base font-black text-gray-800 flex items-center gap-2 mb-0.5 sm:mb-1">
                <BarChart2 size={16} className="text-[#f3a638]" /> รายรับ — รายจ่าย
              </h2>
              <p className="text-[11px] sm:text-xs font-semibold text-gray-500">
                รายรับเดือนนี้: <span className="font-black text-emerald-600 ml-1 text-sm">฿{fmt(paidThisMonth)}</span>
              </p>
            </div>
            <div className="flex bg-gray-100 rounded-xl p-1 gap-0.5 w-full sm:w-auto overflow-x-auto no-scrollbar">
              {[{ key: 'month', label: 'เดือนนี้' }, { key: 'year', label: 'ปีนี้' }, { key: 'compare', label: 'ย้อนหลัง 6 เดือน' }].map(({ key, label }) => (
                <button
                  key={key} onClick={() => setChartMode(key)}
                  className={`px-3 py-1.5 text-[10px] sm:text-[11px] font-bold rounded-lg transition-all whitespace-nowrap flex-1 sm:flex-none ${chartMode === key ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
          <div style={{ width: '100%', height: 280 }} className="min-h-[240px] sm:min-h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              {chartMode === 'compare' ? (
                <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="gi" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#34d399" stopOpacity={0.15} /><stop offset="95%" stopColor="#34d399" stopOpacity={0} /></linearGradient>
                    <linearGradient id="ge" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#f87171" stopOpacity={0.15} /><stop offset="95%" stopColor="#f87171" stopOpacity={0} /></linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#9ca3af', fontWeight: 700 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#9ca3af', fontWeight: 700 }} tickFormatter={v => v >= 1000 ? `${v/1000}k` : v} />
                  <Tooltip content={<ChartTooltip />} />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: 10, fontWeight: 700, paddingTop: 12 }} />
                  <Area type="monotone" dataKey="income" name="รายรับ" stroke="#34d399" fill="url(#gi)" strokeWidth={2.5} dot={{ r: 3, fill: '#34d399', strokeWidth: 0 }} />
                  <Area type="monotone" dataKey="expense" name="รายจ่าย (แจ้งซ่อม)" stroke="#f87171" fill="url(#ge)" strokeWidth={2.5} dot={{ r: 3, fill: '#f87171', strokeWidth: 0 }} />
                </AreaChart>
              ) : (
                <BarChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#9ca3af', fontWeight: 700 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#9ca3af', fontWeight: 700 }} tickFormatter={v => v >= 1000 ? `${v/1000}k` : v} />
                  <Tooltip content={<ChartTooltip />} />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: 10, fontWeight: 700, paddingTop: 12 }} />
                  <Bar dataKey="income" name="รายรับ" fill="#34d399" radius={[4, 4, 0, 0]} maxBarSize={chartMode === 'month' ? 10 : 28} />
                  <Bar dataKey="expense" name="รายจ่าย (แจ้งซ่อม)" fill="#f87171" radius={[4, 4, 0, 0]} maxBarSize={chartMode === 'month' ? 10 : 28} />
                </BarChart>
              )}
            </ResponsiveContainer>
          </div>
        </div>

        {/* ── สรุปการเก็บเงิน & บิลรอชำระ ── */}
        <div className="space-y-4 sm:space-y-5">
          {/* Progress Card */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 sm:p-5 flex flex-col justify-center">
            <h2 className="text-sm font-black text-gray-800 flex items-center gap-2 mb-4">
              <Wallet size={16} className="text-emerald-500" /> สรุปยอดเก็บเงินเดือนนี้
            </h2>
            
            <div className="flex justify-between items-end mb-2">
              <div>
                <p className="text-xs font-bold text-gray-500">เก็บได้แล้ว</p>
                <p className="text-xl font-black text-emerald-600 leading-none">฿{fmt(paidThisMonth)}</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-bold text-gray-400">ค้างชำระ: ฿{fmt(unpaidThisMonth)}</p>
                <p className="text-[10px] font-bold text-gray-400">คาดการณ์รวม: ฿{fmt(expectedTotalThisMonth)}</p>
              </div>
            </div>
            
            {/* Progress Bar */}
            <div className="w-full bg-gray-100 rounded-full h-2.5 mb-1.5 overflow-hidden">
              <div className="bg-emerald-400 h-2.5 rounded-full transition-all duration-500" style={{ width: `${paymentProgress}%` }}></div>
            </div>
            <div className="flex justify-between text-[10px] font-black">
              <span className="text-emerald-600">{paymentProgress}%</span>
              <span className="text-gray-400">100%</span>
            </div>
          </div>

          {/* Unpaid List */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 sm:p-5 flex flex-col max-h-[300px]">
            <div className="flex items-center justify-between border-b border-gray-100 pb-2 mb-2">
              <h2 className="text-sm font-black text-gray-800 flex items-center gap-2">
                <AlertCircle size={15} className="text-rose-500" /> บิลรอชำระ ({allUnpaidPayments.length})
              </h2>
            </div>
            <div className="flex-1 overflow-y-auto pr-1 custom-scrollbar">
              {allUnpaidPayments.length > 0 ? (
                <div className="space-y-2 pb-2">
                  {allUnpaidPayments.map((p) => {
                    const contract = raw.contracts.find(c => String(c.id || c.Id) === String(p.contractId || p.ContractId));
                    const room = raw.rooms.find(r => String(r.roomId || r.id || r.Id) === String(contract?.roomId || contract?.RoomId));
                    const roomNumber = room?.number || room?.roomNumber || '-';
                    
                    const dateStr = p.recordDate || p.RecordDate || p.createdAt;
                    const [y, m] = (dateStr || "").split("-");
                    
                    return (
                      <div key={`up-${p.id || p.Id}`} className="flex items-center justify-between p-2.5 bg-gray-50 rounded-xl border border-gray-100">
                        <div>
                          <p className="text-xs font-bold text-gray-800">ห้อง {roomNumber}</p>
                          <p className="text-[10px] font-medium text-gray-400">{m && y ? `${MONTH_TH[Number(m)-1]} ${Number(y)+543}` : '-'}</p>
                        </div>
                        <p className="text-xs font-black text-rose-600">฿{fmt(p.totalAmount || p.TotalAmount || p.paidAmount || p.PaidAmount)}</p>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center text-gray-400 p-4">
                  <CheckCircle2 size={24} className="text-emerald-200 mb-1" />
                  <p className="text-xs font-bold text-gray-500">ไม่มีบิลค้างชำระ</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

    </div>
  );
};

export default Dashboard;