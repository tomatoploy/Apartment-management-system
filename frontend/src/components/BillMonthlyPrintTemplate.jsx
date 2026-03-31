import React, { useEffect } from 'react';
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

const ReceiptHalf = ({ isCopy, items, roomNumber, apt, cst, ctc, adminName, total, billTitle }) => {
  const printDate = new Date().toLocaleDateString('th-TH', { year: 'numeric', month: '2-digit', day: '2-digit' });

  return (
    // 💡 ลด Padding เป็น px-6 py-3 เพื่อเพิ่มพื้นที่เนื้อหา
    <div className="w-full h-full flex flex-col box-border bg-white text-black px-6 py-3 overflow-hidden">
      
      {/* --- หัวบิล --- */}
      <div className="flex justify-between items-start mb-2 border-b border-gray-200 pb-1 shrink-0">
        <div className="flex items-center gap-2 w-[55%]">
          <img 
            src={logoImg} 
            alt="Logo" 
            className="w-8 h-8 object-contain grayscale opacity-90"
            onError={(e) => { e.target.style.display = 'none'; }} 
          />
          <div className="leading-tight">
            <h1 className="text-[14px] font-black">{apt.name}</h1>
            <p className="text-[8px] text-gray-700">{apt.address}</p>
            <p className="text-[8px] text-gray-700">โทร. {apt.phone} | อีเมล. {apt.email || "-"}</p>
          </div>
        </div>

        <div className="w-[45%] flex items-center justify-end gap-2 leading-tight">
          <div className="text-right">
            <h2 className="text-[14px] font-black">{isCopy ? `${billTitle} (สำเนา)` : billTitle}</h2>
            <div className="flex flex-col items-end text-[8px] text-gray-800 space-y-0.5 mt-0.5">
              <span><b className="font-bold">รอบบิล:</b> {ctc.cycleStart} - {ctc.cycleEnd}</span>
              <span><b className="font-bold">วันที่พิมพ์:</b> {printDate}</span>
            </div>
          </div>
          <div className="flex flex-col items-center border-[1.5px] border-black px-2 py-0.5 rounded bg-gray-50 min-w-[55px]">
            <span className="font-bold text-[8px]">ห้อง (Room)</span>
            <span className="text-[16px] font-black leading-none mt-0.5">{roomNumber}</span>
          </div>
        </div>
      </div>

      {/* --- ข้อมูลลูกค้า --- */}
      <div className="text-[10px] text-gray-800 border-b border-gray-300 pb-1 mb-2 shrink-0">
        <div className="flex justify-between">
          <div>
            <span className="font-bold">ลูกค้า:</span> {cst.title || ""}{cst.firstName || "-"} {cst.lastName || ""} 
            <span className="font-bold ml-4">โทร:</span> {cst.phone || "-"}
          </div>
        </div>
        <div className="mt-0.5"><span className="font-bold">ที่อยู่:</span> {cst.address || "-"}</div>
      </div>

      {/* --- ตารางรายการ --- */}
      <div className="flex-1 w-full overflow-hidden">
        {/* 💡 ลดขนาดตารางเป็น text-[10px] */}
        <table className="w-full border-collapse text-[10px]">
          <thead>
            <tr className="border-b-[1.5px] border-black">
              <th className="py-0.5 w-8 text-center font-bold">ลำดับ</th>
              <th className="py-0.5 px-2 text-left font-bold">รายการ (Description)</th>
              <th className="py-0.5 w-14 text-center font-bold">จำนวน</th>
              <th className="py-0.5 w-20 text-right pr-2 font-bold">ราคา/หน่วย</th>
              <th className="py-0.5 w-20 text-right px-1 font-bold">รวมเงิน</th>
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
                    <span className="font-medium">{labelName}</span>
                  </td>
                  <td className="py-1 text-center">{meter ? meter.diff : (item.type === 'discount' ? "-" : "1")}</td>
                  <td className="py-1 text-right pr-2">{meter ? Number(meter.rate).toLocaleString() : Math.abs(item.amount || 0).toLocaleString()}</td>
                  <td className="py-1 px-1 text-right font-bold">
                    {item.type === 'discount' && "-"} {Math.abs(item.amount || 0).toLocaleString(undefined, {minimumFractionDigits: 2})}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* --- Footer --- */}
      {/* 💡 ดันลงล่างสุดด้วย mt-auto */}
      <div className="mt-auto shrink-0 pt-1">
        <div className="flex border-[1.5px] border-black text-[11px] rounded-sm overflow-hidden h-[26px]">
          <div className="flex-1 px-3 flex items-center bg-gray-50 font-bold italic text-gray-700 border-r-[1.5px] border-black">
            ยอดเงินสุทธิ {bahtText(total)}
          </div>
          <div className="w-36 px-3 flex items-center justify-end font-black text-[14px] text-black bg-gray-100">
            {total.toLocaleString(undefined, {minimumFractionDigits: 2})}
          </div>
        </div>

        <div className="flex justify-between items-end mt-1.5 text-[8px]">
          <div className="w-[65%] border border-gray-200 rounded px-2 py-1.5 bg-gray-50 leading-tight">
            <p className="font-bold text-black mb-0.5">ชำระเงินผ่านบัญชีธนาคาร</p>
            <p>{apt.bankName || "ธนาคารกสิกรไทย สาขาถนนสวรรค์วิถี"}</p>
            <p className="font-black text-[11px] tracking-wider text-black mt-0.5">{apt.bankAccNo || "XXX-X-XXXXX-X"}</p>
            <p className="mt-0.5">ชื่อบัญชี: {apt.name} | Line: {apt.lineId || "-"}</p>
          </div>

          <div className="w-[30%] text-center pb-1">
            <div className="border-b border-black border-dashed mb-1 w-full mx-auto"></div>
            <p className="font-bold text-black text-[10px]">( {adminName} )</p>
            <p className="text-[8px] text-gray-500 mt-0.5">ผู้รับเงิน / ผู้ออกบิล</p>
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

  useEffect(() => {
    const originalTitle = document.title;
    const cycleDate = contractInfo?.cycleEnd || new Date().toLocaleDateString('th-TH');
    document.title = `บิลค่าเช่า_ห้อง${roomNumber}_${cycleDate.replace(/\//g, '-')}`;
    
    return () => { document.title = originalTitle; };
  }, [roomNumber, contractInfo]);

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
        /* ปิดการแสดง scrollbar ทั้งหมด */
        ::-webkit-scrollbar {
          display: none;
        }
        
        @media print {
          @page { 
            size: A4 portrait; 
            margin: 0 !important; 
          }
          body, html { 
            margin: 0 !important; 
            padding: 0 !important; 
            background: white !important; 
            overflow: hidden !important; /* บังคับไม่ให้มี Scrollbar */
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          #bill-print-area {
            display: flex !important;
          }
        }
        @media screen {
          #bill-print-area {
            display: none !important;
          }
        }
      `}</style>

      {/* 💡 width: 100% ป้องกันฝั่งขวาทะลุ, height: 296mm ป้องกันหน้าสองงอก */}
      <div 
        id="bill-print-area"
        className="hidden flex-col mx-auto bg-white box-border text-black overflow-hidden relative"
        style={{ width: '100%', height: '296mm' }}
      >
        {/* 💡 ใช้ 148mm (ครึ่งของ 296mm พอดีเป๊ะ) */}
        <div className="flex-none box-border overflow-hidden border-b border-dashed border-gray-400" style={{ height: '148mm', width: '100%' }}>
           <ReceiptHalf isCopy={false} items={items} roomNumber={roomNumber} apt={apt} cst={cst} ctc={ctc} adminName={adminName} total={total} billTitle={billTitle} />
        </div>
        
        <div className="flex-none box-border overflow-hidden" style={{ height: '148mm', width: '100%' }}>
           <ReceiptHalf isCopy={true} items={items} roomNumber={roomNumber} apt={apt} cst={cst} ctc={ctc} adminName={adminName} total={total} billTitle={billTitle} />
        </div>
      </div>
    </>
  );
};

export default BillMonthlyPrintTemplate;