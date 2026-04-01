import React, { useState, useEffect, useCallback } from "react";
import { useParams } from "react-router-dom";
import { Loader2, Download, Lock, Phone } from "lucide-react";

import { paymentService } from "../api/PaymentApi";
import { contractService } from "../api/ContractApi";
import { apartmentService } from "../api/ApartmentApi";
import { tenantService } from "../api/TenantApi";
import { adminService } from "../api/AdminApi";
import { roomService } from "../api/RoomApi";
import { constantService } from "../api/ConstantApi"; 
import logoImg from '../assets/logo.png';

// ─────────────────────────────────────────────────────────────
// 🛠️ ฟังก์ชันช่วยเหลือ 
// ─────────────────────────────────────────────────────────────
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

// 🌟 ปรับปรุงให้ดึงหน่วยและเรทราคาได้อย่างถูกต้อง รองรับสมการที่ซับซ้อน
const parseMeterInfo = (detailStr, amount) => {
  if (!detailStr || typeof detailStr !== 'string') return null;
  try {
    const rateMatch = detailStr.match(/\*\s*([\d.]+)/);
    if (rateMatch) {
      const rate = Number(rateMatch[1]);
      // เอาจำนวนเงินหารด้วยเรทราคา เพื่อให้ได้จำนวนหน่วยที่ใช้จริง (ปลอดภัยกว่าการนั่งบวกเลขเอง)
      const diff = rate > 0 ? (amount / rate) : 0;
      return { diff: diff, rate: rate };
    }
  } catch (e) { console.error(e); }
  return null;
};

const toThaiMonth = (dateStr) => {
  if (!dateStr) return "";
  const [year, month] = dateStr.split("-");
  const thaiMonths = ["มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน", "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"];
  return `${thaiMonths[parseInt(month, 10) - 1]} ${parseInt(year, 10) + 543}`;
};

const getItemLabel = (item, selectedDate, type, rates, prevMeters) => {
  const month = toThaiMonth(selectedDate);
  if (item.labels?.[selectedDate]) return item.labels[selectedDate];
  if (item.type === "discount") return "ส่วนลด";
  if (item.type === "rent")     return `ค่าเช่าห้องพัก เดือน${month}`;

  if (item.type === "electric" || item.type === "water") {
    const baseName = item.type === "electric" ? "ค่าไฟ" : "ค่าประปา";
    const recordDateStr = item.meterDate || new Date().toLocaleDateString('th-TH', { year: 'numeric', month: '2-digit', day: '2-digit' });

    const detailStr = item.detail || "";

    const backendChangeMatch = detailStr.match(/\(\s*([\d.]+)\s*-\s*([\d.]+)\s*\)\s*\*\s*([\d.]+)\s*\+\s*\(\s*([\d.]+)\s*-\s*([\d.]+)\s*\)\s*\*\s*([\d.]+)/);
    if (backendChangeMatch) {
      const oldEnd = backendChangeMatch[1];
      const oldStart = backendChangeMatch[2];
      const rate = backendChangeMatch[3];
      const newEnd = backendChangeMatch[4];
      const newStart = backendChangeMatch[5];
      return `${baseName} (วันที่จดมิเตอร์: ${recordDateStr}) (เปลี่ยนมิเตอร์: (${oldEnd} - ${oldStart}) + (${newEnd} - ${newStart})) * ${rate} บาท/หน่วย`;
    }

    if (detailStr.includes("เปลี่ยนมิเตอร์")) {
      const changePart = detailStr.match(/เปลี่ยนมิเตอร์:\s*(.*?)\s*=/);
      const rateMatch = detailStr.match(/\*\s*([\d.]+)/);
      if (changePart && rateMatch) {
        return `${baseName} (วันที่จดมิเตอร์: ${recordDateStr}) (เปลี่ยนมิเตอร์: ${changePart[1].trim()}) * ${rateMatch[1]} บาท/หน่วย`;
      }
    }

    const backendStdMatch = detailStr.match(/\(\s*([\d.]+)\s*-\s*([\d.]+)\s*\)\s*\*\s*([\d.]+)/);
    if (backendStdMatch) {
      const cur = backendStdMatch[1];
      const prv = backendStdMatch[2];
      const rate = backendStdMatch[3];
      return `${baseName} (วันที่จดมิเตอร์: ${recordDateStr}) (${cur} - ${prv}) * ${rate} บาท/หน่วย`;
    }

    const rateMatch = detailStr.match(/\*\s*([\d.]+)/);
    const unitMatch = detailStr.match(/(\d+(?:\.\d+)?)\s*-\s*(\d+(?:\.\d+)?)/);
    if (unitMatch && rateMatch) {
      return `${baseName} (วันที่จดมิเตอร์: ${recordDateStr}) (${unitMatch[1]} - ${unitMatch[2]}) * ${rateMatch[1]} บาท/หน่วย`;
    }

    if (rates && prevMeters) {
      const rate = item.type === "electric" ? rates.electric : rates.water;
      const oldUnit = item.type === "electric" ? prevMeters.electricityUnit : prevMeters.waterUnit;
      
      if (rate > 0) {
        const usedUnits = item.amount / rate;
        const newUnit = Number((oldUnit + usedUnits).toFixed(2));
        return `${baseName} (วันที่จดมิเตอร์: ${recordDateStr}) (${newUnit} - ${oldUnit}) * ${rate} บาท/หน่วย`;
      }
    }

    return `${baseName} (วันที่จดมิเตอร์: ${recordDateStr})`;
  }

  if (item.label) return item.label;
  if (type === "asset" || item.type === "asset" || item.type === "damage") return item.label || "ค่าชำรุดเสียหาย/ทรัพย์สิน";
  return "รายการอื่น ๆ";
};

