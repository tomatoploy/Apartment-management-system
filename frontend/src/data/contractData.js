//ข้อมมูลตาราง Document
export const initialContractTemplates = [
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
      <p>ค่าเฟอร์นิเจอร์ {{payment_furnitureCost}} บาท</p>
      <p>เฟอร์นิเจอร์ภายในห้องประกอบด้วย: {{furniture_list}}</p>
      
      <p><strong>ข้อ 3.</strong> ในวันทำสัญญา ผู้เช่าได้ชำระเงินในวันที่ลงนามสัญญา ดังนี้</p>
      <p>ค่าเช่าเดือนแรก {{first_month_rent}} บาท</p>
      <p>เงินประกัน <strong>{{contract_deposit}}</strong> บาท</p>
      
      <p><strong>ข้อ 4.</strong> ค่าสาธารณูปโภค:
        <ul>
          <li>ค่าไฟฟ้า หน่วยละ {{electricity_rate}} บาท</li>
          <li>ค่าน้ำประปา หน่วยละ {{water_rate}} บาท</li>
        </ul>
      </p>
      
      <p><strong>ข้อ 5.</strong> ผู้เช่าต้องชำระค่าเช่าและค่าบริการต่างๆ <strong>ภายในวันที่ {{apartment_paymentDueEnd}} ของเดือน</strong> หากเกินกำหนดจะมีค่าปรับตามที่ระบุ</p>
      
      <p><strong>ข้อ 6.</strong> การแจ้งย้ายออก ต้องแจ้งล่วงหน้าอย่างน้อย 30 วัน เป็นลายลักษณ์อักษร</p>
      
      <p><strong>ข้อ 7.</strong> ห้ามใช้เตาแก๊สภายในห้องพักโดยเด็ดขาด แต่อนุญาตให้ใช้กระทะไฟฟ้าและไมโครเวฟได้</p>

      <p><strong>ข้อ 8.</strong> ห้ามทำการต่อเติม แก้ไข ดัดแปลงทรัพย์สินภายในห้องพักโดยไม่ได้รับอนุญาตจากผู้ให้เช่า</p>

      <p><strong>ข้อ 9.</strong> เมื่อสัญญาฉบับนี้สิ้นสุดลง ผู้ให้เช่าจะต้องคืนเงินประกันให้กับผู้เช่าหลังจากตรวจสอบสภาพห้องพัก</p>

      <p>สัญญาฉบับนี้ทำขึ้นในสองฉบับ มีความถูกต้องตรงกัน ผู้ให้เช่าปละผู้เช่าต่างถือไว้คนละฉบับ ทั้งสองฝ่ายตกลงจะปฏิบัติตามข้อตกลงดังกล่าว</p>
      </br>
      </br>
      <div style="margin-top: 40px; display: flex; ">
        <div style="text-align: right;">
          <p>ลงชื่อ.....................................(ผู้ให้เช่า)</p>
          <p>{{admin_name}}</p>
        </div>
</br> </br>
        <div style="text-align: right;">
          <p> ลงชื่อ......................................(ผู้เช่า)</p>
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
    <div style="font-family: 'Sarabun', sans-serif; font-size: 12px; max-width: 800px; margin: auto; border: 1px solid #eee; padding: 20px; color: #333;">
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
            <td style="border: 1px solid #ddd; padding: 10px; text-align: left;">รายการ</td>
            <td style="border: 1px solid #ddd; padding: 10px; text-align: right;">จำนวนเงิน (บาท)</td>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style="border: 1px solid #ddd; padding: 10px;">ค่าเช่าเดือนปัจจุบัน ({{contract_monthlyRent}})</td>
            <td style="border: 1px solid #ddd; padding: 10px; text-align: right;">{{monthly_rent}}</td>
          </tr>
          <tr>
            <td style="border: 1px solid #ddd; padding: 10px;">เงินประกันความเสียหาย</td>
            <td style="border: 1px solid #ddd; padding: 10px; text-align: right;">{{contract_deposit}}</td>
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
        • มิเตอร์ไฟฟ้า: {{contract_initialElectricUnit}} <br>
        • มิเตอร์น้ำ: {{contract_initialWaterUnit}} <br>
      </div>

      <div style="font-size: 12px; color: #666; margin-bottom: 30px;">
        <p>* ผู้เช่าได้รับกุญแจและคีย์การ์ดเรียบร้อยแล้ว ณ วันที่ลงนาม</p>
        <p>* ชำระผ่าน: ธนาคารกสิกรไทย เลขที่บัญชี XXX-X-XXXXX-X นางนิตยวดี ภัทรานิล</p>
      </div>
</br></br>
      <div style="display: flex; justify-content: space-around; margin-top: 50px; font-size: 12px;">
        <div style="text-align: center;">
          <p>__________________________</p>
          <p>ลงชื่อผู้ชำระเงิน (ผู้เช่า)</p>
          <p>({{tenant_name}})</p>
        </div></br> </br>
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
      </br>
      <table style="width: 100%; border-collapse: collapse; font-size: 14px; margin-bottom: 10px;">
        <thead>
          <tr style="color: ##e6952e;">
<td style="padding: 5px 2px; text-align: center; width: 10px; border: 1px solid #e6952e;">ลำดับ</td>            <td style="padding: 10px; text-align: left; border: 1px solid #e6952e;">รายการ </td>
            <td style="padding: 10px; text-align: center; border: 1px solid #e6952e;">หน่วย</td>
            <td style="padding: 10px; text-align: center; border: 1px solid #e6952e;">ราคา/หน่วย</td>
            <td style="padding: 10px; text-align: right; border: 1px solid #e6952e;">รวม (บาท)</td>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style="border: 1px solid #eee; padding: 5px; text-align: center;">1</td>
            <td style="border: 1px solid #eee; padding: 10px;">ค่าเช่าห้อง และค่าเช่าเฟอร์นิเจอร์ </td>
            <td style="border: 1px solid #eee; padding: 10px; text-align: center;">-</td>
            <td style="border: 1px solid #eee; padding: 10px; text-align: center;">-</td>
            <td style="border: 1px solid #eee; padding: 10px; text-align: right;">{{monthly_rent}}</td>
          </tr>
          <tr>
            <td style="border: 1px solid #eee; padding: 5px; text-align: center;">2</td>
            <td style="border: 1px solid #eee; padding: 10px;">
              ค่าไฟฟ้า </td>
            <td style="font-size: 12px; color: #666;">{{curr_elec}} - {{prev_elec}}= {{elec_units}}</td>
            <td style="border: 1px solid #eee; padding: 10px; text-align: center;">{{elec_rate}}</td>
            <td style="border: 1px solid #eee; padding: 10px; text-align: right;">{{elec_amount}}</td>
          </tr>
          <tr>
            <td style="border: 1px solid #eee; padding: 5px; text-align: center;">3</td>
            <td style="border: 1px solid #eee; padding: 10px;">
              ค่าน้ำประปา </td>
              <td span style="font-size: 12px; color: #666;">{{curr_water}} - {{prev_water}})= {{water_units}} </td>
            <td style="border: 1px solid #eee; padding: 10px; text-align: center;">{{water_rate}}</td>
            <td style="border: 1px solid #eee; padding: 10px; text-align: right;">{{water_amount}}</td>
          </tr>
          <tr>
            <td style="border: 1px solid #eee; padding: 5px; text-align: center;">4</td>
            <td style="border: 1px solid #eee; padding: 10px;">ค่าเฟอร์นิเจอร์</td>
            <td style="border: 1px solid #eee; padding: 10px; text-align: center;">-</td>
            <td style="border: 1px solid #eee; padding: 10px; text-align: center;">-</td>
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
            <td style="border: 1px solid #eee; padding: 5px; text-align: center;">6</td>
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
  },
];