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

import { useState, useEffect } from "react";
import { NavLink, useNavigate } from "react-router-dom";

const MenuItem = ({ icon: Icon, text, to, collapsed, onClick }) => (
  <NavLink
    to={to}
    onClick={onClick} // เพิ่ม onClick เพื่อปิด Sidebar บนมือถือเมื่อกดเลือกเมนู
    className={({ isActive }) => `
      flex items-center gap-3 p-3 cursor-pointer transition-all duration-200
      ${isActive 
        ? "bg-[#fedeb8] border-r-4 border-[#8e5f12]" 
        : "hover:bg-[#FFEDD5]" 
      }
    `}
  >
    <Icon size={20} className="text-black" />
    {!collapsed && (
      <span className="text-[18px] text-black font-medium">{text}</span>
    )}
  </NavLink>
);

const Sidebar = ({ isCollapsed, setIsCollapsed, onLogout, onItemClick }) => {
  const navigate = useNavigate();
  const [profileImage, setProfileImage] = useState(null);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const mockDbImage = "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200";
        setProfileImage(mockDbImage);
      } catch (error) {
        console.error("Error fetching user image:", error);
      }
    };
    fetchUserData();
  }, []);

  return (
    <aside
      className={`
        /* ส่วนที่แก้ไขเพื่อให้ซ่อนบนมือถือ */
        flex flex-col justify-between border-r border-orange-100 transition-all duration-300 bg-[#FFF7ED]
        
        /* บนมือถือ: ความกว้างคงที่เพื่อให้แสดงเมนูครบ และความสูงเต็มจอ */
        h-[calc(100vh-64px)] w-64
        
        /* บนคอมพิวเตอร์ (lg:): ปรับความกว้างตามสถานะ isCollapsed */
        lg:w-${isCollapsed ? "20" : "64"}
      `}
    >
      {/* ปุ่มลูกศรย่อขยาย: ซ่อนไว้บนมือถือ (hidden) และแสดงเฉพาะบนคอม (lg:block) */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="hidden lg:block absolute top-4 right-4 p-1 rounded hover:bg-orange-200 transition"
      >
        <ChevronLeft
          size={20}
          className={`text-black transition-transform ${isCollapsed ? "rotate-180" : ""}`}
        />
      </button>

      <div>
        {/* Profile Section */}
        <div className={`flex justify-center pt-12 py-8 transition-all ${isCollapsed ? "lg:scale-60" : ""}`}>
          <div className="w-24 h-24 bg-[#cbd5e1] rounded-full flex items-center justify-center overflow-hidden border-4 border-white shadow-md relative">
            {profileImage ? (
              <img src={profileImage} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <svg className="w-full h-full text-[#475569] mt-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M24 20.993V24H0v-2.996A14.977 14.977 0 0112.004 15c4.904 0 9.26 2.354 11.996 5.993zM16.002 8.999a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            )}
          </div>
        </div>

        {/* Menu Items */}
        <nav className="flex flex-col">
          {[
            { icon: LayoutDashboard, text: "Dashboard", to: "/dashboard" },
            { icon: Building2, text: "ผังห้อง", to: "/rooms" },
            { icon: Droplets, text: "มิเตอร์น้ำ-ไฟ", to: "/meters" },
            { icon: Receipt, text: "ออกบิล", to: "/billings" },
            { icon: Package, text: "พัสดุ", to: "/parcels" },
            { icon: BellRing, text: "การแจ้ง", to: "/request" },
            { icon: Settings, text: "การตั้งค่า", to: "/settings" },
          ].map((item) => (
            <MenuItem
              key={item.to}
              icon={item.icon}
              text={item.text}
              to={item.to}
              collapsed={isCollapsed}
              onClick={onItemClick} // เรียกฟังก์ชันปิด Sidebar บนมือถือ
            />
          ))}
        </nav>
      </div>

      {/* Logout Button */}
      <div className="p-4 bg-[#FFF7ED]">
        <button
          onClick={() => {
            if (onItemClick) onItemClick(); // ปิด Sidebar บนมือถือ
            navigate("/login");
          }}
          className="flex items-center gap-2 p-3 w-full text-[18px] rounded-lg bg-[#F5A623] hover:bg-[#E2951B] text-white transition-all justify-center"
        >
          <LogOut size={18} strokeWidth={3} />
          {/* บนมือถือจะแสดงข้อความเสมอ ส่วนบนคอมจะแสดงตามสถานะ isCollapsed */}
          <span className={`${isCollapsed ? "lg:hidden" : "block"}`}>Log out</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;