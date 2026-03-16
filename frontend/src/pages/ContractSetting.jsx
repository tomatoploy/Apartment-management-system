import { useNavigate } from "react-router-dom";

import React, { useState } from "react";
import ReactQuill from "react-quill-new";
import "react-quill-new/dist/quill.snow.css";
import {
  ExitButton,
  OrangeButton,
  ConfirmModal,
} from "../components/ActionButtons";
import { CheckCircle2 } from "lucide-react";
// --- MOCK DATA INCLUDED ---
const mockSettings = {
  building_name: "หอพัก สบายดี แมนชั่น",
  address: "123/45 ถนนพญาไท แขวงปทุมวัน เขตปทุมวัน กรุงเทพฯ 10330",
  landlord_name: "คุณสมศรี มีความสุข",
  landlord_id_card: "1-2345-67890-12-3",
};

const initialContractTemplates = [
  {
  id: 1,
  name: "สัญญาเช่า",
  content: `


    <div style="font-family: 'Sarabun', sans-serif; line-height: 1.6; color: #000; max-width: 800px; margin: auto; padding: 30px; border: 1px solid #f0f0f0;">
      <h2 style="text-align: center; font-size: 24px; margin-bottom: 5px;">สัญญาเช่าห้องพัก</h2>
      <p style="text-align: right;">ทำขึ้นเมื่อวันที่ {{contract_date}}</p><br>
      
      <p>สัญญาฉบับนี้ทำขึ้นระหว่าง <strong>{{apartment_name}}</strong> {{apartment_address}}โดยผู้รับมอบอำนาจ ซึ่งต่อไปนี้เรียกว่า "ผู้ให้เช่า" ฝ่ายหนึ่ง 
      และ <strong>{{tenant_name}}</strong> บัตรประชาชนเลขที่ {{tenant_nin}} เบอร์โทรศัพท์ {{tenant_phone}} ซึ่งต่อไปนี้เรียกว่า "ผู้เช่า" อีกฝ่ายหนึ่ง ทั้งสองฝ่ายได้ตกลงทำสัญญากันดังนี้</p><br>
      
      <p><strong>ข้อ 1.</strong> ผู้ให้เช่าตกลงให้เช่า และผู้เช่าตกลงเช่าห้องพักหมายเลข <strong>{{room_number}}</strong> 
      ตั้งแต่วันที่ {{contract_startDate}} ถึงวันที่ {{contract_endDate}}</p>
      <p>ซึ่งต่อไปนี้จะเรียกว่า "ห้องพัก" พร้อมอุปกรณ์ของใช้ที่ติดตั้งภายในห้อง</p>
      
      <p><strong>ข้อ 2.</strong> ผู้เช่าตกลงเช่าห้องพักในอัตราค่าเช่าเดือนละ <strong>{{monthly_rent}}</strong> บาท 
      โดยแบ่งเป็น
      <p>ค่าเช่าห้องพัก {{contract_monthlyRent}} บาท</p>
      <p>ค่าเฟอร์นิเจอร์ {{contract_deposit}} บาท</p>
      <p>เฟอร์นิเจอร์ภายในห้องประกอบด้วย: {{furniture_list}}</p>
      
      <p><strong>ข้อ 3.</strong> ในวันทำสัญญา ผู้เช่าได้ชำระเงินในวันที่ลงนามสัญญา ดังนี้</p>
      <p>ค่าเช่าเดือนแรก {{first_month_rent}} บาท</p>
      <p>เงินประกัน <strong>{{deposit}}</strong> บาท</p>
      
      <p><strong>ข้อ 4.</strong> ค่าสาธารณูปโภค:
        <ul>
          <li>ค่าไฟฟ้า หน่วยละ {{electricity_rate}} บาท</li>
          <li>ค่าน้ำประปา หน่วยละ {{water_rate}} บาท</li>
        </ul>
      </p>
      
      <p><strong>ข้อ 5.</strong> ผู้เช่าต้องชำระค่าเช่าและค่าบริการต่างๆ <strong>ภายในวันที่ {{apartment_paymentDueEnd}} ของเดือน</strong> หากเกินกำหนดจะมีค่าปรับตามที่ระบุ [cite: 53]</p>
      
      <p><strong>ข้อ 6.</strong> การแจ้งย้ายออก ต้องแจ้งล่วงหน้าอย่างน้อย 30 วัน เป็นลายลักษณ์อักษร</p>
      
      <p><strong>ข้อ 7.</strong> ห้ามใช้เตาแก๊สภายในห้องพักโดยเด็ดขาด แต่อนุญาตให้ใช้กระทะไฟฟ้าและไมโครเวฟได้</p>

      <p><strong>ข้อ 8.</strong> ห้ามทำการต่อเติม แก้ไข ดัดแปลงทรัพย์สินภายในห้องพักโดยไม่ได้รับอนุญาตจากผู้ให้เช่า</p>

      <p><strong>ข้อ 9.</strong> เมื่อสัญญาฉบับนี้สิ้นสุดลง ผู้ให้เช่าจะต้องคืนเงินประกันให้กับผู้เช่าหลังจากตรวจสอบสภาพห้องพัก</p>

      <p>สัญญาฉบับนี้ทำขึ้นในสองฉบับ มีความถูกต้องตรงกัน ผู้ให้เช่าปละผู้เช่าต่างถือไว้คนละฉบับ ทั้งสองฝ่ายตกลงจะปฏิบัติตามข้อตกลงดังกล่าว</p>
      
      <div style="margin-top: 40px; display: flex; justify-content: space-around;">
        <div style="text-align: center;">
          <p>ลงชื่อ....................................................(ผู้ให้เช่า)</p>
          <p>{{admin_name}}</p>
        </div>

        <div style="text-align: center;">
          <p>ลงชื่อ.....................................................(ผู้เช่า)</p>
          <p>{{tenant_name}}</p>
        </div>
      </div>
    </div>
  `,
  is_active: true,
},
{
  id: 2,
  name: "ใบเสร็จการชำระเงิน (แรกเข้า)",
  content: `
    <div style="font-family: 'Sarabun', sans-serif; max-width: 800px; margin: auto; border: 1px solid #eee; padding: 20px; color: #333;">
      <div style="text-align: center; border-bottom: 2px solid #f3a638; padding-bottom: 10px; margin-bottom: 20px;">
        <h2 style="margin: 0; color: #f3a638;">หอพักนิตยวดี</h2>
        <p style="font-size: 12px; margin: 5px 0;">9/999 ถนนดาวดึงส์ ต.ปากน้ำโพ อ.เมือง นครสวรรค์ 60000</p>
        <p style="font-size: 12px; margin: 0;">โทร. 02-123-4567, 083-777-7777</p>
      </div>

      <div style="display: flex; justify-content: space-between; margin-bottom: 20px; font-size: 14px;">
        <div>
        <p>ได้รับเงินค่าเช่าและเงินประกัน</p>
        <p>จากผู้เช่าห้องหมายเลข <strong>{{room_number}}</strong></p>
          <strong>ชื่อผู้เช่า:</strong> {{tenant_name}}<br>
        </div>
        <div style="text-align: right;">
          <strong>วันที่ชำระ:</strong> {{payment_date}}<br>
          <strong>เลขที่อ้างอิง:</strong> {{payment_id}}
        </div>
      </div>

      <p>เป็นเงินทั้งหมดจำนวน {{total_paid}} บาท</p>
      <p>สามารถจำแนกรายละเอียดได้ดังนี้</p>
      

      <h3 style="font-size: 16px; border-left: 4px solid #f3a638; padding-left: 10px; margin-top: 15px; margin-bottom: 15px;">รายละเอียดการชำระเงินแรกเข้า</h3>
      
      <table style="width: 100%; border-collapse: collapse; font-size: 14px; margin-bottom: 20px;">
        <thead>
          <tr style="background-color: #f9f9f9;">
            <th style="border: 1px solid #ddd; padding: 10px; text-align: left;">รายการ</th>
            <th style="border: 1px solid #ddd; padding: 10px; text-align: right;">จำนวนเงิน (บาท)</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style="border: 1px solid #ddd; padding: 10px;">ค่าเช่าเดือนปัจจุบัน ({{current_month}})</td>
            <td style="border: 1px solid #ddd; padding: 10px; text-align: right;">{{monthly_rent}}</td>
          </tr>
          <tr>
            <td style="border: 1px solid #ddd; padding: 10px;">เงินประกันความเสียหาย</td>
            <td style="border: 1px solid #ddd; padding: 10px; text-align: right;">{{deposit}}</td>
          </tr>
          <tr>
            <td style="border: 1px solid #ddd; padding: 10px;">ค่าคีย์การ์ด</td>
            <td style="border: 1px solid #ddd; padding: 10px; text-align: right;">{{keycard_fee}}</td>
          </tr>
          <tr>
            <td style="border: 1px solid #ddd; padding: 10px;">ค่ากุญแจ</td>
            <td style="border: 1px solid #ddd; padding: 10px; text-align: right;">{{key_fee}}</td>
          </tr>
          <tr style="font-weight: bold; color: #d9534f;">
            <td style="border: 1px solid #ddd; padding: 10px; text-align: right;">หักเงินจอง</td>
            <td style="border: 1px solid #ddd; padding: 10px; text-align: right;">- {{booking_deduction}}</td>
          </tr>
          <tr style="font-weight: bold; background-color: #fff8f0;">
            <td style="border: 1px solid #ddd; padding: 10px; text-align: right;">จำนวนเงินสุทธิที่ชำระ</td>
            <td style="border: 1px solid #ddd; padding: 10px; text-align: right; font-size: 18px; color: #f3a638;">{{total_paid}}</td>
          </tr>
        </tbody>
      </table>

      <div style="background-color: #f4f4f4; padding: 15px; border-radius: 8px; font-size: 13px; margin-bottom: 20px;">
        <strong>บันทึกตัวเลขมิเตอร์ ณ วันทำสัญญา:</strong><br>
        • มิเตอร์ไฟฟ้า: {{electricity_meter}} <br>
        • มิเตอร์น้ำ: {{water_meter}} <br>
      </div>


      <div style="font-size: 12px; color: #666; margin-bottom: 30px;">
        <p>* ผู้เช่าได้รับกุญแจและคีย์การ์ดเรียบร้อยแล้ว ณ วันที่ลงนาม</p>
        <p>* ชำระผ่าน: ธนาคารกสิกรไทย เลขที่บัญชี XXX-X-XXXXX-X นางนิตยวดี ภัทรานิล</p>
      </div>

      <div style="display: flex; justify-content: space-around; margin-top: 50px; font-size: 14px;">
        <div style="text-align: center;">
          <p>__________________________</p>
          <p>ลงชื่อผู้ชำระเงิน (ผู้เช่า)</p>
          <p>({{tenant_name}})</p>
        </div>
        <div style="text-align: center;">
          <p>ลงชื่อผู้รับเงิน  {{admin_signature}} </p>
          <p>({{admin_name}})</p>
        </div>
      </div>
    </div>
  `,
  is_active: true,
},
{
  id: 3,
  name: "ใบแจ้งหนี้/ใบเสร็จรับเงิน (รายเดือน)",
  content: `
     <div style="font-family: 'Sarabun', sans-serif; max-width: 800px; margin: auto; border: 1px solid #eee; padding: 20px; color: #333;">
      <div style="text-align: center; border-bottom: 2px solid #f3a638; padding-bottom: 10px; margin-bottom: 20px;">
        <h2 style="margin: 0; color: #f3a638;">หอพักนิตยวดี</h2>
        <p style="font-size: 12px; margin: 5px 0;">9/999 ถนนดาวดึงส์ ต.ปากน้ำโพ อ.เมือง นครสวรรค์ 60000</p>
        <p style="font-size: 12px; margin: 0;">โทร. 02-123-4567, 083-777-7777</p>
      </div>


      <div style="display: flex; justify-content: space-between; margin-bottom: 20px; font-size: 14px;">
        <div>
          <p style="margin: 5px 0;"><strong>ห้อง:</strong> <strong style="font-size: 14px; color: #f3a638;">{{room_number}}</strong></p>
          <p style="margin: 0;"><strong>ชื่อ-นามสกุล:</strong> {{tenant_name}}</p>
          <p style="margin: 5px 0;"><strong>ที่อยู่:</strong> {{tenant_address}}</p>
        </div>
        <div style="text-align: right;">
          <p style="margin: 0;"><strong>ประเภท:</strong> ใบแจ้งหนี้/ใบเสร็จรับเงิน</p>
          <p style="margin: 5px 0;"><strong>รอบบริการ เดือน:</strong> {{currentMonth}}</p>
          <p style="margin: 0;"><strong>วันที่พิมพ์:</strong> {{print_datetime}}</p>
        </div>
      </div>

      <table style="width: 100%; border-collapse: collapse; font-size: 14px; margin-bottom: 10px;">
        <thead>
          <tr style="background-color: #f3a638; color: white;">
            <th style="padding: 10px; text-align: center; width: 50px; border: 1px solid #e6952e;">ลำดับ</th>
            <th style="padding: 10px; text-align: left; border: 1px solid #e6952e;">รายการ </th>
            <th style="padding: 10px; text-align: center; border: 1px solid #e6952e;">หน่วย</th>
            <th style="padding: 10px; text-align: center; border: 1px solid #e6952e;">ราคา/หน่วย</th>
            <th style="padding: 10px; text-align: right; border: 1px solid #e6952e;">รวม (บาท)</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style="border: 1px solid #eee; padding: 10px; text-align: center;">1</td>
            <td style="border: 1px solid #eee; padding: 10px;">ค่าเช่าห้อง และค่าเช่าเฟอร์นิเจอร์ </td>
            <td style="border: 1px solid #eee; padding: 10px; text-align: center;">-</td>
            <td style="border: 1px solid #eee; padding: 10px; text-align: center;">-</td>
            <td style="border: 1px solid #eee; padding: 10px; text-align: right;">{{monthly_rent_total}}</td>
          </tr>
          <tr>
            <td style="border: 1px solid #eee; padding: 10px; text-align: center;">2</td>
            <td style="border: 1px solid #eee; padding: 10px;">
              ค่าไฟฟ้า (จดวันที่ {{meter_reading_date}})<br>
              <span style="font-size: 12px; color: #666;">(เลขมิเตอร์: {{curr_elec}} - {{prev_elec}}) </span>
            </td>
            <td style="border: 1px solid #eee; padding: 10px; text-align: center;">{{elec_units}}</td>
            <td style="border: 1px solid #eee; padding: 10px; text-align: center;">{{elec_rate}}</td>
            <td style="border: 1px solid #eee; padding: 10px; text-align: right;">{{elec_amount}}</td>
          </tr>
          <tr>
            <td style="border: 1px solid #eee; padding: 10px; text-align: center;">3</td>
            <td style="border: 1px solid #eee; padding: 10px;">
              ค่าน้ำประปา (จดวันที่ {{meter_reading_date}})<br>
              <span style="font-size: 12px; color: #666;">(เลขมิเตอร์: {{curr_water}} - {{prev_water}}) </span>
            </td>
            <td style="border: 1px solid #eee; padding: 10px; text-align: center;">{{water_units}}</td>
            <td style="border: 1px solid #eee; padding: 10px; text-align: center;">{{water_rate}}</td>
            <td style="border: 1px solid #eee; padding: 10px; text-align: right;">{{water_amount}}</td>
          </tr>
          <tr>
            <td style="border: 1px solid #eee; padding: 10px; text-align: center;">4</td>
            <td style="border: 1px solid #eee; padding: 10px;">ค่าเฟอร์นิเจอร์</td>
            <td style="border: 1px solid #eee; padding: 10px; text-align: center;"></td>
            <td style="border: 1px solid #eee; padding: 10px; text-align: center;"></td>
            <td style="border: 1px solid #eee; padding: 10px; text-align: right;">{{furniture_fee_amount}}</td>
          </tr>
          <tr>
            <td style="border: 1px solid #eee; padding: 10px; text-align: center;">5</td>
            <td style="border: 1px solid #eee; padding: 10px;">ค่าอินเตอร์เน็ต </td>
            <td style="border: 1px solid #eee; padding: 10px; text-align: center;">-</td>
            <td style="border: 1px solid #eee; padding: 10px; text-align: center;">-</td>
            <td style="border: 1px solid #eee; padding: 10px; text-align: right;">{{internet_fee}}</td>
          </tr>
          <tr>
            <td style="border: 1px solid #eee; padding: 10px; text-align: center;">6</td>
            <td style="border: 1px solid #eee; padding: 10px;">ค่าทำความสะอาด </td>
            <td style="border: 1px solid #eee; padding: 10px; text-align: center;">-</td>
            <td style="border: 1px solid #eee; padding: 10px; text-align: center;">-</td>
            <td style="border: 1px solid #eee; padding: 10px; text-align: right;">{{cleaning_fee}}</td>
          </tr>
        </tbody>
      </table>

      <div style="display: flex; justify-content: flex-end; margin-bottom: 20px;">
        <div style="width: 300px;">
          <div style="display: flex; justify-content: space-between; padding: 5px 0; border-bottom: 1px solid #eee;">
            <strong>ยอดรวมสุทธิ:</strong>
            <span style="font-size: 14px; color: #f3a638; font-weight: bold;">{{total_amount}} บาท</span>
          </div>
          <p style="font-size: 12px; text-align: right; margin-top: 5px; color: #666;">({{total_amount_text}}บาท)</p>
        </div>
      </div>

      <div style="background-color: #fff8f0; border: 1px solid #ffe4cc; padding: 15px; border-radius: 12px; font-size: 13px;">
        <p style="margin: 0 0 10px 0;"><strong>ช่องทางการชำระเงิน:</strong></p>
        <p style="margin: 5px 0;">โอนเข้าบัญชี: <strong>ธนาคารกสิกรไทย</strong></p>
        <p style="margin: 5px 0;">เลขที่บัญชี: <strong>XXX-X-XXXXX-X</strong></p>
        <p style="margin: 5px 0;">ชื่อบัญชี: นางนิตยวดี ภัทรานิล</p>
      </div>

      <div style="margin-top: 30px; display: flex; justify-content: flex-end; font-size: 14px;">
        <div style="text-align: right; width: 200px;">
          <p style="margin-bottom: 30px;">ผู้รับเงิน</p>
          <p>____{{admin_signature}}____</p>
          <p>({{admin_name}})</p>
          <p>วันที่ ____/____/____</p>
        </div>     
      </div>
    </div>
  `,
  is_active: true,
}
];

