import React from 'react';
import logoImg from '../assets/logo.png'; 
import { toThaiDate } from "./DateController";

const bahtText = (num) => {
  if (!num || isNaN(num)) return ' บาทถ้วน';
  const price = parseFloat(num).toFixed(2);
  const [integer, decimal] = price.split('.');
  const bahtTextEngine = (n_str) => {
    const number_text = ['ศูนย์', 'หนึ่ง', 'สอง', 'สาม', 'สี่', 'ห้า', 'หก', 'เจ็ด', 'แปด', 'เก้า'];
    const unit_text = ['', 'สิบ', 'ร้อย', 'พัน', 'หมื่น', 'แสน', 'ล้าน'];
    let text = '';
    for (let i = 0; i < n_str.length; i++) {
      let n = parseInt(n_str[i]);
      let unit = unit_text[n_str.length - i - 1];
      if (n !== 0) {
        if (n_str.length > 1 && n_str.length - i === 2 && n === 1) text += 'สิบ';
        else if (n_str.length > 1 && n_str.length - i === 2 && n === 2) text += 'ยี่สิบ';
        else if (n_str.length > 1 && i === n_str.length - 1 && n === 1) text += 'เอ็ด';
        else text += number_text[n] + unit;
      } else if (n_str.length - i === 7) text += unit;
    }
    return text;
  };
  let baht = bahtTextEngine(integer);
  let satang = bahtTextEngine(decimal);
  if (baht === '' && satang === '') return ' บาทถ้วน';
  if (baht !== '' && satang === '') return ` ${baht}บาทถ้วน`;
  if (baht === '' && satang !== '') return ` ${satang}สตางค์`;
  return `(-${baht}บาท${satang}สตางค์-)`;
};

