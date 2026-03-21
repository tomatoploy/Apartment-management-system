import axios from "axios";

const API_BASE_URL = "http://localhost:5252";

const paymentApi = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

export const paymentService = {
  // GET /payments
  getPayments: async () => {
    const res = await paymentApi.get("/payments");
    return res.data;
  },

  // GET /payments/{id}
  getPaymentById: async (id) => {
    const res = await paymentApi.get(`/payments/${id}`);
    return res.data;
  },

  // GET /payments/by-contract/{contractId}
  getPaymentsByContract: async (contractId) => {
    const res = await paymentApi.get(`/payments/by-contract/${contractId}`);
    return res.data;
  },

  // GET /payments/by-month?year=&month=
  getPaymentsByMonth: async (year, month) => {
    const res = await paymentApi.get("/payments/by-month", {
      params: { year, month },
    });
    return res.data;
  },

  // GET /payments/generate?contractId=&year=&month=
  generatePayment: async (contractId, year, month) => {
    const res = await paymentApi.get("/payments/generate", {
      params: { contractId, year, month },
    });
    return res.data;
  },

  // POST /payments
  // data ส่งได้ทั้ง: roomRate, electricalCost, waterCost, internetCost, laundryCost,
  //   furnitureCost, additionalCost, additionalDetail, discountCost, discountDetail,
  //   contractId, adminId, recordDate, note
  // ⚠️ Backend POST ไม่รับ status/paidAmount โดยตรง → หลัง POST ต้อง PATCH status แยก
  //    ยกเว้นกรณี checkout ที่ต้องการ paid ทันที ให้ PATCH ตามหลัง
  createPayment: async (data) => {
    // แยก status / paidAmount ออกก่อน POST (Backend ไม่รับใน POST body)
    const { status, paidAmount, ...postData } = data;
    const res = await paymentApi.post("/payments", postData);
    // Backend POST ส่งกลับ { message, id, total }
    const createdId = res.data?.id;

    // ถ้าต้องการ mark paid ทันที → PATCH status ตามหลัง
    if (status && createdId) {
      await paymentApi.patch(`/payments/${createdId}/status`, {
        status,
        ...(paidAmount != null && { paidAmount }),
      });
    }
    return res.data;
  },

  // PUT /payments/{id}
  // ⚠️ Backend ปฏิเสธถ้า payment.Status === "paid" → ต้อง PUT ก่อน PATCH status เสมอ
  // ⚠️ ไม่ส่ง status / paidAmount ใน PUT เพราะ PutPaymentDto ไม่มี field เหล่านี้
  updatePayment: async (id, data) => {
    // กรอง undefined ออก เพราะ Backend PutPaymentDto จะ reject field ที่ไม่รู้จัก
    const clean = Object.fromEntries(
      Object.entries(data).filter(([, v]) => v !== undefined)
    );
    const res = await paymentApi.put(`/payments/${id}`, clean);
    return res.data;
  },

  // PATCH /payments/{id}/status
  // เปลี่ยนสถานะ + บันทึก paidAmount
  // Backend รับเฉพาะ { status, paidAmount } — ไม่มี note
  updatePaymentStatus: async (id, status, paidAmount = null) => {
    const res = await paymentApi.patch(`/payments/${id}/status`, {
      status,
      ...(paidAmount !== null && { paidAmount }),
    });
    return res.data;
  },

  // DELETE /payments/{id}
  deletePayment: async (id) => {
    const res = await paymentApi.delete(`/payments/${id}`);
    return res.data;
  },
};

export default paymentService;