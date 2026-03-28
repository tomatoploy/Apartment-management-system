import React from "react";

const TenantDashboard = ({ profile }) => {
//   if (!profile) {
//     return (
//       <div className="flex flex-col items-center justify-center h-screen bg-gray-50 p-6 text-center">
//         <div className="w-12 h-12 border-4 border-orange-400 border-t-transparent rounded-full animate-spin mb-4"></div>
//         <p className="font-bold text-gray-500 font-sarabun">กำลังดึงข้อมูลจาก LINE...</p>
//       </div>
//     );
//   }

//   useEffect(() => {
//     const initLiff = async () => {
//       try {
//         await liff.init({ liffId: "ใส่_ID_จริง_ตรงนี้" });
        
//         if (liff.isLoggedIn()) {
//           const profile = await liff.getProfile();
//           setLineProfile(profile);
//         } else {
//           // 💡 เพิ่มบรรทัดนี้: ถ้ายังไม่ Login ให้เด้งไปหน้า Login ของ LINE ทันที
//           liff.login(); 
//         }
//       } catch (err) {
//         console.error("LIFF Init Error", err);
//       }
//     };
//     initLiff();
//   }, []);

//   return (
//     <div className="min-h-screen bg-gray-100 font-sarabun p-4 md:p-8">
//       <div className="max-w-md mx-auto space-y-6 pt-10">
//         {/* Profile Card */}
//         <div className="bg-white rounded-[32px] p-6 shadow-sm border border-gray-100 flex items-center gap-4">
//           <img 
//             src={profile.pictureUrl || "https://cdn-icons-png.flaticon.com/512/1077/1077114.png"} 
//             className="w-16 h-16 rounded-full border-2 border-orange-400 shadow-sm" 
//             alt="profile" 
//           />
//           <div className="text-left">
//             <h1 className="text-xl font-black text-gray-800">สวัสดีคุณ {profile.displayName}</h1>
//             <p className="text-[10px] font-bold text-gray-400">ยินดีต้อนรับสู่ระบบหอพัก ✨</p>
//           </div>
//         </div>

//         {/* Menu Grid */}
//         <div className="grid grid-cols-2 gap-4">
//           <div className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm flex flex-col items-center gap-3">
//             <div className="text-3xl">📑</div>
//             <span className="font-black text-gray-700 text-sm">ดูใบแจ้งหนี้</span>
//           </div>

//           <div className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm flex flex-col items-center gap-3">
//             <div className="text-3xl">🛠️</div>
//             <span className="font-black text-gray-700 text-sm">แจ้งซ่อม</span>
//           </div>
          
//           <div className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm flex flex-col items-center gap-3 col-span-2">
//             <div className="text-3xl">📦</div>
//             <span className="font-black text-gray-700 text-sm">ตรวจสอบพัสดุ</span>
//           </div>
//         </div>

//         <p className="text-[10px] text-gray-400 text-center">LINE User ID: {profile.userId}</p>
//       </div>
//     </div>
//   );
};

export default TenantDashboard;