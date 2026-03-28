import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, AreaChart, Area
} from 'recharts';
import {
  Home, Banknote, DoorOpen, Package, PlusCircle, Loader2,
  Users, ArrowRight, CheckCircle2, TrendingUp, Calendar,
  Bell, BellRing, AlertTriangle, Clock, Zap, RefreshCw,
  FileText, Wrench, ChevronRight, Activity, Droplets,
  UserCheck, AlertCircle, X, ArrowUpRight, BarChart2
} from 'lucide-react';

/* ─────────────────────────────────────────────
   CONFIG
───────────────────────────────────────────── */
const API_BASE = 'http://localhost:5252';
const REFRESH_INTERVAL = 60_000; // 60 วินาที

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

/* ─────────────────────────────────────────────
   SMALL COMPONENTS
───────────────────────────────────────────── */

const PulseDot = ({ color = 'bg-emerald-400' }) => (
  <span className="relative flex h-2.5 w-2.5">
    <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${color} opacity-60`} />
    <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${color}`} />
  </span>
);

const StatCard = ({ label, value, subtext, icon: Icon, accent, trend, onClick }) => (
  <button
    onClick={onClick}
    className="group bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all text-left w-full hover:-translate-y-0.5 active:scale-[0.98]"
  >
    <div className="flex items-start justify-between mb-3">
      <div className={`p-2.5 rounded-xl ${accent.bg}`}>
        <Icon size={20} className={accent.text} strokeWidth={2.5} />
      </div>
      {trend !== undefined && (
        <span className={`text-xs font-bold px-2 py-0.5 rounded-full flex items-center gap-0.5
          ${trend >= 0 ? 'text-emerald-700 bg-emerald-50' : 'text-red-600 bg-red-50'}`}>
          <ArrowUpRight size={11} className={trend < 0 ? 'rotate-180' : ''} />
          {Math.abs(trend)}%
        </span>
      )}
    </div>
    <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1">{label}</p>
    <p className="text-2xl font-black text-gray-900 leading-none">{value}</p>
    {subtext && <p className="text-[11px] font-semibold text-gray-400 mt-2">{subtext}</p>}
  </button>
);

const NotifBadge = ({ count }) =>
  count > 0 ? (
    <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 flex items-center justify-center bg-red-500 text-white text-[10px] font-black rounded-full ring-2 ring-white">
      {count > 99 ? '99+' : count}
    </span>
  ) : null;

const AlertRow = ({ icon: Icon, color, bg, title, sub, badge, onClick }) => (
  <button
    onClick={onClick}
    className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors text-left group"
  >
    <div className={`p-2 rounded-lg shrink-0 ${bg}`}>
      <Icon size={15} className={color} />
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-sm font-bold text-gray-800 truncate">{title}</p>
      <p className="text-[11px] font-medium text-gray-400 truncate">{sub}</p>
    </div>
    {badge && (
      <span className={`shrink-0 text-[10px] font-black px-2 py-0.5 rounded-full ${badge.style}`}>
        {badge.label}
      </span>
    )}
    <ChevronRight size={14} className="text-gray-300 group-hover:text-gray-500 shrink-0" />
  </button>
);

