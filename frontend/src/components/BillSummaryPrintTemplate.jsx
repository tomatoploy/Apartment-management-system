import React from 'react';
import logoImg from '../assets/logo.png';

const BillSummaryPrintTemplate = ({ rooms = [], selectedDate = "" }) => {
  const printDate = new Date().toLocaleDateString('th-TH', { year: 'numeric', month: '2-digit', day: '2-digit' });
  const printTime = new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
  
  const [year, month] = selectedDate.split("-");
  const monthNames = ["มกราคม","กุมภาพันธ์","มีนาคม","เมษายน","พฤษภาคม","มิถุนายน","กรกฎาคม","สิงหาคม","กันยายน","ตุลาคม","พฤศจิกายน","ธันวาคม"];
  const thaiMonth = `${monthNames[Number(month) - 1]} ${Number(year) + 543}`;

  const grandTotal = rooms.reduce((sum, r) => sum + (r.total || 0), 0);

  return (
    <>
      <style>{`
        @media print {
          @page { 
            size: A4 portrait; 
            margin: 0 !important; /* ลบขอบขาวของเบราว์เซอร์ เพื่อใช้ Padding ของเราเอง */
          }
          body { 
            margin: 0 !important; 
            padding: 0 !important; 
            background: white; 
          }
        }
      `}</style>
      
      {/* ✨ ล็อกความกว้าง 210mm (A4) + mx-auto (กึ่งกลาง) + Padding ซ้ายขวาให้เหมือนระยะขอบกระดาษ */}
      <div className="hidden print:block w-[210mm] min-h-[297mm] mx-auto bg-white text-gray-800 px-12 py-12 box-border">
        
        {/* ── Header ── */}
        <div className="flex justify-between items-end border-b-2 border-black pb-4 mb-6">
          <div className="flex items-center gap-4">
            <img src={logoImg} alt="Logo" className="w-12 h-12 object-contain grayscale opacity-90" />
            <div>
              {/* ✨ ปรับขนาดฟอนต์ให้พอดี ไม่ใหญ่ตะโกน */}
              <h1 className="text-[18px] font-black text-black tracking-tight">ใบสรุปยอดเรียกเก็บประจำเดือน</h1>
              <p className="text-[14px] text-gray-600 mt-1">ประจำเดือน: <span className="font-bold text-black">{thaiMonth}</span></p>
            </div>
          </div>
          <div className="text-right text-[12px] text-gray-500 space-y-1">
            <p>จำนวนห้องที่เลือก: <span className="font-bold text-black">{rooms.length} ห้อง</span></p>
            <p>พิมพ์เมื่อ: {printDate} เวลา {printTime}</p>
          </div>
        </div>

        {/* ── Table ── */}
        <table className="w-full text-[13px] border-collapse">
          <thead>
            <tr className="border-b border-gray-300">
              <th className="py-2 px-2 text-center font-bold text-gray-500">ลำดับ</th>
              <th className="py-2 px-2 text-center font-bold text-black">ห้อง</th>
              <th className="py-2 px-2 text-left font-bold text-gray-500">ชื่อผู้เช่า</th>
              <th className="py-2 px-2 text-right font-bold text-gray-500">ค่าเช่า</th>
              <th className="py-2 px-2 text-right font-bold text-gray-500">ค่าน้ำ</th>
              <th className="py-2 px-2 text-right font-bold text-gray-500">ค่าไฟ</th>
              <th className="py-2 px-2 text-right font-bold text-gray-500">อื่นๆ</th>
              <th className="py-2 px-2 text-right font-black text-black">รวมสุทธิ</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {rooms.map((room, idx) => (
              <tr key={room.roomNumber} className={!room.hasBill ? "opacity-50" : ""}>
                <td className="py-2 px-2 text-center text-gray-400">{idx + 1}</td>
                <td className="py-2 px-2 text-center font-black text-black">{room.roomNumber}</td>
                <td className="py-2 px-2 text-left text-gray-600">{room.tenantFirstName || "-"}</td>
                <td className="py-2 px-2 text-right text-gray-600">{room.rent ? room.rent.toLocaleString() : "-"}</td>
                <td className="py-2 px-2 text-right text-gray-600">{room.water ? room.water.toLocaleString() : "-"}</td>
                <td className="py-2 px-2 text-right text-gray-600">{room.electric ? room.electric.toLocaleString() : "-"}</td>
                <td className="py-2 px-2 text-right text-gray-600">{(room.other - room.discount) ? (room.other - room.discount).toLocaleString() : "-"}</td>
                <td className="py-2 px-2 text-right font-bold text-black bg-gray-50/50">
                  {room.hasBill ? room.total.toLocaleString(undefined, {minimumFractionDigits: 2}) : "ไม่มีบิล"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* ── Summary Footer ── */}
        <div className="mt-8 flex justify-end">
          <div className="w-[300px] border-t-2 border-black pt-3">
            <div className="flex justify-between items-center">
              <span className="text-[14px] text-gray-600 font-bold">ยอดรวมทั้งสิ้น (Grand Total)</span>
              {/* ✨ ปรับฟอนต์ยอดรวมให้ดูสวยงาม */}
              <span className="text-[18px] font-black text-black">{grandTotal.toLocaleString(undefined, {minimumFractionDigits: 2})} ฿</span>
            </div>
          </div>
        </div>

      </div>
    </>
  );
};

export default BillSummaryPrintTemplate;