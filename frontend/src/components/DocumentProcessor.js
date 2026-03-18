//เปลี่ยน {{...}} ให้เป็นข้อมูลจริง สำหรับการเรียกใช้เทมเพลต ต้องจัดการตัวแปรเพื่อดึงข้อมูลจาก database
import { toThaiDate } from "./DateController";

export const fillTemplateData = (htmlContent, tenantData, roomNo) => {
  if (!tenantData) return htmlContent;

  const mapObj = {
    "{{tenant_name}}": `${tenantData.title}${tenantData.firstName} ${tenantData.lastName}`,
    "{{tenant_nin}}": tenantData.nin,
    "{{tenant_phone}}": tenantData.phone,
    "{{room_number}}": roomNo,
    "{{contract_startDate}}": toThaiDate(tenantData.checkInDate),
    "{{contract_endDate}}": toThaiDate(tenantData.contractEndDate),
    "{{apartment_name}}": "หอพักนิตยวดี", // ข้อมูลส่วนนี้อาจดึงจากตัวแปรกลางในอนาคต
    "{{monthly_rent}}": "5,500", 
    "{{deposit}}": "11,000",
  };

  let processedContent = htmlContent;
  Object.keys(mapObj).forEach((key) => {
    // ใช้ Regular Expression เพื่อให้แทนที่ทุกจุด (Global Replace)
    const re = new RegExp(key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
    processedContent = processedContent.replace(re, mapObj[key] || "");
  });

  return processedContent;
};