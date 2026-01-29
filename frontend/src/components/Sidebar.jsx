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

const MenuItem = ({ icon: Icon, text, to, collapsed }) => (
  <NavLink
    to={to}
    className={({ isActive }) => `
      flex items-center gap-3 p-3 cursor-pointer transition-all duration-200
      ${isActive 
        ? "bg-[#fedeb8] border-r-4 border-[#8e5f12]" // สีเมื่อ Active (เข้มขึ้น)
        : "hover:bg-[#FFEDD5]" // สีเมื่อ Hover
      }
    `}
  >
    {/* ไอคอนเปลี่ยนสีตามสถานะได้ถ้าต้องการ */}
    <Icon size={20} className="text-black" />
    {!collapsed && (
      <span className="text-[18px] text-black font-medium">{text}</span>
    )}
  </NavLink>
);

const Sidebar = ({
 // userProfileImage, เลิก props
  isCollapsed,
  setIsCollapsed,
  onLogout,
}) => {
  const navigate = useNavigate();

  // 2. สร้าง State สำหรับเก็บรูปภาพ
  const [profileImage, setProfileImage] = useState(null);

  // 3. ใช้ useEffect เพื่อดึงข้อมูลเมื่อ Component ถูกโหลด
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        // --- ส่วนจำลองการดึงข้อมูล (API Call) ---
        // const userId = localStorage.getItem('userId'); // ตัวอย่างการเอา ID
        // const response = await fetch(`https://api.example.com/users/${userId}`);
        // const data = await response.json();
        // setProfileImage(data.imageUrl); 

        // --- ตัวอย่าง Mock Data (ใช้ทดสอบได้เลย) ---
        
        // สมมติว่าดึงมาจาก DB แล้วได้ Link นี้มา
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
       {/* Profile Section */}
        <div
          className={`flex justify-center pt-12 py-8 transition-all ${isCollapsed ? "scale-60" : ""}`}
        >
          <div className="w-24 h-24 bg-[#cbd5e1] rounded-full flex items-center justify-center overflow-hidden border-4 border-white shadow-md relative">
            {/* 4. ใช้ State profileImage แทน Props */}
            {profileImage ? (
              <img
                src={profileImage}
                alt="Profile"
                className="w-full h-full object-cover"
              />
            ) : (
              // Default User Icon (แสดงระหว่างรอโหลด หรือถ้าไม่มีรูป)
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
            to="/dashboard"
            collapsed={isCollapsed}
    
          />
          <MenuItem
            icon={Building2}
            text="ผังห้อง"
            collapsed={isCollapsed}
            to="/rooms"
          />
          <MenuItem
            icon={Droplets}
            text="มิเตอร์น้ำ-ไฟ"
            collapsed={isCollapsed}
            to="/meters"
          />
          <MenuItem icon={Receipt} text="สร้างบิล" collapsed={isCollapsed} to="/billing" />
          <MenuItem icon={Package} text="พัสดุ" collapsed={isCollapsed} to="/parcels"/>
          <MenuItem icon={BellRing} text="การแจ้ง" collapsed={isCollapsed} to="/request" />
          <MenuItem icon={Settings} text="การตั้งค่า" collapsed={isCollapsed} to="/settings" />
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