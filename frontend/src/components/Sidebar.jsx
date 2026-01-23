import {
  LayoutDashboard,
  Building2,
  Droplets,
  Receipt,
  Package,
  BellRing,
  Settings,
  LogOut,
  ChevronLeft,
} from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

const MenuItem = ({ icon: Icon, text, onClick, active = false, collapsed }) => (
  <div
    onClick={onClick}
    className={`flex items-center gap-3 p-3 cursor-pointer transition-colors ease-in-out duration-200${
      active ? "bg-[#FFEDD5]" : "hover:bg-[#FFEDD5]"
    }`}
  >
    <Icon size={20} className="text-black" />
    {!collapsed && <span className="text-[18px]  text-black">{text}</span>}
  </div>
);

const Sidebar = ({
  userProfileImage,
  isCollapsed,
  setIsCollapsed,
  onLogout,
}) => {
  const navigate = useNavigate();
  return (
    <aside
      className={`${
        isCollapsed ? "w-20" : "w-64" // เปลี่ยนจาก collapsed เป็น isCollapsed
      } bg-[#FFF7ED] h-[calc(100vh-64px)] fixed left-0 top-16 flex flex-col justify-between border-r border-orange-100 z-40 transition-all duration-300`}
    >
      <button
        onClick={() => setIsCollapsed(!isCollapsed)} // ใช้ฟังก์ชันที่ส่งมาจาก Layout
        className="absolute top-4 right-4 p-1 rounded hover:bg-orange-200 transition"
      >
        <ChevronLeft
          size={20}
          className={`text-black transition-transform ${
            isCollapsed ? "rotate-180" : "" // เปลี่ยนเป็น isCollapsed
          }`}
        />
      </button>

      <div>
        {/* Profile Section - ปรับขนาดตามการย่อ */}
        <div
          className={`flex justify-center pt-12 py-8 transition-all ${isCollapsed ? "scale-60" : ""}`}
        >
          <div className="w-24 h-24 bg-[#cbd5e1] rounded-full flex items-center justify-center overflow-hidden border-4 border-white shadow-md relative">
            {userProfileImage ? (
              <img
                src={userProfileImage}
                alt="Profile"
                className="w-full h-full object-cover"
              />
            ) : (
              // Default User Icon สีเทาเข้ม
              <svg
                className="w-full h-full text-[#475569] mt-4"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M24 20.993V24H0v-2.996A14.977 14.977 0 0112.004 15c4.904 0 9.26 2.354 11.996 5.993zM16.002 8.999a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            )}
          </div>
        </div>

        {/* Menu Items - ส่ง isCollapsed ไปให้ MenuItem */}
        <nav className="flex flex-col">
          <MenuItem
            icon={LayoutDashboard}
            text="Dashboard"
            active
            collapsed={isCollapsed}
            onClick={() => navigate("/dashboard")}
          />
          <MenuItem
            icon={Building2}
            text="ผังห้อง"
            collapsed={isCollapsed}
            onClick={() => navigate("/rooms")}
          />
          <MenuItem
            icon={Droplets}
            text="มิเตอร์น้ำ-ไฟ"
            collapsed={isCollapsed}
          />
          <MenuItem icon={Receipt} text="สร้างบิล" collapsed={isCollapsed} />
          <MenuItem icon={Package} text="พัสดุ" collapsed={isCollapsed} />
          <MenuItem icon={BellRing} text="การแจ้ง" collapsed={isCollapsed} />
          <MenuItem icon={Settings} text="การตั้งค่า" collapsed={isCollapsed} />
        </nav>
      </div>

      {/* Logout Button */}
      <div className="p-4 bg-[#FFF7ED]">
        <button
          onClick={() => navigate("/login")} // ถ้ามี auth จริงในอนาคต → ค่อย clear token
          className="flex items-center gap-2 p-3 w-full text-[18px] rounded-lg bg-[#F5A623] hover:bg-[#E2951B] text-white transition-all justify-center"
        >
          <LogOut size={18} strokeWidth={3} />
          {!isCollapsed && <span>Log out</span>}
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