const MoveOutHalf = ({ 
  isCopy, items, deposits, roomNumber, apt, cst, adminName, 
  totalExpenses, totalDeposit, netAmount, isRefund, mode, moveOutDate 
}) => {
  // 🌟 บังคับใช้วันที่ปัจจุบันแบบภาษาไทย
  const today = new Date();
  const printDate = toThaiDate(today.toISOString());
  const moveOutDisplayDate = moveOutDate ? toThaiDate(moveOutDate) : printDate;
  
  const titleText = mode === "absconded" ? "ใบสรุปรายการหนี้สูญ" : "ใบสรุปการย้ายออก / คืนเงินประกัน";

  return (
    <div className="w-full h-[144mm] flex flex-col box-border bg-white text-black px-10 py-4 overflow-hidden font-[Sarabun]">
      
      {/* Header Section */}
      <div className="flex justify-between items-start mb-2 border-b border-gray-200 pb-1">
        <div className="flex items-center gap-3 w-[50%]">
          <img 
            src={logoImg} 
            alt="Logo" 
            className="w-10 h-10 object-contain grayscale opacity-90"
            onError={(e) => { e.target.style.display = 'none'; }} 
          />
          <div className="leading-tight">
            <h1 className="text-[16px] font-black">{apt.name}</h1>
            <p className="text-[9px] text-gray-700">{apt.address}</p>
            <p className="text-[9px] text-gray-700">โทร. {apt.phone} | อีเมล. {apt.email}</p>
          </div>
        </div>

        <div className="w-[50%] flex items-center justify-end gap-2 leading-tight">
          <div className="text-right">
            <h2 className="text-[16px] font-black">{isCopy ? `${titleText} (สำเนา)` : titleText}</h2>
            <div className="flex flex-col items-end text-[9px] text-gray-800 space-y-0.5 mt-1">
              <span><b className="font-bold">วันที่ย้ายออก:</b> {moveOutDisplayDate}</span>
              <span><b className="font-bold">วันที่พิมพ์:</b> {printDate}</span>
            </div>
          </div>
          <div className="flex flex-col items-center border-2 border-black px-2 py-0.5 rounded bg-gray-50 min-w-[65px] ml-2">
            <span className="font-bold text-[9px]">ห้อง (Room)</span>
            <span className="text-[20px] font-black leading-none mt-0.5">{roomNumber}</span>
          </div>
        </div>
      </div>

      {/* Customer Info */}
      <div className="text-[11px] text-gray-800 border-b border-gray-300 pb-1 mb-2 mt-1">
        <div className="flex justify-between">
          <div>
            <span className="font-bold">ชื่อ:</span> {cst.title}{cst.firstName} {cst.lastName} 
            <span className="font-bold ml-4">โทร:</span> {cst.phone}
          </div>
        </div>
        <div className="mt-0.5"><span className="font-bold">ที่อยู่:</span> {cst.address}</div>
      </div>

      {/* Details Table */}
      <div className="flex-1 w-full overflow-hidden flex flex-col mt-1">
        <div className="flex flex-row w-full gap-4 h-full">
            
          {/* ฝั่งซ้าย: รายการค่าใช้จ่าย */}
          <div className="w-1/2 flex flex-col">
             <table className="w-full border-collapse text-[11px]">
               <thead>
                 <tr className="border-b-2 border-black text-left">
                   <th className="py-1 font-bold">รายการค่าใช้จ่าย / ยอดค้างชำระ</th>
                   <th className="py-1 w-20 text-right font-bold pr-2">จำนวนเงิน</th>
                 </tr>
               </thead>
               <tbody>
                 {items.map((item, idx) => (
                   <tr key={idx} className="border-b border-gray-100">
                     <td className="py-1">{item.label}</td>
                     <td className="py-1 text-right pr-2">{Number(item.amount).toLocaleString(undefined, {minimumFractionDigits: 2})}</td>
                   </tr>
                 ))}
                 <tr className="border-t border-black font-bold">
                    <td className="py-1 text-right pr-2">รวมค่าใช้จ่ายทั้งหมด</td>
                    <td className="py-1 text-right pr-2">{totalExpenses.toLocaleString(undefined, {minimumFractionDigits: 2})}</td>
                 </tr>
               </tbody>
             </table>
          </div>

          {/* ฝั่งขวา: เงินประกัน */}
          <div className="w-1/2 flex flex-col border-l border-gray-200 pl-4">
             <table className="w-full border-collapse text-[11px]">
               <thead>
                 <tr className="border-b-2 border-black text-left">
                   <th className="py-1 font-bold">รายการเงินประกัน</th>
                   <th className="py-1 w-20 text-right font-bold pr-2">จำนวนเงิน</th>
                 </tr>
               </thead>
               <tbody>
                 {mode === "absconded" ? (
                    <tr><td colSpan="2" className="py-2 text-center text-gray-400 italic">ไม่มีรายการเงินประกัน (ผู้เช่าหนี)</td></tr>
                 ) : deposits.length === 0 ? (
                    <tr><td colSpan="2" className="py-2 text-center text-gray-400 italic">ไม่มีรายการเงินประกัน</td></tr>
                 ) : (
                    deposits.map((dep, idx) => (
                        <tr key={idx} className="border-b border-gray-100">
                            <td className="py-1">{dep.label}</td>
                            <td className="py-1 text-right pr-2">{Number(dep.amount).toLocaleString(undefined, {minimumFractionDigits: 2})}</td>
                        </tr>
                    ))
                 )}
                 <tr className="border-t border-black font-bold">
                    <td className="py-1 text-right pr-2">รวมเงินประกัน</td>
                    <td className="py-1 text-right pr-2">{mode === "absconded" ? "0.00" : totalDeposit.toLocaleString(undefined, {minimumFractionDigits: 2})}</td>
                 </tr>
               </tbody>
             </table>

             {/* สรุปกล่องเล็กๆ ฝั่งขวา */}
             <div className="mt-auto mb-2 border border-gray-300 rounded p-2 bg-gray-50 text-[11px]">
                <div className="flex justify-between mb-1">
                    <span className="text-gray-600">หักค่าใช้จ่ายทั้งหมด</span>
                    <span className="font-bold">- {totalExpenses.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
                </div>
                <div className="flex justify-between border-t border-gray-300 pt-1 font-bold">
                    <span>{mode === "absconded" ? "ยอดหนี้สูญสุทธิ" : isRefund ? "ยอดคืนผู้เช่าสุทธิ" : "ผู้เช่าต้องชำระเพิ่ม"}</span>
                    <span>{Math.abs(netAmount).toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
                </div>
             </div>
          </div>

        </div>
      </div>

      {/* Footer Section */}
      <div className="mt-2 flex-none">
        <div className="flex border-2 border-black text-[12px] rounded-sm overflow-hidden h-[30px]">
          <div className="flex-1 px-4 flex items-center bg-gray-50 font-bold italic text-gray-700 border-r-2 border-black">
            ยอดเงินสุทธิ {bahtText(Math.abs(netAmount))}
          </div>
          <div className="w-40 px-4 flex items-center justify-end font-black text-[16px] text-black bg-gray-100">
            {Math.abs(netAmount).toLocaleString(undefined, {minimumFractionDigits: 2})}
          </div>
        </div>

        <div className="flex justify-between items-end mt-4 text-[10px]">
          {/* ลายเซ็นผู้รับเงิน */}
          <div className="w-[45%] text-center pb-1">
            <div className="border-b border-black border-dashed mb-1 w-[80%] mx-auto"></div>
            <p className="font-bold text-black text-[11px]">( {adminName} )</p>
            <p className="text-[10px] text-gray-500">ผู้รับเงิน / ผู้ตรวจสอบ</p>
          </div>

          {/* ลายเซ็นผู้เช่า */}
          {mode !== "absconded" && (
             <div className="w-[45%] text-center pb-1">
                <div className="border-b border-black border-dashed mb-1 w-[80%] mx-auto"></div>
                <p className="font-bold text-black text-[11px]">
                    ( {cst.firstName !== "-" ? `${cst.firstName} ${cst.lastName}` : "...................................."} )
                </p>
                <p className="text-[10px] text-gray-500">ผู้เช่า / ผู้รับเงินคืน</p>
             </div>
          )}
          {mode === "absconded" && <div className="w-[45%]"></div>}
        </div>
      </div>
    </div>
  );
};

const MoveOutPrintTemplate = ({ 
  items = [], deposits = [], roomNumber = "-", apartmentInfo = null, 
  tenantInfo = null, adminName = "-", moveOutDate, mode, netAmount, isRefund
}) => {
  
  // 🌟 บังคับค่า Default ให้เป็น Phet Ploy Place เสมอถ้าไม่มีข้อมูลส่งมา
  const apt = apartmentInfo?.name ? apartmentInfo : { 
    name: "Phet Ploy Place", 
    address: "63/246 ถนน ดาวดึงส์ อ.เมือง นครสวรรค์ 60000", 
    phone: "0867439033", 
    lineId: "@075fbmzv", 
    email: "seniordorm.2025@gmail.com"
  };

  // 🌟 ทะลวงหาข้อมูลลูกค้าขั้นสุด (ดักทั้งแบบมี .data ครอบ และตัวพิมพ์เล็ก/ใหญ่)
  let t = tenantInfo || {};
  if (t.data) t = t.data; // ถ้า API ห่อ .data มา ให้ปอกเปลือกออก
  if (t.$values) t = t.$values; 

  const fName = t.firstName || t.FirstName || t.name || t.Name || "";
  const lName = t.lastName || t.LastName || "";

  const cst = {
      title: t.title || t.Title || "",
      firstName: fName.trim() !== "" ? fName : "-",
      lastName: lName,
      phone: t.phone || t.Phone || "-",
      address: t.address || t.Address || "-"
  };
  
  const totalExpenses = items.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
  const totalDeposit = deposits.reduce((sum, dep) => sum + (Number(dep.amount) || 0), 0);

  return (
    <>
      <style>{`
        @media print {
          @page { size: A4 portrait; margin: 0 !important; }
          body { margin: 0 !important; padding: 0 !important; display: flex !important; justify-content: center !important; }
        }
      `}</style>

      <div className="hidden print:flex flex-col w-[210mm] h-[290mm] bg-white mx-auto relative overflow-hidden box-border border-x border-gray-100">
        <div className="flex-none h-[144mm]">
           <MoveOutHalf 
              isCopy={false} items={items} deposits={deposits} roomNumber={roomNumber} 
              apt={apt} cst={cst} adminName={adminName} totalExpenses={totalExpenses} 
              totalDeposit={totalDeposit} netAmount={netAmount} isRefund={isRefund} mode={mode} moveOutDate={moveOutDate}
           />
        </div>
        <div className="flex-none border-b border-dashed border-gray-400 w-full h-0"></div>
        <div className="flex-none h-[144mm]">
           <MoveOutHalf 
              isCopy={true} items={items} deposits={deposits} roomNumber={roomNumber} 
              apt={apt} cst={cst} adminName={adminName} totalExpenses={totalExpenses} 
              totalDeposit={totalDeposit} netAmount={netAmount} isRefund={isRefund} mode={mode} moveOutDate={moveOutDate}
           />
        </div>
      </div>
    </>
  );
};

export default MoveOutPrintTemplate;