const parseDetailString = (detail, totalAmount, defaultLabel, type, isNegative = false) => {
  if (!detail) return [{ id: Math.random(), type, label: defaultLabel, amount: totalAmount * (isNegative ? -1 : 1), detail: "" }];
  const items = [];
  const itemRegex = /([^(]+)\(\s*([\d,]+)\s*฿\s*\)/g;
  let match, sum = 0;
  while ((match = itemRegex.exec(detail)) !== null) {
    const amt = Number(match[2].replace(/,/g, ''));
    sum += amt;
    items.push({ id: Math.random(), type, label: match[1].replace(/^[,\s]+/, '').trim(), amount: amt * (isNegative ? -1 : 1), detail: "" });
  }
  if (items.length === 0 || sum !== totalAmount) {
    return [{ id: Math.random(), type, label: detail, amount: totalAmount * (isNegative ? -1 : 1), detail: "" }];
  }
  return items;
};

// ─────────────────────────────────────────────────────────────
// 🚀 คอมโพเนนต์หลัก ViewBill
// ─────────────────────────────────────────────────────────────
const ViewBill = () => {
  const { id } = useParams();
  
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [isVerified, setIsVerified] = useState(false);
  const [phoneInput, setPhoneInput] = useState("");
  const [verifyError, setVerifyError] = useState("");

  const [paymentData, setPaymentData] = useState(null);
  const [items, setItems] = useState([]);
  const [roomNumber, setRoomNumber] = useState("-");
  const [tenantInfo, setTenantInfo] = useState({ title: "", firstName: "-", lastName: "-", phone: "-", address: "-" });
  const [apartmentInfo, setApartmentInfo] = useState({ 
    name: "หอพักนิตยวดี", address: "63/246 ถนน ดาวดึงส์ อ.เมือง นครสวรรค์ 60000", phone: "0867439033", lineId: "@075fbmzv", 
    email: "seniordorm.2025@gmail.com", bankName: "ธนาคารกสิกรไทย สาขาถนนสวรรค์วิถี", bankAccNo: "XXX-X-XXXXX-X"
  });
  const [adminName, setAdminName] = useState("เจ้าหน้าที่");

  const extractArray = (res) => {
    if (!res) return [];
    if (Array.isArray(res)) return res;
    if (res.$values) return res.$values;
    if (res.data && Array.isArray(res.data)) return res.data;
    if (res.data?.$values) return res.data.$values;
    return [];
  };

  useEffect(() => {
    const fetchBillData = async () => {
      try {
        setIsLoading(true);
        const payment = await paymentService.getPaymentById(id);
        setPaymentData(payment);

        const recordDateRaw = payment.recordDate || payment.RecordDate || new Date().toISOString();
        const selectedDate = recordDateRaw.substring(0, 7); 
        const monthLabel = toThaiMonth(selectedDate);
        const recordDateStr = new Date(recordDateRaw).toLocaleDateString('th-TH', { year: 'numeric', month: '2-digit', day: '2-digit' });
        const pNote = payment.calculationNote || payment.CalculationNote || payment.note || payment.Note || "";

        // 1. ค้นหาห้อง
        let rId = null;
        let rNum = "-";
        const cId = payment.contractId || payment.ContractId;
        if (cId) {
          try {
            const contract = await contractService.getContract(cId);
            if (contract) {
              rId = contract.roomId || contract.RoomId;
              rNum = contract.room?.Number || contract.Room?.Number || contract.room?.number || contract.Room?.number || contract.roomNumber || contract.RoomNumber;

              if (!rNum && rId) {
                try {
                  const roomsData = extractArray(await roomService.getRoomOverview());
                  const targetRoom = roomsData.find(r => (r.roomId || r.id) === rId);
                  if (targetRoom) rNum = targetRoom.roomNumber || targetRoom.number;
                } catch (roomErr) { console.warn("Failed to fetch room detail", roomErr); }
              }
              setRoomNumber(rNum || "-");
              
              const tId = contract.tenantId || contract.TenantId;
              if (tId) setTenantInfo(await tenantService.getTenant(tId));
            }
          } catch (e) { console.warn(e); }
        }

        // 2. ดึงเรทราคามิเตอร์
        let elecRate = 0, waterRate = 0;
        let prevElec = 0, prevWater = 0;
        
        try {
          const allConstants = await constantService.getConstants().catch(() => []);
          elecRate = Number(allConstants.find(c => c.category?.toLowerCase() === "utility" && (c.subject?.includes("ไฟ") || c.subject?.includes("ElectricityBill")))?.cost || 0);
          waterRate = Number(allConstants.find(c => c.category?.toLowerCase() === "utility" && (c.subject?.includes("น้ำ") || c.subject?.includes("WaterBill")))?.cost || 0);

          if (cId) {
            const [year, month] = selectedDate.split("-").map(Number);
            const previewData = await paymentService.generatePayment(cId, year, month).catch(()=>({}));
            if (previewData) {
              prevElec = previewData.previousElectricUnit ?? 0;
              prevWater = previewData.previousWaterUnit ?? 0;
            }
          }
        } catch(e) {}

        const billItems = [];
        
        // 1. ค่าเช่า
        const rentVal = payment.roomRate || payment.RoomRate || 0;
        if (rentVal > 0) {
          billItems.push({ type: "rent", amount: Number(rentVal), label: `ค่าเช่าห้องพัก ประจำเดือน${monthLabel}`, detail: "" });
        }
        
        // 🌟 2. ค่าไฟ (เรียกใช้ getItemLabel เพื่อให้ตรรกะเหมือนหน้าบิลเป๊ะๆ)
        const elecVal = payment.electricalCost || payment.ElectricalCost || payment.electricalPricePerUnit || 0;
        if (elecVal > 0) {
          const elecDetail = pNote.match(/ไฟ:[^|]*/)?.[0]?.trim() || "";
          const fakeItem = { type: "electric", amount: Number(elecVal), detail: elecDetail, meterDate: recordDateStr };
          const elecLabel = getItemLabel(fakeItem, selectedDate, "electric", { electric: elecRate, water: waterRate }, { electricityUnit: prevElec, waterUnit: prevWater });
          billItems.push({ type: "electric", amount: Number(elecVal), label: elecLabel, detail: elecDetail });
        }
        
        // 🌟 3. ค่าน้ำ (เรียกใช้ getItemLabel เช่นกัน)
        const waterVal = payment.waterCost || payment.WaterCost || payment.waterPricePerUnit || 0;
        if (waterVal > 0) {
          const waterDetail = pNote.match(/น้ำ:[^|]*/)?.[0]?.trim() || "";
          const fakeItem = { type: "water", amount: Number(waterVal), detail: waterDetail, meterDate: recordDateStr };
          const waterLabel = getItemLabel(fakeItem, selectedDate, "water", { electric: elecRate, water: waterRate }, { electricityUnit: prevElec, waterUnit: prevWater });
          billItems.push({ type: "water", amount: Number(waterVal), label: waterLabel, detail: waterDetail });
        }
        
        // 4. อื่นๆ
        const internetVal = payment.internetCost || payment.InternetCost || 0;
        if (internetVal > 0) billItems.push({ type: "internet", amount: Number(internetVal), label: "ค่าอินเทอร์เน็ต", detail: "" });
        
        const laundryVal = payment.laundryCost || payment.LaundryCost || 0;
        if (laundryVal > 0) billItems.push({ type: "laundry", amount: Number(laundryVal), label: "ค่าซักรีด", detail: "" });
        
        const assetVal = payment.furnitureCost || payment.FurnitureCost || 0;
        if (assetVal > 0) billItems.push({ type: "asset", amount: Number(assetVal), label: "ค่าชำรุดเสียหาย/ทรัพย์สิน", detail: "" });
        
        const addVal = payment.additionalCost || payment.AdditionalCost || 0;
        const addDetail = payment.additionalDetail || payment.AdditionalDetail || "";
        if (addVal > 0) billItems.push(...parseDetailString(addDetail, Number(addVal), "รายการเพิ่มเติม", "other"));
        
        const discVal = payment.discountCost || payment.DiscountCost || 0;
        const discDetail = payment.discountDetail || payment.DiscountDetail || "";
        if (discVal > 0) billItems.push(...parseDetailString(discDetail, Number(discVal), "ส่วนลด", "discount", true));
        
        setItems(billItems);

        try { 
          const apt = await apartmentService.getApartment(1);
          if (apt) setApartmentInfo(apt); 
        } catch (e) {}

        const aId = payment.adminId || payment.AdminId;
        if (aId) {
          try {
            const adm = await adminService.getAdmin(aId);
            if (adm) setAdminName(`${adm.firstName || adm.FirstName} ${adm.lastName || adm.LastName}`);
          } catch (e) {}
        }

      } catch (err) {
        setError("ไม่พบข้อมูลเอกสาร หรือลิงก์อาจถูกลบไปแล้วค่ะ");
      } finally {
        setIsLoading(false);
      }
    };

    fetchBillData();
  }, [id]);

  const handleVerify = (e) => {
    e.preventDefault();
    const cleanInput = phoneInput.replace(/\D/g, "");
    const actualPhone = tenantInfo?.phone || tenantInfo?.Phone || "";
    const cleanTenantPhone = actualPhone.replace(/\D/g, "");

    if (!cleanTenantPhone) {
      setVerifyError("ไม่พบข้อมูลเบอร์โทรในระบบ กรุณาติดต่อแอดมินเพื่ออัปเดตข้อมูลค่ะ");
      return;
    }

    if (cleanInput === cleanTenantPhone && cleanInput !== "") {
      setIsVerified(true);
      setVerifyError("");
    } else {
      setVerifyError("เบอร์โทรศัพท์ไม่ถูกต้อง กรุณาลองใหม่อีกครั้งค่ะ");
    }
  };

  if (isLoading) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#FFEDD5]">
      <Loader2 className="w-12 h-12 text-orange-400 animate-spin mb-4" />
      <p className="text-gray-600 font-bold">กำลังเปิดเอกสาร...</p>
    </div>
  );

  if (error || !paymentData) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#FFEDD5] p-6">
      <div className="bg-white p-8 rounded-[32px] shadow-sm text-center max-w-sm w-full border border-red-100">
        <h2 className="text-xl font-bold text-red-500 mb-2">ขออภัยค่ะ</h2>
        <p className="text-gray-500">{error}</p>
      </div>
    </div>
  );

  if (!isVerified) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-6">
      <div className="bg-white p-8 rounded-[32px] shadow-lg max-w-sm w-full text-center border border-gray-100">
        <div className="w-16 h-16 bg-[#FFEDD5] text-[#f3a638] rounded-full flex items-center justify-center mx-auto mb-6">
          <Lock size={32} />
        </div>
        <h2 className="text-xl font-black text-gray-800 mb-2">ยืนยันตัวตน</h2>
        <p className="text-sm text-gray-500 mb-6 font-bold">กรุณากรอกเบอร์โทรศัพท์ที่ลงทะเบียนไว้กับทางหอพัก</p>

        <form onSubmit={handleVerify} className="flex flex-col gap-4">
          <div className="relative">
            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
              <Phone size={18} className="text-gray-400" />
            </div>
            <input 
              type="tel" 
              maxLength="10"
              placeholder="08XXXXXXXX"
              value={phoneInput}
              onChange={(e) => setPhoneInput(e.target.value)}
              className="w-full pl-12 pr-4 py-3 rounded-2xl border-2 border-gray-200 font-bold text-gray-800 focus:border-[#f3a638] focus:outline-none transition-all bg-gray-50 focus:bg-white"
              required
            />
          </div>
          {verifyError && <p className="text-red-500 text-xs font-bold">{verifyError}</p>}
          <button type="submit" className="w-full py-3 bg-[#f3a638] hover:bg-orange-500 text-white font-black rounded-2xl transition-all shadow-md mt-2">ดูเอกสาร</button>
        </form>
      </div>
    </div>
  );

  const isPaid = paymentData.status?.toLowerCase() === "paid";
  const billTitle = isPaid ? "ใบเสร็จรับเงิน" : "ใบแจ้งยอดชำระเงิน";
  const recordDate = new Date(paymentData.recordDate || paymentData.RecordDate);
  const cycleMonthYear = `${String(recordDate.getMonth() + 1).padStart(2, '0')}/${recordDate.getFullYear()}`;
  const printDate = new Date().toLocaleDateString('th-TH', { year: 'numeric', month: '2-digit', day: '2-digit' });
  const totalAmount = paymentData.totalAmount || paymentData.TotalAmount || 0;

  const tenantTitle = tenantInfo?.title || tenantInfo?.Title || "";
  const tenantFirstName = tenantInfo?.firstName || tenantInfo?.FirstName || "-";
  const tenantLastName = tenantInfo?.lastName || tenantInfo?.LastName || "";
  const tenantPhone = tenantInfo?.phone || tenantInfo?.Phone || "-";
  const tenantAddress = tenantInfo?.address || tenantInfo?.Address || "-";

  const aptName = apartmentInfo?.name || apartmentInfo?.Name || "หอพักนิตยวดี";
  const aptAddress = apartmentInfo?.address || apartmentInfo?.Address || "63/246 ถนน ดาวดึงส์ อ.เมือง นครสวรรค์ 60000";
  const aptPhone = apartmentInfo?.phone || apartmentInfo?.Phone || "0867439033";
  const aptEmail = apartmentInfo?.email || apartmentInfo?.Email || "seniordorm.2025@gmail.com";
  const aptBank = apartmentInfo?.bankName || apartmentInfo?.BankName || "ธนาคารกสิกรไทย สาขาถนนสวรรค์วิถี";
  const aptBankAcc = apartmentInfo?.bankAccNo || apartmentInfo?.BankAccNo || "XXX-X-XXXXX-X";
  const aptLine = apartmentInfo?.lineId || apartmentInfo?.LineId || "-";

  return (
    <div className="min-h-screen bg-gray-100 pb-10">
      <style>{`
        @media print {
          @page { size: A4 portrait; margin: 0 !important; }
          body, html { background: white !important; margin: 0 !important; padding: 0 !important; height: 100%; overflow: hidden !important; }
          .print-hide { display: none !important; }
          .min-h-screen { min-height: auto !important; padding-bottom: 0 !important; }
          .receipt-paper { box-shadow: none !important; border: none !important; margin: 0 !important; width: 100% !important; max-width: 100% !important; page-break-after: avoid !important; break-after: avoid !important; }
        }
      `}</style>

      <div className="print-hide sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-200 px-4 py-3 flex justify-between items-center shadow-sm">
        <div className="flex flex-col">
          <span className="font-black text-gray-800">ห้อง {roomNumber}</span>
          <span className={`text-xs font-bold ${isPaid ? "text-emerald-600" : "text-orange-500"}`}>
            {isPaid ? "✓ ชำระเงินเรียบร้อย" : "รอชำระเงิน"}
          </span>
        </div>
        <button onClick={() => window.print()} className="flex items-center gap-2 bg-[#f3a638] hover:bg-orange-500 text-white px-4 py-2 rounded-xl font-bold shadow-md transition-all text-sm">
          <Download size={16} />
          <span className="hidden sm:inline">บันทึกเป็น PDF</span>
          <span className="sm:hidden">PDF</span>
        </button>
      </div>

      <div className="w-full overflow-x-auto px-2 py-6 print:py-0">
        <div className="receipt-paper w-[210mm] min-h-[148mm] bg-white mx-auto relative box-border border border-gray-200 shadow-xl text-black px-10 py-6">
          <div className="flex justify-between items-start mb-2 border-b border-gray-200 pb-1">
            <div className="flex items-center gap-3 w-[50%]">
              <img src={logoImg} alt="Logo" className="w-10 h-10 object-contain grayscale opacity-90" onError={(e) => { e.target.style.display = 'none'; }} />
              <div className="leading-tight">
                <h1 className="text-[16px] font-black">{aptName}</h1>
                <p className="text-[9px] text-gray-700">{aptAddress}</p>
                <p className="text-[9px] text-gray-700">โทร. {aptPhone} | อีเมล. {aptEmail}</p>
              </div>
            </div>
            <div className="w-[50%] flex items-center justify-end gap-2 leading-tight">
              <div className="text-right">
                <h2 className="text-[16px] font-black">{billTitle}</h2>
                <div className="flex flex-col items-end text-[9px] text-gray-800 space-y-0.5">
                  <span><b className="font-bold">รอบบิล:</b> {cycleMonthYear}</span>
                  <span><b className="font-bold">วันที่พิมพ์:</b> {printDate}</span>
                </div>
              </div>
              <div className="flex flex-col items-center border-2 border-black px-2 py-0.5 rounded bg-gray-50 min-w-[65px]">
                <span className="font-bold text-[9px]">ห้อง (Room)</span>
                <span className="text-[20px] font-black leading-none">{roomNumber}</span>
              </div>
            </div>
          </div>

          <div className="text-[11px] text-gray-800 border-b border-gray-300 pb-1 mb-2">
            <div className="flex justify-between">
              <div>
                <span className="font-bold">ลูกค้า:</span> {tenantTitle}{tenantFirstName} {tenantLastName} 
                <span className="font-bold ml-4">โทร:</span> {tenantPhone}
              </div>
            </div>
            <div className="mt-0.5"><span className="font-bold">ที่อยู่:</span> {tenantAddress}</div>
          </div>

          <div className="w-full pb-4">
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
                  // 🌟 แก้ไขการเรียกใช้ parseMeterInfo ให้ส่ง amount ไปด้วย
                  const meter = parseMeterInfo(item.detail, Math.abs(item.amount || 0));
                  return (
                    <tr key={idx} className="border-b border-gray-100">
                      <td className="py-1 text-center text-gray-500">{idx + 1}</td>
                      <td className="py-1 px-2"><span className="font-bold">{item.label}</span></td>
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

          <div className="mt-auto">
            <div className="flex border-2 border-black text-[12px] rounded-sm overflow-hidden h-[30px]">
              <div className="flex-1 px-4 flex items-center bg-gray-50 font-bold italic text-gray-700 border-r-2 border-black">
                ยอดเงินสุทธิ {bahtText(totalAmount)}
              </div>
              <div className="w-40 px-4 flex items-center justify-end font-black text-[16px] text-black bg-gray-100">
                {totalAmount.toLocaleString(undefined, {minimumFractionDigits: 2})}
              </div>
            </div>
            <div className="flex justify-between items-end mt-2 text-[9px]">
              <div className="w-[65%] border border-gray-200 rounded px-3 py-1.5 bg-gray-50 leading-tight">
                <p className="font-bold text-black mb-1">ชำระเงินผ่านบัญชีธนาคาร</p>
                <p>{aptBank}</p>
                <p className="font-black text-[13px] tracking-wider text-black">{aptBankAcc}</p>
                <p>ชื่อบัญชี: {aptName} | Line: {aptLine}</p>
              </div>
              <div className="w-[30%] text-center pb-1">
                <div className="border-b border-black border-dashed mb-1 w-full mx-auto"></div>
                <p className="font-bold text-black text-[11px]">( {adminName} )</p>
                <p className="text-[9px] text-gray-500">ผู้รับเงิน / ผู้ออกบิล</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ViewBill;