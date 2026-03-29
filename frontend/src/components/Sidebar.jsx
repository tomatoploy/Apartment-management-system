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
  User,
  Edit
} from "lucide-react";

import { useState, useEffect, useRef } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { ConfirmModal } from "./ActionButtons";
import Profile from "../assets/userImage.jpg"


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
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false); // State สำหรับเปิด Dropdown
  const dropdownRef = useRef(null); // Ref สำหรับตรวจจับการคลิกด้านนอก

  useEffect(() => {
    const fetchUserData = async () => {
  try {
    // แก้ไข: เปลี่ยนจาก URL ภายนอก เป็น Path ของไฟล์ในโปรเจกต์
    // หากไฟล์อยู่ที่ public/images/profile.jpg ให้ใช้ path "/images/profile.jpg"
    const mockDbImage = Profile;
    
    setProfileImage(mockDbImage);
  } catch (error) {
    console.error("Error fetching user image:", error);
  }
};
fetchUserData();

    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  //logout
  useEffect(() => {
  const token = localStorage.getItem("token");
  if (!token) {
    navigate("/login", { replace: true });
  }
}, [navigate]);

  return (
    <>
    <aside
      className={`
        /* ส่วนที่แก้ไขเพื่อให้ซ่อนบนมือถือ */
        flex flex-col justify-between border-r border-orange-100 transition-all duration-300 bg-[#FFF7ED]
        
        /* บนมือถือ: ความกว้างคงที่เพื่อให้แสดงเมนูครบ และความสูงเต็มจอ */
        h-[calc(100vh-64px)] w-64
        
        /* บนคอมพิวเตอร์ (lg:): ปรับความกว้างตามสถานะ isCollapsed */
        lg:w-${isCollapsed ? "20" : "64"}
       relative`}
    >
      {/* ปุ่มลูกศรย่อขยาย: ซ่อนไว้บนมือถือ (hidden) และแสดงเฉพาะบนคอม (lg:block) */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="hidden lg:block absolute top-4 right-4 p-1 z-50 rounded hover:bg-orange-200 transition"
      >
        <ChevronLeft
          size={20}
          className={`text-black transition-transform ${isCollapsed ? "rotate-180" : ""}`}
        />
      </button>

      <div>
        {/* Profile Section */}
        <div className={`flex justify-center pt-12 py-8 transition-all relative ${isCollapsed ? "lg:scale-60" : ""}`} ref={dropdownRef}>
          <div 
            onClick={() => setIsMenuOpen(!isMenuOpen)} // กดเพื่อสลับเปิด-ปิด
          className="w-24 h-24 bg-[#cbd5e1] rounded-full flex items-center justify-center overflow-hidden border-4 border-white shadow-md relative cursor-pointer">
            {profileImage ? (
              <img src={profileImage} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <User size={48} className="text-gray-500" />
            )}
          </div>
        {/* Dropdown Menu */}
          {isMenuOpen && (
            <div className="absolute top-10 left-2/3  mt-2 w-46  bg-white border border-gray-200 rounded-xl shadow-lg z-50 overflow-hidden  animate-in fade-in zoom-in duration-200">
              
              
              <button
                onClick={() => {
                  setIsMenuOpen(false);
                  if (onItemClick) onItemClick(); // ปิด Sidebar บนมือถือ
                  navigate("/settings/admin"); 
                }}
                className="w-full flex items-center gap-3 px-4 py-3 text-[15px] font-bold text-gray-700 hover:bg-gray-50 cursor-pointer"
              >
                แก้ไขข้อมูลแอดมิน
              </button>
            </div>
          )}
        </div>

        {/* Menu Items */}
        <nav className="flex flex-col">
          {[
            { icon: LayoutDashboard, text: "Dashboard", to: "/dashboard" },
            { icon: Building2, text: "ผังห้อง", to: "/rooms" },
            { icon: Droplets, text: "มิเตอร์น้ำ-ไฟ", to: "/meters" },
            { icon: Receipt, text: "สร้างบิล", to: "/billings" },
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
          onClick={() => setShowLogoutConfirm(true)}
          className="flex items-center gap-2 p-3 w-full text-[18px] rounded-lg bg-[#F5A623] hover:bg-[#E2951B] text-white transition-all justify-center"
        >
          <LogOut size={18} strokeWidth={3} />
          {/* บนมือถือจะแสดงข้อความเสมอ ส่วนบนคอมจะแสดงตามสถานะ isCollapsed */}
          <span className={`${isCollapsed ? "lg:hidden" : "block"}`}>Log out</span>
        </button>
        {/* เรียกใช้ ConfirmModal ที่คุณสร้างไว้ใน ActionButtons.jsx */}
      </div>
    </aside>
      <ConfirmModal
  isOpen={showLogoutConfirm}
  onClose={() => setShowLogoutConfirm(false)}
  onConfirm={() => {
    if (onItemClick) onItemClick(); 
    setShowLogoutConfirm(false);
    
    // แก้ไข: เพิ่ม { replace: true } เพื่อไม่ให้กด Back กลับมาได้
    navigate("/login", { replace: true }); 
  }}
  title="ยืนยันการออกจากระบบ"
  description="คุณแน่ใจใช่หรือไม่ว่าต้องการออกจากระบบ?"
  confirmText="ออกจากระบบ"
/>
      </>
  );
};

export default Sidebar;