const ContractTemplate = () => {
  const navigate = useNavigate();
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const [templates, setTemplates] = useState(initialContractTemplates);
  const [selectedTemplate, setSelectedTemplate] = useState(
    initialContractTemplates[0],
  );
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(selectedTemplate.content);
  const [editName, setEditName] = useState(selectedTemplate.name);
  const [showVariableGuide, setShowVariableGuide] = useState(false);

  // ตัวแปรที่ใช้ได้ (Single Source of Truth)
  const availableVariables = [
    { key: "{{currentMonth}" , desc: "เดือนปัจจุบัน", example: "มกราคม"},
    { key: "{{apartment_name}}", desc: "ชื่ออะพาร์ตเมนต์", example: "หอพักนิตยวดี" },
    { key: "{{apartment_address}}", desc: "ที่อยู่อะพาร์ตเมนต์", example: "123 ถนนสุขุมวิท แขวงคลองตัน เขตวัฒนา กรุงเทพฯ 10110" },
    { key: "{{tenant_name}}", desc: "ชื่อผู้เช่า", example: "สมชาย ใจดี" },
    { key: "{{tenant_nin}}", desc: "เลขที่บัตรประชาชน", example: "1-2345-67890-12-3" },
    { key: "{{tenant_phone}}", desc: "เบอร์โทรศัพท์", example: "081-234-5678" },
    { key: "{{room_number}}", desc: "หมายเลขห้อง", example: "101" },
    { key: "{{contract_monthlyRent}}", desc: "ค่าเช่ารายเดือน", example: "5000" },
    { key: "{{contract_deposit}}", desc: "เงินประกัน", example: "10000" },
    {
      key: "{{contract_startDate}}",
      desc: "วันที่เริ่มสัญญา",
      example: "1 มกราคม 2567",
    },
    {
      key: "{{contract_endDate}}",
      desc: "วันที่สิ้นสุดสัญญา",
      example: "31 ธันวาคม 2567",
    },
    { key: "{{apartment_paymentDueEnd}}", desc: "วันที่สุดท้ายที่สามารถชำระค่าเช่าได้", example: "10" },
    { key: "{{electricity_rate}}", desc:"อัตราค่าไฟฟ้าต่อหน่วย" , example: "6.00" },
    { key: "{{water_rate}}", desc:"อัตราค่าน้ำประปาต่อหน่วย" , example: "15.00" },
    { key: "{{first_month_rent}}", desc:"ค่าเช่าเดือนแรก" , example: "5000" },
    { key: "{{room_rent_amount}}", desc:"ส่วนของค่าเช่าห้องพัก" , example: "4000" },
    { key: "{{furniture_rent_amount}}", desc:"ส่วนของค่าเฟอร์นิเจอร์" , example: "1000" },
  
  ];

  const modules = {
    toolbar: [
      [{ header: [1, 2, 3, false] }],
      ["bold", "italic", "underline", "strike"],
      [{ list: "ordered" }, { list: "bullet" }],
      [{ align: [] }],
      ["clean"],
    ],
  };

  // เรียงลำดับ show templates: status active ขึ้นก่อน แล้วค่อยเรียงด้วย id จากมากไปน้อย สร้างใหม่ไปเกก่า
const sortedTemplates = [...templates].sort((a, b) => {
  if (a.is_active !== b.is_active) {
    return b.is_active ? 1 : -1; 
  }
    return b.id - a.id;
});

  const handleSelectTemplate = (template) => {
    setSelectedTemplate(template);
    setEditContent(template.content);
    setEditName(template.name);
    setIsEditing(false);
  };

  // const handleSaveTemplate = () => {
  //   const updatedTemplates = templates.map((t) =>
  //     t.id === selectedTemplate.id
  //       ? { ...t, name: editName, content: editContent }
  //       : t,
  //   );
  //   setTemplates(updatedTemplates);
  //   setSelectedTemplate({
  //     ...selectedTemplate,
  //     name: editName,
  //     content: editContent,
  //   });
  //   setIsEditing(false);
  //   // คุณสามารถเพิ่มการเรียก API จริงที่นี่ในอนาคต
  // };

  // 1. เมื่อกดปุ่ม "บันทึก" ในหน้าเว็บ ให้เรียกฟังก์ชันนี้เพื่อเปิด Modal
  const requestSave = () => {
    setIsConfirmModalOpen(true);
  };

  //2. ฟังก์ชันที่จะทำงานเมื่อผู้ใช้กด "ยืนยัน" ใน Modal จริงๆ
  const handleConfirmSave = () => {
    const updatedTemplates = templates.map((t) =>
      t.id === selectedTemplate.id
        ? { ...t, name: editName, content: editContent }
        : t,
    );
    setTemplates(updatedTemplates);
    setSelectedTemplate({
      ...selectedTemplate,
      name: editName,
      content: editContent,
    });

    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 2000);

    setIsConfirmModalOpen(false);
  };

  // ฟังก์ชันช่วยแทรกตัวแปรลงใน Quill (ทำให้ใช้งานง่ายขึ้น)
  const insertVariable = (variableKey) => {
    setEditContent((prev) => prev + ` <strong>${variableKey}</strong> `);
  };

  const toggleStatus = () => {
    const newStatus = !selectedTemplate.is_active;
    setSelectedTemplate({ ...selectedTemplate, is_active: newStatus });

    const updatedTemplates = templates.map((t) =>
      t.id === selectedTemplate.id ? { ...t, is_active: newStatus } : t,
    );
    setTemplates(updatedTemplates);
  };

  // --- RENDERING โหมดแก้ไข---
  if (isEditing) {
    return (
      <div className="min-h-screen md:p-4">
        <div className="max-w-5xl mx-auto space-y-6">
          {/* Header Edit Mode */}
          <div className="relative text-center mb-6">
            <ExitButton
              onClick={() => setIsEditing(false)}
              className="absolute right-0 top-0"
            />
            <h1 className="text-2xl md:text-3xl font-bold mb-8 text-gray-800">
              แก้ไขเทมเพลต
            </h1>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-md font-medium">สถานะการใช้งาน</span>
            <button
              onClick={toggleStatus}
              className={`px-3 py-1 rounded-full text-xs font-bold transition cursor-pointer ${
                selectedTemplate.is_active
                  ? "bg-green-100 text-green-600"
                  : "bg-gray-200 text-gray-600"
              }`}
            >
              {selectedTemplate.is_active ? "● Active" : "○ Inactive"}
            </button>
          </div>

          <div className="flex-1 items-center">
            <span className="text-md font-medium">ชื่อเทมเพลต</span>
            <input
              type="text"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              className="w-full mt-2 px-4 py-2 border border-gray-300 rounded-xl  focus:outline-none focus:border-[#f3a638] transition-all"
            />
          </div>

          {/* Variable Toolbar (Responsive) */}
          <div className="cursor-pointer bg-orange-50 border border-orange-200 p-4 rounded-xl">
            <button
              onClick={() => setShowVariableGuide(!showVariableGuide)}
              className="flex items-center justify-between w-full font-semibold text-gray-800"
            >
              <span>
                {showVariableGuide
                  ? "ซ่อนตัวช่วยแทรกตัวแปร"
                  : "แสดงตัวช่วยแทรกตัวแปร"}
              </span>
            </button>

            {showVariableGuide && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-4">
                {availableVariables.map((v) => (
                  <button
                    key={v.key}
                    onClick={() => insertVariable(v.key)}
                    className="p-2 bg-white border border-blue-200 rounded text-xs hover:bg-blue-100 transition text-left"
                  >
                    <div className="font-mono font-bold text-blue-600">
                      {v.key}
                    </div>
                    <div className="text-gray-500">{v.desc}</div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Editor Container */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <ReactQuill
              theme="snow"
              value={editContent}
              onChange={setEditContent}
              modules={modules}
              style={{ height: "400px" }}
              className="mb-12"
            />
          </div>

          <div className="flex justify-end gap-3">
            <OrangeButton
              label="บันทึก"
              onClick={requestSave}
              className="w-full md:w-auto bg-[#f3a638] px-16"
            />
            <ConfirmModal
              isOpen={isConfirmModalOpen}
              onClose={() => setIsConfirmModalOpen(false)}
              onConfirm={handleConfirmSave}
              title="ยืนยันการแก้ไข"
              description="คุณต้องการบันทึกการเปลี่ยนแปลงของเทมเพลตเอกสารนี้ใช่หรือไม่?"
              confirmText="บันทึก"
              cancelText="ย้อนกลับ"
              variant="warning"
            />
            {showSuccess && (
              <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[110] w-[90%] md:w-auto min-w-[320px] px-6 md:px-8 py-4 bg-[#f3a638] text-white rounded-2xl shadow-2xl flex items-center justify-center gap-3 animate-in slide-in-from-top-4 fade-in duration-300">
                <CheckCircle2 size={24} className="shrink-0 " />
                <span className="font-black whitespace-nowrap text-lg">
                  แก้ไขเทมเพลตสำเร็จ
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <header className="mb-8">
        <div className="relative text-center">
          <ExitButton
            onClick={() => navigate("/settings")}
            className="absolute right-0 top-0"
          />
          <h1 className="text-2xl md:text-3xl font-bold mb-8 text-gray-800">
            ตั้งค่าเทมเพลตเอกสาร
          </h1>
        </div>
      </header>

      <div className="md:p-4 grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Sidebar: List of Templates */}
        <div className="lg:col-span-4 space-y-4">
          <h2 className="font-bold text-gray-700 px-1">เทมเพลตทั้งหมด</h2>
          {/* Sidebar: List of Templates */}
<div className="lg:col-span-4 space-y-4">
  <h2 className="font-bold text-gray-700 px-1">เทมเพลตทั้งหมด</h2>
  {/* ใช้ข้อมูลที่เรียงลำดับแล้ว */}
  {sortedTemplates.map((t) => (
    <div
      key={t.id}
      onClick={() => handleSelectTemplate(t)}
      className={`p-4 rounded-2xl border-2 cursor-pointer transition-all ${
        selectedTemplate.id === t.id
          ? "border-orange-300 bg-white shadow-md scale-[1.02]"
          : "border-transparent bg-gray-100 hover:bg-gray-200"
      }`}
    >
      <div className="flex justify-between items-start">
        <h3
          className={`font-bold ${
            selectedTemplate.id === t.id ? "text-gray-700" : "text-gray-500"
          }`}
        >
          {t.name}
        </h3>
        {/* แสดง ID เล็กๆ เพื่อให้ตรวจสอบการเรียงได้ง่าย */}
        <span className="text-[10px] text-gray-400">#{t.id}</span>
      </div>
      
      <span
        className={`text-[10px] uppercase tracking-wider font-bold px-2 py-1 rounded-full mt-2 inline-block ${
          t.is_active 
            ? "bg-green-100 text-green-600" 
            : "bg-gray-200 text-gray-500"
        }`}
      >
        {t.is_active ? "Active" : "Inactive"}
      </span>
    </div>
  ))}
</div>
        </div>

        {/* Main Content: Preview */}
        <div className="lg:col-span-8 bg-white rounded-3xl shadow-sm border border-gray-200 p-6 ">
          <div className="flex justify-between items-center mb-8 pb-4 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-800">ตัวอย่างเอกสาร</h2>
            <button
              onClick={() => setIsEditing(true)}
              className="bg-[#f3a638] text-white px-10 py-2 rounded-xl hover:bg-[#e6952e] transition text-sm flex items-center gap-2"
            >
              แก้ไข
            </button>
          </div>

          {/* Document Preview Area */}
          <div className="prose prose-orange max-w-none min-h-[400px] text-gray-700 leading-relaxed">
            <div
              dangerouslySetInnerHTML={{ __html: selectedTemplate.content }}
            />
          </div>

          <div className="mt-10 p-4 bg-amber-50 rounded-2xl border border-amber-100 flex gap-3">
            <p className="text-sm text-amber-900">
              เมื่อสร้างจากหน้าห้อง ระบบจะแทนที่ตัวแปรที่เป็น
              <code className="bg-amber-200 px-1 rounded mx-1">
                {"{{...}}"}
              </code>{" "}
              ด้วยข้อมูลจริงของผู้เช่าให้ทันที
            </p>
          </div>
        </div>
      </div>
    </>
  );
};

export default ContractTemplate;
