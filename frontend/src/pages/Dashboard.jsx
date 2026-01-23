import dashPic from '../assets/dash.png';
import { Home, Calendar, BanknoteX, DoorOpen, ChevronRight } from 'lucide-react';

const StatCard = ({ label, value, icon: Icon, colorClass }) => (
  <div className="bg-gray-50 p-4 rounded-2xl shadow-sm border border-gray-200 flex items-center justify-between">
    <div>
      <p className="text-gray-600 text-m font-medium mb-1">{label}</p>
      <p className="text-2xl font-bold text-gray-800">{value}</p>
    </div>
    <div className={`p-3 rounded-xl ${colorClass}`}>
      <Icon size={32} className="text-gray-700" />
    </div>
  </div>
);

const ScheduleItem = ({ time, activity }) => (
  <div className="flex items-center justify-between py-1 border-b border-gray-200 last:border-0">
    <span className="text-m font-bold text-gray-800 w-16">{time}</span>
    <span className="text-m text-gray-600 flex-1">{activity}</span>
    <ChevronRight size={18} className="text-gray-400" />
  </div>
);

const Dashboard = () => {
  return (
    <div className="w-full p-2 space-y-6">
      {/* 1. ชื่อหอพัก */}
      <div className="inline-block bg-orange-400 text-black px-4 py-1 rounded-lg font-bold shadow-sm">
        หอพักนิตยวดี
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* 2. Welcome Banner (ฝั่งซ้าย) */}
        <div className="col-span-12 lg:col-span-6 rounded-3xl p-8 relative overflow-hidden shadow-sm h-48 flex flex-col justify-center">
          <div className=" relative z-10">
            <h2 className="text-gray-600 font-medium ">ยินดีต้อนรับ คุณ xxx</h2>
            <h1 className="text-2xl font-bold text-gray-800 mt-4">
              วันอังคาร ที่ 18 พฤศจิกายน 2568
            </h1>
          </div>
          {/* ตกแต่งด้วยรูปภาพเมืองด้านหลังตามดีไซน์ */}
          <div className="absolute right-0 -top-2.5  opacity-80">
             <img src={dashPic} />
          </div>
        </div>

        {/* 3. Schedule (ฝั่งขวา) */}
        <div className="col-span-12 lg:col-span-6 bg-white rounded-3xl px-6 py-2 shadow-sm border border-gray-200">
          <div className="space-y-1">
            <ScheduleItem time="08:30" activity="ห้อง 411 ทำความสะอาด" />
            <ScheduleItem time="10:00" activity="ห้อง 309 ย้ายเข้า" />
            <ScheduleItem time="14:30" activity="ห้อง 103 ซ่อมประตูมุ้งลวด" />
            <ScheduleItem time="17:00" activity="ซ่อมหน้าต่างส่วนกลาง" />
          </div>
        </div>
      </div>

      {/* 4. ข้อมูลสรุป (Stats Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="อัตราการเข้าพัก" value="87.5%" icon={Home} colorClass="bg-green-300" />
        <StatCard label="ห้องจอง" value="5 ห้อง" icon={Calendar} colorClass="bg-yellow-300" />
        <StatCard label="ห้องค้างชำระ" value="3 ห้อง" icon={BanknoteX} colorClass="bg-red-300" />
        <StatCard label="ห้องว่าง" value="12 ห้อง" icon={DoorOpen} colorClass="bg-orange-300" />
      </div>

      {/* 5. กราฟ (Placeholder) */}
      <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
        <h3 className="font-bold text-gray-800 mb-4">Property Overview</h3>
        <div className="h-64 w-full bg-gray-50 rounded-xl flex items-center justify-center border-2 border-dashed border-gray-200">
          <p className="text-gray-400 italic text-sm">ส่วนแสดงผลกราฟ Chart.js หรือ Recharts</p>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;