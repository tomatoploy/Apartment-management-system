import { LayoutDashboard, Building2, Droplets, Receipt, Package, BellRing, Settings, LogOut, ChevronLeft, User, Edit} from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { ConfirmModal } from "./ActionButtons";
import Profile from "../assets/userImage.jpg";

const MenuItem = ({ icon: Icon, text, to, collapsed, onClick }) => (
  <NavLink
    to={to}
    onClick={onClick}
    className={({ isActive }) => `
      flex items-center gap-3 p-3 cursor-pointer transition-all duration-200
      ${isActive 
        ? "bg-[#fedeb8] border-r-4 border-[#8e5f12]" 
        : "hover:bg-[#FFEDD5]" 
      }
    `}
  >
    <Icon size={20} className="text-black" />
    <span className={`text-[18px] text-black font-medium ${collapsed ? 'lg:hidden' : 'block'}`}>
      {text}
    </span>
  </NavLink>
);

const Sidebar = ({ isCollapsed, setIsCollapsed, onLogout, onItemClick }) => {
  const navigate = useNavigate();
  const [profileImage, setProfileImage] = useState(null);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const fetchUserData = async () => {
        try {
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
        flex flex-col justify-between border-r border-orange-100 transition-all duration-300 bg-[#FFF7ED]
        h-[calc(100vh-64px)] 
        ${isCollapsed ? 'w-64 lg:w-20' : 'w-64'}
       relative `}
    >
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
        <div className={`flex justify-center pt-12 py-8 transition-all duration-300 relative`} ref={dropdownRef}>
          <div 
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className={`
              bg-[#cbd5e1] rounded-full flex items-center justify-center overflow-hidden border-4 border-white shadow-md relative cursor-pointer transition-all duration-300
              ${isCollapsed ? 'lg:w-12 lg:h-12 w-24 h-24' : 'w-24 h-24'}
            `}
          >
            {profileImage ? (
              <img src={profileImage} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <User size={isCollapsed ? 24 : 48} className="text-gray-500 transition-all duration-300" />
            )}
          </div>
        {/* Dropdown Menu */}
          {isMenuOpen && (
            <div className={`
              absolute mt-2 bg-white border border-gray-200 rounded-xl shadow-lg z-50 overflow-hidden animate-in fade-in zoom-in duration-200
              p-20 left-[60%] w-46'}
            `}>
              
              <button
                onClick={() => {
                  setIsMenuOpen(false);
                  if (onItemClick) onItemClick(); 
                  navigate("/settings/admin"); 
                }}
                className="w-full flex items-center gap-3 px-4 py-3 text-[15px] font-bold text-gray-700 hover:bg-gray-50 cursor-pointer text-left"
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
              onClick={onItemClick} 
            />
          ))}
        </nav>
      </div>

      {/* Logout Button */}
      <div className="p-4 bg-[#FFF7ED]">
        <button
          onClick={() => setShowLogoutConfirm(true)}
          className={`
            flex items-center gap-2 p-3 w-full rounded-lg bg-[#F5A623] hover:bg-[#E2951B] text-white transition-all 
            ${isCollapsed ? 'lg:justify-center justify-center' : 'justify-center'}
          `}
        >
          <LogOut size={18} strokeWidth={3} className="shrink-0" />
          <span className={`text-[18px] ${isCollapsed ? "lg:hidden block" : "block"}`}>Log out</span>
        </button>
      </div>
    </aside>
      <ConfirmModal
          isOpen={showLogoutConfirm}
          onClose={() => setShowLogoutConfirm(false)}
          onConfirm={() => {
            if (onItemClick) onItemClick(); 
            setShowLogoutConfirm(false);
            
            localStorage.removeItem("token");
            localStorage.removeItem("adminId"); 

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