const SectionHeader = ({ title, action, actionLabel }) => (
  <div className="flex items-center justify-between mb-4">
    <h2 className="text-base font-black text-gray-800">{title}</h2>
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
        <p key={i} style={{ color: p.color }} className="font-bold">
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
  const [showNotif, setShowNotif] = useState(false);
  const [chartMode, setChartMode] = useState('month'); 
  const [apartmentName, setApartmentName] = useState('');
  const [adminName, setAdminName] = useState('');

  const [raw, setRaw] = useState({
    rooms: [], contracts: [], payments: [], requests: [],
    parcels: [], tenants: [], utilityMeters: [], documents: []
  });

  const fetchAll = useCallback(async () => {
    try {
      const adminId = localStorage.getItem('adminId') || 1;

      const [
        adminRes, aptRes, rooms, contracts, payments,
        requests, parcels, tenants, utilityMeters, documents
      ] = await Promise.allSettled([
        axios.get(`${API_BASE}/Admins/${adminId}`).catch(() => null),
        axios.get(`${API_BASE}/Apartments`).then(r => arr(r.data)),
        get('/Rooms'),
        get('/Contracts'),
        get('/Payments'),
        get('/Requests'),
        get('/Parcels'),
        get('/Tenants'),
        get('/UtilityMeters'),
        get('/Documents'),
      ]);

      const resolve = (r) => r.status === 'fulfilled' ? r.value : (Array.isArray(r.value) ? [] : null);

      const admin = resolve(adminRes);
      if (admin?.value) {
        const a = admin.value;
        setAdminName(`${a.firstName || ''} ${a.lastName || ''}`.trim() || 'ผู้ดูแลระบบ');
      }

      const apts = resolve(aptRes) || [];
      setApartmentName(Array.isArray(apts) && apts[0]?.name ? apts[0].name : 'ระบบจัดการหอพัก');

      setRaw({
        rooms: resolve(rooms) || [],
        contracts: resolve(contracts) || [],
        payments: resolve(payments) || [],
        requests: resolve(requests) || [],
        parcels: resolve(parcels) || [],
        tenants: resolve(tenants) || [],
        utilityMeters: resolve(utilityMeters) || [],
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
    const { rooms, contracts, payments, requests, parcels, tenants, utilityMeters } = raw;
    const now = new Date();
    const curYear = now.getFullYear();
    const curMonth = now.getMonth();

    const totalRooms = rooms.length;
    const occupied = rooms.filter(r => r.status?.toLowerCase() === 'occupied').length;
    const available = rooms.filter(r => r.status?.toLowerCase() === 'available').length;
    const maintenance = rooms.filter(r => ['maintenance', 'close'].includes(r.status?.toLowerCase())).length;
    const occupancyRate = totalRooms ? Math.round((occupied / totalRooms) * 100) : 0;

    const paidThisMonth = payments.filter(p => {
      const d = new Date(p.recordDate || p.createdAt);
      return p.status?.toLowerCase() === 'paid' && d.getFullYear() === curYear && d.getMonth() === curMonth;
    }).reduce((s, p) => s + Number(p.paidAmount || p.totalAmount || 0), 0);

    const overdue = payments.filter(p =>
      p.status?.toLowerCase() === 'unpaid' && new Date(p.dueDate || p.recordDate) < now
    );

    const expiringContracts = contracts.filter(c => {
      const d = daysUntil(c.endDate);
      return c.status === 'Active' && d >= 0 && d <= 30;
    }).sort((a, b) => daysUntil(a.endDate) - daysUntil(b.endDate));

    const pendingRequests = requests.filter(r =>
      ['pending', 'open', 'new'].includes(r.status?.toLowerCase())
    );

    const waitingParcels = parcels.filter(p =>
      ['waiting', 'received', 'new'].includes(p.status?.toLowerCase())
    );

    const todayTasks = [];
    contracts.forEach(c => {
      if (isToday(c.startDate)) {
        const room = rooms.find(r => r.id === c.roomId);
        todayTasks.push({ type: 'moveIn', title: `ห้อง ${room?.number || c.roomId} ย้ายเข้า`, sub: 'เริ่มสัญญาวันนี้' });
      }
      if (isToday(c.endDate)) {
        const room = rooms.find(r => r.id === c.roomId);
        todayTasks.push({ type: 'moveOut', title: `ห้อง ${room?.number || c.roomId} ย้ายออก`, sub: 'สิ้นสุดสัญญาวันนี้' });
      }
    });
    parcels.forEach(p => {
      if (isToday(p.createdAt || p.receivedDate)) {
        const room = rooms.find(r => r.id === p.roomId);
        todayTasks.push({ type: 'parcel', title: `พัสดุ ห้อง ${room?.number || p.roomId}`, sub: p.shippingCompany || 'พัสดุใหม่' });
      }
    });

    const alerts = [];
    overdue.forEach(p => {
      const room = rooms.find(r => r.id === p.roomId);
      alerts.push({
        icon: AlertTriangle, color: 'text-red-500', bg: 'bg-red-50',
        title: `ค้างชำระ ห้อง ${room?.number || p.roomId}`,
        sub: `฿${fmt(p.totalAmount || p.paidAmount)} — ครบกำหนด ${thaiDate(p.dueDate)}`,
        link: '/billings'
      });
    });
    expiringContracts.slice(0, 5).forEach(c => {
      const room = rooms.find(r => r.id === c.roomId);
      const d = daysUntil(c.endDate);
      alerts.push({
        icon: Clock, color: 'text-amber-500', bg: 'bg-amber-50',
        title: `สัญญาห้อง ${room?.number || c.roomId} ใกล้หมด`,
        sub: `อีก ${d} วัน — ${thaiDate(c.endDate)}`,
        link: '/contracts'
      });
    });
    pendingRequests.slice(0, 5).forEach(r => {
      const room = rooms.find(rm => rm.id === r.roomId);
      alerts.push({
        icon: Wrench, color: 'text-blue-500', bg: 'bg-blue-50',
        title: `คำขอซ่อม ห้อง ${room?.number || r.roomId}`,
        sub: r.description || r.title || 'รอดำเนินการ',
        link: '/requests'
      });
    });
    waitingParcels.slice(0, 5).forEach(p => {
      const room = rooms.find(r => r.id === p.roomId);
      alerts.push({
        icon: Package, color: 'text-purple-500', bg: 'bg-purple-50',
        title: `พัสดุรอรับ ห้อง ${room?.number || p.roomId}`,
        sub: p.shippingCompany || 'รอเจ้าของรับ',
        link: '/parcels'
      });
    });

    const daysInMonth = new Date(curYear, curMonth + 1, 0).getDate();
    const monthChart = Array.from({ length: daysInMonth }, (_, i) => ({
      name: `${i + 1}`, income: 0, expense: 0
    }));
    payments.forEach(p => {
      if (p.status?.toLowerCase() === 'paid') {
        const d = new Date(p.recordDate || p.createdAt);
        if (d.getFullYear() === curYear && d.getMonth() === curMonth) {
          monthChart[d.getDate() - 1].income += Number(p.paidAmount || p.totalAmount || 0);
        }
      }
    });
    requests.forEach(r => {
      if (!r.isTenantCost && Number(r.cost) > 0) {
        const d = new Date(r.createdAt || r.updatedAt);
        if (d.getFullYear() === curYear && d.getMonth() === curMonth) {
          monthChart[d.getDate() - 1].expense += Number(r.cost);
        }
      }
    });

    const yearChart = MONTH_TH.map(m => ({ name: m, income: 0, expense: 0 }));
    payments.forEach(p => {
      if (p.status?.toLowerCase() === 'paid') {
        const d = new Date(p.recordDate || p.createdAt);
        if (d.getFullYear() === curYear) {
          yearChart[d.getMonth()].income += Number(p.paidAmount || p.totalAmount || 0);
        }
      }
    });
    requests.forEach(r => {
      if (!r.isTenantCost && Number(r.cost) > 0) {
        const d = new Date(r.createdAt || r.updatedAt);
        if (d.getFullYear() === curYear) {
          yearChart[d.getMonth()].expense += Number(r.cost);
        }
      }
    });

    const compareChart = Array.from({ length: 6 }, (_, i) => {
      const d = new Date(curYear, curMonth - 5 + i, 1);
      return { name: `${MONTH_TH[d.getMonth()]} ${String(d.getFullYear()).slice(2)}`, income: 0, expense: 0 };
    });
    payments.forEach(p => {
      if (p.status?.toLowerCase() === 'paid') {
        const d = new Date(p.recordDate || p.createdAt);
        for (let i = 0; i < 6; i++) {
          const ref = new Date(curYear, curMonth - 5 + i, 1);
          if (d.getFullYear() === ref.getFullYear() && d.getMonth() === ref.getMonth()) {
            compareChart[i].income += Number(p.paidAmount || p.totalAmount || 0);
          }
        }
      }
    });
    requests.forEach(r => {
      if (!r.isTenantCost && Number(r.cost) > 0) {
        const d = new Date(r.createdAt || r.updatedAt);
        for (let i = 0; i < 6; i++) {
          const ref = new Date(curYear, curMonth - 5 + i, 1);
          if (d.getFullYear() === ref.getFullYear() && d.getMonth() === ref.getMonth()) {
            compareChart[i].expense += Number(r.cost);
          }
        }
      }
    });

    const utilSummary = utilityMeters.reduce((acc, u) => {
      if (u.type === 'water' || u.meterType === 'water') acc.water += Number(u.unitsUsed || u.usage || 0);
      else acc.electric += Number(u.unitsUsed || u.usage || 0);
      return acc;
    }, { water: 0, electric: 0 });

    const chartData = chartMode === 'month' ? monthChart : chartMode === 'year' ? yearChart : compareChart;

    return {
      totalRooms, occupied, available, maintenance, occupancyRate,
      paidThisMonth, overdue, expiringContracts, pendingRequests,
      waitingParcels, todayTasks, alerts, chartData,
      utilSummary, tenants,
    };
  }, [raw, chartMode]);

  if (loading) {
    return (
      <div className="w-full h-[80vh] flex flex-col items-center justify-center gap-3">
        <div className="relative">
          <div className="w-12 h-12 rounded-full border-4 border-orange-100 border-t-[#f3a638] animate-spin" />
        </div>
        <p className="text-sm font-bold text-gray-400 animate-pulse">กำลังโหลดข้อมูล...</p>
      </div>
    );
  }

  const { totalRooms, occupied, available, maintenance, occupancyRate,
    paidThisMonth, overdue, expiringContracts, pendingRequests,
    waitingParcels, todayTasks, alerts, chartData, utilSummary } = computed;

  const notifCount = alerts.length;

  const taskIconMap = {
    moveIn: { icon: ArrowRight, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    moveOut: { icon: DoorOpen, color: 'text-red-500', bg: 'bg-red-50' },
    parcel: { icon: Package, color: 'text-purple-600', bg: 'bg-purple-50' },
  };

  return (
    <div className="w-full pb-24 space-y-5 max-w-7xl mx-auto">

      {/* ══ HEADER ══ */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <div className="flex items-start justify-between">
          <div>
            <div className="inline-flex items-center gap-1.5 bg-[#f3a638]/10 text-[#f3a638] px-3 py-1 rounded-lg text-[11px] font-black tracking-widest uppercase mb-2">
              <Home size={11} />
              {apartmentName || 'ระบบจัดการหอพัก'}
            </div>
            <h1 className="text-xl font-black text-gray-900">
              สวัสดี, {adminName || 'ผู้ดูแลระบบ'} 👋
            </h1>
            <p className="text-xs font-semibold text-gray-400 mt-1 flex items-center gap-1.5">
              <Calendar size={12} />
              {new Date().toLocaleDateString('th-TH', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="hidden sm:flex items-center gap-1.5 text-[11px] font-bold text-gray-400 bg-gray-50 px-3 py-1.5 rounded-xl">
              <PulseDot />
              อัปเดต {lastRefresh.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })} น.
            </div>
            <button
              onClick={() => { setLoading(true); fetchAll(); }}
              className="p-2.5 rounded-xl border border-gray-100 bg-white hover:bg-gray-50 transition-colors text-gray-500"
              title="รีเฟรชข้อมูล"
            >
              <RefreshCw size={15} />
            </button>
            <div className="relative">
              <button
                onClick={() => setShowNotif(v => !v)}
                className={`p-2.5 rounded-xl border transition-colors ${notifCount > 0 ? 'border-red-100 bg-red-50 text-red-500' : 'border-gray-100 bg-white text-gray-500 hover:bg-gray-50'}`}
              >
                {notifCount > 0 ? <BellRing size={15} /> : <Bell size={15} />}
              </button>
              <NotifBadge count={notifCount} />
              {showNotif && (
                <NotificationPanel alerts={alerts} onClose={() => setShowNotif(false)} navigate={navigate} />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ══ STAT CARDS ══ */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard
          label="รายรับเดือนนี้"
          value={`฿${fmt(paidThisMonth)}`}
          subtext="บิลที่ชำระแล้ว"
          icon={TrendingUp}
          accent={{ bg: 'bg-emerald-50', text: 'text-emerald-600' }}
          onClick={() => navigate('/billings')}
        />
        <StatCard
          label="อัตราเข้าพัก"
          value={`${occupancyRate}%`}
          subtext={`${occupied}/${totalRooms} ห้อง`}
          icon={UserCheck}
          accent={{ bg: 'bg-blue-50', text: 'text-blue-600' }}
          onClick={() => navigate('/room-map')}
        />
        <StatCard
          label="ห้องว่าง"
          value={available}
          subtext="พร้อมรับผู้เช่าใหม่"
          icon={DoorOpen}
          accent={{ bg: 'bg-orange-50', text: 'text-orange-500' }}
          onClick={() => navigate('/room-map', { state: { defaultFilter: 'available' } })}
        />
        <StatCard
          label="ค้างชำระ"
          value={overdue.length}
          subtext={overdue.length > 0 ? 'รายการรอดำเนินการ' : 'ไม่มีค้างชำระ 🎉'}
          icon={AlertCircle}
          accent={{ bg: overdue.length > 0 ? 'bg-red-50' : 'bg-gray-50', text: overdue.length > 0 ? 'text-red-500' : 'text-gray-400' }}
          onClick={() => navigate('/billings')}
        />
      </div>

      {/* ══ SECONDARY STATS ══ */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center gap-3">
          <div className="p-2.5 bg-purple-50 rounded-xl"><Package size={18} className="text-purple-600" /></div>
          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">พัสดุรอรับ</p>
            <p className="text-xl font-black text-gray-900">{waitingParcels.length}</p>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center gap-3">
          <div className="p-2.5 bg-amber-50 rounded-xl"><Wrench size={18} className="text-amber-600" /></div>
          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">คำขอซ่อม</p>
            <p className="text-xl font-black text-gray-900">{pendingRequests.length}</p>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center gap-3">
          <div className="p-2.5 bg-sky-50 rounded-xl"><Clock size={18} className="text-sky-600" /></div>
          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">สัญญาใกล้หมด</p>
            <p className="text-xl font-black text-gray-900">{expiringContracts.length}</p>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center gap-3">
          <div className="p-2.5 bg-gray-100 rounded-xl"><Wrench size={18} className="text-gray-500" /></div>
          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">ซ่อมแซม/ปิด</p>
            <p className="text-xl font-black text-gray-900">{maintenance}</p>
          </div>
        </div>
      </div>

      {/* ══ CHART + TASKS (2-col) ══ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-base font-black text-gray-800 flex items-center gap-2">
              <BarChart2 size={17} className="text-[#f3a638]" />
              รายรับ — รายจ่าย
            </h2>
            <div className="flex bg-gray-100 rounded-xl p-1 gap-0.5">
              {[
                { key: 'month', label: 'เดือนนี้' },
                { key: 'year', label: 'ปีนี้' },
                { key: 'compare', label: 'ย้อนหลัง 6 เดือน' },
              ].map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => setChartMode(key)}
                  className={`px-3 py-1.5 text-[11px] font-bold rounded-lg transition-all whitespace-nowrap
                    ${chartMode === key ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              {chartMode === 'compare' ? (
                <AreaChart data={chartData} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="gi" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#34d399" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#34d399" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="ge" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f87171" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#f87171" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#9ca3af', fontWeight: 700 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#9ca3af', fontWeight: 700 }} tickFormatter={v => v >= 1000 ? `${v/1000}k` : v} />
                  <Tooltip content={<ChartTooltip />} />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: 11, fontWeight: 700, paddingTop: 12 }} />
                  <Area type="monotone" dataKey="income" name="รายรับ" stroke="#34d399" fill="url(#gi)" strokeWidth={2.5} dot={{ r: 4, fill: '#34d399', strokeWidth: 0 }} />
                  <Area type="monotone" dataKey="expense" name="รายจ่าย" stroke="#f87171" fill="url(#ge)" strokeWidth={2.5} dot={{ r: 4, fill: '#f87171', strokeWidth: 0 }} />
                </AreaChart>
              ) : (
                <BarChart data={chartData} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#9ca3af', fontWeight: 700 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#9ca3af', fontWeight: 700 }} tickFormatter={v => v >= 1000 ? `${v/1000}k` : v} />
                  <Tooltip content={<ChartTooltip />} />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: 11, fontWeight: 700, paddingTop: 12 }} />
                  <Bar dataKey="income" name="รายรับ" fill="#34d399" radius={[5, 5, 0, 0]} maxBarSize={chartMode === 'month' ? 12 : 32} />
                  <Bar dataKey="expense" name="รายจ่าย" fill="#f87171" radius={[5, 5, 0, 0]} maxBarSize={chartMode === 'month' ? 12 : 32} />
                </BarChart>
              )}
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-black text-gray-800 flex items-center gap-2">
              <Activity size={17} className="text-[#f3a638]" />
              รายการวันนี้
            </h2>
            <span className="text-xs font-black bg-blue-50 text-blue-600 px-2.5 py-1 rounded-xl">
              {todayTasks.length} รายการ
            </span>
          </div>
          <div className="flex-1 space-y-1 overflow-y-auto max-h-[250px] pr-1">
            {todayTasks.length > 0 ? todayTasks.map((task, i) => {
              const cfg = taskIconMap[task.type] || taskIconMap.parcel;
              const Icon = cfg.icon;
              return (
                <div key={i} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                  <div className={`p-2 rounded-lg shrink-0 ${cfg.bg}`}>
                    <Icon size={14} className={cfg.color} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-gray-800 truncate">{task.title}</p>
                    <p className="text-[11px] font-medium text-gray-400 truncate">{task.sub}</p>
                  </div>
                </div>
              );
            }) : (
              <div className="h-full flex flex-col items-center justify-center text-gray-400 py-10">
                <CheckCircle2 size={32} className="text-emerald-200 mb-2" />
                <p className="text-sm font-bold">ไม่มีรายการวันนี้</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ══ ALERTS + ROOM MAP (2-col) ══ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-1 space-y-4">
          {overdue.length > 0 && (
            <div className="bg-white rounded-2xl border border-red-100 shadow-sm p-5">
              <SectionHeader
                title={<span className="flex items-center gap-2 text-red-600"><AlertTriangle size={15} /> ค้างชำระ ({overdue.length})</span>}
                action={() => navigate('/billings')} actionLabel="ดูทั้งหมด"
              />
              <div className="space-y-0.5">
                {overdue.slice(0, 4).map((p, i) => {
                  const room = raw.rooms.find(r => r.id === p.roomId);
                  return (
                    <AlertRow key={i}
                      icon={AlertTriangle} color="text-red-500" bg="bg-red-50"
                      title={`ห้อง ${room?.number || p.roomId}`}
                      sub={`฿${fmt(p.totalAmount)} — ${thaiDate(p.dueDate)}`}
                      badge={{ label: 'ค้างชำระ', style: 'bg-red-50 text-red-600' }}
                      onClick={() => navigate('/billings')}
                    />
                  );
                })}
              </div>
            </div>
          )}

          {expiringContracts.length > 0 && (
            <div className="bg-white rounded-2xl border border-amber-100 shadow-sm p-5">
              <SectionHeader
                title={<span className="flex items-center gap-2 text-amber-600"><Clock size={15} /> สัญญาใกล้หมด ({expiringContracts.length})</span>}
                action={() => navigate('/contracts')} actionLabel="ดูทั้งหมด"
              />
              <div className="space-y-0.5">
                {expiringContracts.slice(0, 4).map((c, i) => {
                  const room = raw.rooms.find(r => r.id === c.roomId);
                  const d = daysUntil(c.endDate);
                  return (
                    <AlertRow key={i}
                      icon={Clock} color="text-amber-500" bg="bg-amber-50"
                      title={`ห้อง ${room?.number || c.roomId}`}
                      sub={`หมด ${thaiDate(c.endDate)}`}
                      badge={{ label: `${d} วัน`, style: d <= 7 ? 'bg-red-50 text-red-600' : 'bg-amber-50 text-amber-600' }}
                      onClick={() => navigate('/contracts')}
                    />
                  );
                })}
              </div>
            </div>
          )}

          {pendingRequests.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <SectionHeader
                title={<span className="flex items-center gap-2 text-amber-700"><Wrench size={15} /> คำขอซ่อม ({pendingRequests.length})</span>}
                action={() => navigate('/requests')} actionLabel="ดูทั้งหมด"
              />
              <div className="space-y-0.5">
                {pendingRequests.slice(0, 3).map((r, i) => {
                  const room = raw.rooms.find(rm => rm.id === r.roomId);
                  return (
                    <AlertRow key={i}
                      icon={Wrench} color="text-amber-600" bg="bg-amber-50"
                      title={`ห้อง ${room?.number || r.roomId}`}
                      sub={r.description || r.title || 'รอดำเนินการ'}
                      badge={{ label: 'รอดำเนินการ', style: 'bg-amber-50 text-amber-600' }}
                      onClick={() => navigate('/requests')}
                    />
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <SectionHeader
              title={`ผังห้องพัก (${computed.totalRooms} ห้อง)`}
              action={() => navigate('/room-map')} actionLabel="ดูผังเต็ม"
            />
            <div className="grid grid-cols-7 sm:grid-cols-10 lg:grid-cols-12 gap-1.5 mb-4">
              {raw.rooms
                .sort((a, b) => String(a.number).localeCompare(String(b.number), undefined, { numeric: true }))
                .map(room => {
                  const s = room.status?.toLowerCase();
                  const colorMap = {
                    occupied: 'bg-blue-400 hover:bg-blue-500',
                    available: 'bg-emerald-100 border border-emerald-200 hover:bg-emerald-200',
                    reserved: 'bg-orange-400 hover:bg-orange-500',
                    maintenance: 'bg-red-400 hover:bg-red-500',
                    close: 'bg-red-400 hover:bg-red-500',
                  };
                  const color = colorMap[s] || 'bg-gray-100 border border-gray-200';
                  return (
                    <button
                      key={room.id}
                      onClick={() => navigate('/room-map')}
                      className={`aspect-square rounded-md ${color} transition-all hover:scale-110 cursor-pointer group relative`}
                      title={`ห้อง ${room.number} — ${s || 'ไม่ทราบ'}`}
                    >
                      <span className="absolute inset-0 flex items-center justify-center text-[8px] font-black text-white opacity-0 group-hover:opacity-100">
                        {room.number}
                      </span>
                    </button>
                  );
                })}
            </div>
            <div className="flex flex-wrap gap-x-4 gap-y-1.5">
              {[
                { color: 'bg-blue-400', label: `มีผู้เช่า (${occupied})` },
                { color: 'bg-emerald-100 border border-emerald-200', label: `ว่าง (${available})` },
                { color: 'bg-orange-400', label: 'จอง' },
                { color: 'bg-red-400', label: `ซ่อม/ปิด (${maintenance})` },
              ].map(({ color, label }) => (
                <div key={label} className="flex items-center gap-1.5">
                  <div className={`w-3 h-3 rounded-sm ${color}`} />
                  <span className="text-[11px] font-bold text-gray-500">{label}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <SectionHeader
              title="ภาพรวมมิเตอร์เดือนนี้"
              action={() => navigate('/utility-meters')} actionLabel="ดูรายละเอียด"
            />
            <div className="grid grid-cols-2 gap-3">
              <div className="flex items-center gap-3 bg-yellow-50 rounded-xl p-4">
                <div className="p-2.5 bg-yellow-100 rounded-xl">
                  <Zap size={20} className="text-yellow-600" />
                </div>
                <div>
                  <p className="text-[11px] font-bold text-yellow-600 uppercase tracking-wider">ไฟฟ้า</p>
                  <p className="text-2xl font-black text-gray-900">
                    {fmt(utilSummary.electric)}
                    <span className="text-xs font-bold text-gray-400 ml-1">หน่วย</span>
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 bg-sky-50 rounded-xl p-4">
                <div className="p-2.5 bg-sky-100 rounded-xl">
                  <Droplets size={20} className="text-sky-600" />
                </div>
                <div>
                  <p className="text-[11px] font-bold text-sky-600 uppercase tracking-wider">น้ำประปา</p>
                  <p className="text-2xl font-black text-gray-900">
                    {fmt(utilSummary.water)}
                    <span className="text-xs font-bold text-gray-400 ml-1">หน่วย</span>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;