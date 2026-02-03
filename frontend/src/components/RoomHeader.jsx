import React from "react";
import { useNavigate, useLocation } from "react-router-dom";

const RoomHeader = ({ roomNumber, children }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems = [
    { id: "main", label: "หน้าหลัก", path: `/rooms/${roomNumber}` },
    { id: "bill", label: "บิล", path: `/billings/${roomNumber}` },
    { id: "request", label: "การแจ้ง", path: `/request/${roomNumber}` },
    { id: "moveout", label: "การย้ายออก", path: `/moveout/${roomNumber}` },
    { id: "booking", label: "จองห้อง", path: `/booking/${roomNumber}` },
  ];

  return (
      <div className="bg-white min-h-screen">
      <div className="max-w-7xl mx-auto bg-white rounded-3xl p-6 shadow-lg border border-gray-200">
        <h1 className="text-3xl font-bold text-center mb-8 text-gray-800">
        ห้อง {roomNumber}
      </h1>

        {/*2 แถบเมนู (Tabs) */}
        <div className=" bg-gray-50/50 ">
          <div className="flex bg-gray-100 p-1 rounded-2xl w-full max-w-3xl mx-auto overflow-x-auto no-scrollbar">
            {menuItems.map((item) => {
              // เช็ค Active จาก URL Path
              const isActive = location.pathname === item.path;
              
              return (
                <button
                  key={item.id}
                  onClick={() => navigate(item.path)}
                  className={`flex-1 px-4 py-2.5 rounded-xl font-bold transition-all whitespace-nowrap text-sm sm:text-base ${
                    isActive
                      ? "bg-[#f3a638] text-white shadow-md"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* 3. จุดสำคัญ: ส่วนที่ใช้แสดงข้อมูลจาก RoomDetail (children) */}
        <div className="p-6 md:p-10">
          {children}
        </div>

      </div>
    
    </div>
  );
};

export default RoomHeader;