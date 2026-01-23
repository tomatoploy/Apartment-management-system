import { Bell, Home } from 'lucide-react';
import logoImg from '../assets/AMS-logo.png';


const Navbar = () => {
  return (
    <nav className="h-16 bg-[#F5A623] flex items-center justify-between px-6 shadow-md fixed w-full top-0 z-50">
      {/* Left side: Logo */}
      <div className="flex items-center gap-2">
        <div className="bg-[#F5A623] p-1 rounded">
          <img 
            src={logoImg} 
            alt="AMS Logo" 
            className="w-14 h-auto object-contain" 
          />
        </div>
        <div>
          <h2 className="font-bold text-[20px] leading-none">AMS</h2>
          <p className="text-[13px]">Apartment Management System</p>
        </div>
      </div>

      {/* Right side: Icons */}
      <div className="flex gap-4">
        <Bell className="cursor-pointer hover:opacity-80" size={24} />
        <Home className="cursor-pointer hover:opacity-80" size={24} />
      </div>
    </nav>
  );
};

export default Navbar;