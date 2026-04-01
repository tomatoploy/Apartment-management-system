import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { ChevronDown } from "lucide-react";
import { ExitButton, RefreshButton } from "./ActionButtons";

const RoomHeader = ({ roomNumber, children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);

  const menuItems = [
    { id: "main", label: "หน้าหลัก", path: `/rooms/${roomNumber}` },
    { id: "booking", label: "จองห้อง", path: `/rooms/reserve/${roomNumber}` },
    { id: "contract", label: "สัญญา", path: `/rooms/contract/${roomNumber}` },
    { id: "bill", label: "บิล", path: `/rooms/billings/${roomNumber}` },
    { id: "request", label: "การแจ้ง", path: `/rooms/request/${roomNumber}` },
    {
      id: "moveout",
      label: "การย้ายออก",
      path: `/rooms/move-out/${roomNumber}`,
    },
  ];

  const isAddTenantPage = location.pathname.includes("add-tenant");

  const isItemActive = (item) => {
    return item.id === "main"
      ? location.pathname === item.path || isAddTenantPage
      : location.pathname === item.path;
  };

  const activeItem = menuItems.find((item) => isItemActive(item));

  const handleMenuClick = (path) => {
    navigate(path);
    setIsOpen(false);
  };

  return (
    <>
      <div className="relative mb-8 pt-2">
        <div className="absolute top-0 right-0">
          <ExitButton onClick={() => navigate("/rooms")} />
        </div>

        <h1 className="text-3xl font-bold text-center text-gray-800 m-0">
          ห้อง {roomNumber}
        </h1>
      </div>
      {/* Tabs Menu */}
      <div className="bg-white">
        {/* Desktop Version */}
        <div className="hidden sm:flex items-center justify-center gap-1 w-full max-w-4xl mx-auto px-2">
          <div className="flex flex-1 bg-gray-100 p-1 rounded-2xl overflow-x-auto no-scrollbar">
            {menuItems.map((item) => (
              <button
                key={item.id}
                onClick={() => navigate(item.path)}
                className={`flex-1 px-4 py-2.5 rounded-xl font-bold transition-all whitespace-nowrap text-sm sm:text-base ${
                  isItemActive(item)
                    ? "bg-[#f3a638] text-white shadow-md"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
          <RefreshButton />
        </div>

        {/* Mobile Version - Dropdown Menu */}
        <div className="sm:hidden px-2">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center justify-between px-4 py-2.5 bg-gray-100 rounded-2xl font-bold text-md transition-all"
              >
                <span className="text-gray-700">
                  {activeItem?.label || "เมนู"}
                </span>
                <ChevronDown
                  size={18}
                  className={`text-gray-500 transition-transform ${
                    isOpen ? "rotate-180" : ""
                  }`}
                />
              </button>

              {/* Dropdown Menu */}
              {isOpen && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-2xl shadow-lg z-50">
                  {menuItems.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => handleMenuClick(item.path)}
                      className={`w-full px-4 py-3 text-left font-semibold transition-all first:rounded-t-xl last:rounded-b-xl ${
                        isItemActive(item)
                          ? "bg-[#f3a638] text-white"
                          : "text-gray-700 hover:bg-gray-50"
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              )}

              {/* Overlay ปิด dropdown */}
              {isOpen && (
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setIsOpen(false)}
                />
              )}
            </div>
            <RefreshButton />
          </div>
        </div>
      </div>

      {/* Children Content */}
      <div className="p-2">{children}</div>
    </>
  );
};

export default RoomHeader;
