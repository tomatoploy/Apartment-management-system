import React from "react";
import { useNavigate, useLocation } from "react-router-dom";

const RoomHeader = ({ roomNumber, children }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems = [
    { id: "main", label: "หน้าหลัก", path: `/rooms/${roomNumber}` },
    { id: "bill", label: "บิล", path: `/rooms/billings/${roomNumber}` },
    { id: "request", label: "การแจ้ง", path: `/rooms/request/${roomNumber}` },
    { id: "moveout", label: "การย้ายออก", path: `/moveout/${roomNumber}` },
    { id: "booking", label: "จองห้อง", path: `/rooms/reserve/${roomNumber}` },
  ];

  return (
    <>
      <h1 className="text-3xl font-bold text-center mb-8 text-gray-800">
        ห้อง {roomNumber}
      </h1>

      {/*2 แถบเมนู (Tabs) */}
      <div className=" bg-white ">
        <div className="flex bg-gray-100 p-1 rounded-2xl w-full max-w-3xl mx-auto overflow-x-auto no-scrollbar">
          {/* ส่วนที่วนลูป menuItems ในไฟล์ RoomHeader.jsx */}
          {menuItems.map((item) => {
            // 1. เช็คว่า Path ปัจจุบันคือหน้า Add Tenant หรือไม่
            const isAddTenantPage = location.pathname.includes("add-tenant");

            // 2. ปรับ Logic การเช็ค Active:
            // - ถ้าเป็นเมนู main ให้สว่างเมื่ออยู่ที่ Path หลัก หรือหน้า Add Tenant
            // - ถ้าเป็นเมนูอื่น ให้เช็คตาม Path ปกติ
            const isActive =
              item.id === "main"
                ? location.pathname === item.path || isAddTenantPage
                : location.pathname === item.path;

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

      {/* 3. จุดสำคัญ: ส่วนที่ใช้แสดงข้อมูลจาก (children) */}
      <div className="p-2">{children}</div>
    </>
  );
};

export default RoomHeader;
