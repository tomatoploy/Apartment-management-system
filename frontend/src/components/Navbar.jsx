import { Bell, Home, Menu } from 'lucide-react'; // เพิ่ม Menu icon
import logoImg from '../assets/AMS-logo.png';
import { useNavigate } from "react-router-dom";

const Navbar = ({ onMenuClick }) => { // รับ props onMenuClick
const navigate = useNavigate();
  return (
    <nav className="print:hidden h-16 bg-[#F5A623] flex items-center justify-between px-6 shadow-md fixed w-full top-0 z-50">
      {/* Left side: Menu Button & Logo */}
      <div className="flex items-center gap-2">
        <div className="bg-[#F5A623] p-1 rounded">
          <img 
            src={logoImg} 
            alt="AMS Logo" 
            className="w-14 h-auto object-contain" 
          />
        </div>
        {/* ซ่อนข้อความยาวๆ บนมือถือเพื่อไม่ให้เบียดกันเกินไป (Optional) */}
        <div className="hidden sm:block"> 
          <h2 className="font-bold text-[20px] leading-none">AMS</h2>
          <p className="text-[13px]">Apartment Management System</p>
        </div>
        {/* แสดงเฉพาะตัวย่อบนมือถือเล็กๆ */}
        <div className="sm:hidden">
          <h2 className="font-bold text-[20px]">AMS</h2>
        </div>
      </div>

      {/* Right side: Icons */}
      <div className="flex gap-4">
        <Home className="cursor-pointer hover:opacity-80" size={24} 
        onClick={() => navigate("/dashboard")} />
        {/* ปุ่ม Menu แสดงเฉพาะมือถือ (lg:hidden) */}
        <button 
          onClick={onMenuClick}
          className=" hover:bg-[#e89a1d]  lg:hidden transition-colors "
        >
          <Menu size={24} className="text-gray-800" />
        </button>
      </div>
    </nav>
  );
};

export default Navbar;