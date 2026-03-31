import React from 'react';
import logoImg from '../assets/logo.png'; 

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

const parseMeterInfo = (detailStr) => {
  if (!detailStr || typeof detailStr !== 'string') return null;
  try {
    const match = detailStr.match(/(\d+(?:\.\d+)?)\s*-\s*(\d+(?:\.\d+)?)\s*=\s*(\d+(?:\.\d+)?)/);
    const rateMatch = detailStr.match(/\*\s*([\d.]+)/);
    if (match) {
      return { prv: match[1], cur: match[2], diff: match[3], rate: rateMatch ? rateMatch[1] : "0" };
    }
  } catch (e) { console.error(e); }
  return null;
};

// 💡 1. ปรับ py-5 เป็น py-3 เพื่อลดช่องว่างบน-ล่างให้กระชับขึ้น
const ReceiptHalf = ({ isCopy, items, roomNumber, apt, cst, ctc, adminName, total, billTitle }) => {
  const printDate = new Date().toLocaleDateString('th-TH', { year: 'numeric', month: '2-digit', day: '2-digit' });

  return (
    <div className="w-full h-full flex flex-col box-border bg-white text-black px-8 py-3">
      
      {/* --- หัวบิล --- */}
      <div className="flex justify-between items-start mb-2 border-b border-gray-200 pb-2 shrink-0">
        <div className="flex items-center gap-3 w-[55%]">
          <img 
            src={logoImg} 
            alt="Logo" 
            className="w-10 h-10 object-contain grayscale opacity-90"
            onError={(e) => { e.target.style.display = 'none'; }} 
          />
          <div className="leading-tight">
            <h1 className="text-[16px] font-black">{apt.name}</h1>
            <p className="text-[10px] text-gray-700">{apt.address}</p>
            <p className="text-[10px] text-gray-700">โทร. {apt.phone} | อีเมล. {apt.email || "-"}</p>
          </div>
        </div>

        <div className="w-[45%] flex items-center justify-end gap-3 leading-tight">
          <div className="text-right">
            <h2 className="text-[16px] font-black">{isCopy ? `${billTitle} (สำเนา)` : billTitle}</h2>
            <div className="flex flex-col items-end text-[10px] text-gray-800 space-y-0.5">
              <span><b className="font-bold">รอบบิล:</b> {ctc.cycleStart} - {ctc.cycleEnd}</span>
              <span><b className="font-bold">วันที่พิมพ์:</b> {printDate}</span>
            </div>
          </div>
          <div className="flex flex-col items-center border-2 border-black px-2 py-0.5 rounded bg-gray-50 min-w-[65px]">
            <span className="font-bold text-[9px]">ห้อง (Room)</span>
            <span className="text-[20px] font-black leading-none">{roomNumber}</span>
          </div>
        </div>
      </div>

      {/* --- ข้อมูลลูกค้า --- */}
      <div className="text-[11px] text-gray-800 border-b border-gray-300 pb-2 mb-2 shrink-0">
        <div className="flex justify-between">
          <div>
            <span className="font-bold">ลูกค้า:</span> {cst.title || ""}{cst.firstName || "-"} {cst.lastName || ""} 
            <span className="font-bold ml-4">โทร:</span> {cst.phone || "-"}
          </div>
        </div>
        <div className="mt-0.5"><span className="font-bold">ที่อยู่:</span> {cst.address || "-"}</div>
      </div>

      {/* --- ตารางรายการ --- */}
      <div className="w-full flex-1 min-h-[50px]">
        <table className="w-full border-collapse text-[11px]">
          <thead>
            <tr className="border-b-2 border-black">
              <th className="py-1 w-10 text-center font-bold">ลำดับ</th>
              <th className="py-1 px-2 text-left font-bold">รายการ (Description)</th>
              <th className="py-1 w-16 text-center font-bold">จำนวน</th>
              <th className="py-1 w-24 text-right pr-4 font-bold">ราคา/หน่วย</th>
              <th className="py-1 w-24 text-right px-1 font-bold">รวมเงิน</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, idx) => {
              const meter = parseMeterInfo(item.detail);
              let labelName = item.label || 'รายการทั่วไป';
              if (item.type === 'rent') labelName = 'ค่าเช่าห้อง';
              if (item.type === 'discount') labelName = 'ส่วนลด';

              if (item.type === 'electric') {
                 let detail = item.detail || "";
                 detail = detail.replace(/ไฟ:\s*/, "").replace(/\(มิเตอร์:\s*/, "(");
                 labelName = detail ? `ค่าไฟฟ้า ${detail}` : `ค่าไฟฟ้า`;
              }
              if (item.type === 'water') {
                 let detail = item.detail || "";
                 detail = detail.replace(/น้ำ:\s*/, "").replace(/\(มิเตอร์:\s*/, "(");
                 labelName = detail ? `ค่าน้ำประปา ${detail}` : `ค่าน้ำประปา`;
              }

              return (
                <tr key={item.id || idx} className="border-b border-gray-100">
                  <td className="py-1 text-center text-gray-500">{idx + 1}</td>
                  <td className="py-1 px-2">
                    <span className="font-bold">{labelName}</span>
                  </td>
                  <td className="py-1 text-center">{meter ? meter.diff : (item.type === 'discount' ? "-" : "1")}</td>
                  <td className="py-1 text-right pr-4">{meter ? Number(meter.rate).toLocaleString() : Math.abs(item.amount || 0).toLocaleString()}</td>
                  <td className="py-1 px-1 text-right font-bold">
                    {item.type === 'discount' && "-"} {Math.abs(item.amount || 0).toLocaleString(undefined, {minimumFractionDigits: 2})}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* --- Footer (ยอดรวม & ข้อมูลโอนเงิน) --- */}
      <div className="shrink-0 mt-2">
        <div className="flex border-2 border-black text-[12px] rounded-sm overflow-hidden h-[30px]">
          <div className="flex-1 px-4 flex items-center bg-gray-50 font-bold italic text-gray-700 border-r-2 border-black">
            ยอดเงินสุทธิ {bahtText(total)}
          </div>
          <div className="w-40 px-4 flex items-center justify-end font-black text-[16px] text-black bg-gray-100">
            {total.toLocaleString(undefined, {minimumFractionDigits: 2})}
          </div>
        </div>

        <div className="flex justify-between items-end mt-2 text-[10px]">
          <div className="w-[65%] border border-gray-200 rounded px-3 py-2 bg-gray-50 leading-tight">
            <p className="font-bold text-black mb-1">ชำระเงินผ่านบัญชีธนาคาร</p>
            <p>{apt.bankName || "ธนาคารกสิกรไทย สาขาถนนสวรรค์วิถี"}</p>
            <p className="font-black text-[13px] tracking-wider text-black mt-0.5">{apt.bankAccNo || "XXX-X-XXXXX-X"}</p>
            <p className="mt-0.5">ชื่อบัญชี: {apt.name} | Line: {apt.lineId || "-"}</p>
          </div>

          <div className="w-[30%] text-center pb-1">
            <div className="border-b border-black border-dashed mb-1 w-full mx-auto"></div>
            <p className="font-bold text-black text-[11px]">( {adminName} )</p>
            <p className="text-[9px] text-gray-500 mt-0.5">ผู้รับเงิน / ผู้ออกบิล</p>
          </div>
        </div>
      </div>
    </div>
  );
};

const BillMonthlyPrintTemplate = ({ 
  items = [], roomNumber = "-", apartmentInfo = null, 
  customerInfo = null, contractInfo = null, adminName = "-", total = 0, 
  billTitle = "ใบแจ้งหนี้ / ใบเสร็จรับเงิน" 
}) => {
  const apt = apartmentInfo || { 
    name: "หอพักนิตยวดี", 
    address: "63/246 ถนน ดาวดึงส์ อ.เมือง นครสวรรค์ 70000", 
    phone: "0867439033", 
    lineId: "@075fbmzv", 
    email: "seniordorm.2025@gmail.com",
    bankName: "ธนาคารกสิกรไทย สาขาถนนสวรรค์วิถี",
    bankAccNo: "XXX-X-XXXXX-X"
  };
  const cst = customerInfo || { title: "", firstName: "-", lastName: "-", phone: "-", nin: "-", address: "-" };
  const ctc = contractInfo || { billId: "-", cycleStart: "-", cycleEnd: "-" };

  return (
    <>
      <style>{`
        @media print {
          @page { 
            size: A4 portrait; 
            margin: 0; /* ล้างขอบที่ Browser ชอบแถมมา */
          }
          body, html { 
            margin: 0 !important; 
            padding: 0 !important; 
            background: white !important; 
            -webkit-print-color-adjust: exact;
          }
        }
      `}</style>

      {/* 💡 2. เปลี่ยนมาใช้ขนาดที่เซฟสุดๆ คือกว้าง 100% แต่สูงไม่เกิน 290mm (กันทะลุ) */}
      <div className="hidden print:flex print:flex-col w-full max-w-[210mm] mx-auto h-[290mm] overflow-hidden bg-white box-border text-black">
        
        {/* ครึ่งบน: สูง 145mm (รวม 2 ครึ่ง = 290mm ห่างจากขอบ A4 เล็กน้อย) */}
        <div className="w-full h-[145mm] border-b border-dashed border-gray-400 overflow-hidden box-border">
          <ReceiptHalf 
            isCopy={false} 
            items={items} 
            roomNumber={roomNumber} 
            apt={apt} 
            cst={cst} 
            ctc={ctc} 
            adminName={adminName} 
            total={total} 
            billTitle={billTitle} 
          />
        </div>

        {/* ครึ่งล่าง: สูง 145mm */}
        <div className="w-full h-[145mm] overflow-hidden box-border">
          <ReceiptHalf 
            isCopy={true} 
            items={items} 
            roomNumber={roomNumber} 
            apt={apt} 
            cst={cst} 
            ctc={ctc} 
            adminName={adminName} 
            total={total} 
            billTitle={billTitle} 
          />
        </div>

      </div>
    </>
  );
};

export default BillMonthlyPrintTemplate;