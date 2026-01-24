import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import building from '../assets/buildingSetting.jpg'
import electric from '../assets/electricSetting.png'
import rental from '../assets/rentalSetting.png'

const Settings = () => {
  const navigate = useNavigate();

  // ข้อมูลเมนูตั้งค่า พร้อมระบุ path และรูปภาพพื้นหลัง
  const settingsMenu = [
    {
      id: 1,
      title: 'ข้อมูลหอพัก',
      path: '/settings/building-edit',
      bgImage: `url("${building}")`, // แก้ไข path รูปภาพจริงของคุณที่นี่
      bgColor: 'bg-[#c1e2ff]'
    },
    {
      id: 2,
      title: 'อัตราค่าไฟฟ้าและค่าน้ำประปา',
      path: '/settings/utility',
      bgImage: `url("${electric}")`,
      bgColor: 'bg-[#64C192]'
    },
    {
      id: 3,
      title: 'ค่าเช่าห้องพักและค่าบริการ',
      path: '/settings/rental',
      bgImage: `url("${rental}")`,
      bgColor: 'bg-[#e8c39a]'
    }
  ];

  return (
    /* คอนเทนเนอร์หลักที่ใช้ความสูงเต็มหน้าจอเพื่อไม่ให้เกิดสเปซขาวด้านล่าง */
    <div className="flex-1 bg-white min-h-[calc(100vh-64px)] flex flex-col font-kanit">

      {/* กล่องสีขาวมนครอบเนื้อหา (สไตล์เดียวกับที่ต้องการ) */}
      <div className="flex-1 bg-white rounded-3xl p-6 shadow-lg border border-gray-200  overflow-hidden">
        
        <h1 className="text-3xl font-bold text-center mb-8 text-gray-800">
            การตั้งค่า
        </h1>
        

        {/* รายการเมนูเรียงต่อกัน 3 อันแนวตั้ง */}
        <div className="flex-1 flex flex-col justify-center max-w-2xl mx-auto py-4 px-2 w-full space-y-8 overflow-y-auto pr-2">
          {settingsMenu.map((item) => (
            <div
              key={item.id}
              onClick={() => navigate(item.path)}
              className={`${item.bgColor} rounded-[35px] h-37 flex items-center justify-between px-10 cursor-pointer shadow-md hover:scale-[1.02] transition-all relative overflow-hidden group`}
            >
              {/* พื้นหลังรูปภาพที่แสดงด้านขวาตาม Figma */}
              <div 
                className="absolute inset-0 bg-right bg-no-repeat opacity-90 transition-transform duration-500 group-hover:scale-110"
                style={{ 
                  backgroundImage: item.bgImage, 
                  backgroundSize: 'contain',
                //   backgroundPosition: 'right' 
                }}
              />
              
              {/* ชื่อเมนู */}
              <h2 className="text-2xl font-bold text-[#0c4a6e] z-10">
                {item.title}
              </h2>
              
              {/* ปุ่มลูกศร */}
              <div className="z-10 bg-white/60 p-2 rounded-full text-[#0c4a6e] group-hover:bg-[#f3a638] group-hover:text-white transition-colors">
                <ChevronRight size={32} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Settings;