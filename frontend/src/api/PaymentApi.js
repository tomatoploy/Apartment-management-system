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
  // preview บิลอัตโนมัติ ยังไม่ save → admin ตรวจก่อน confirm
  generatePayment: async (contractId, year, month) => {
    const res = await paymentApi.get("/payments/generate", {
      params: { contractId, year, month },
    });
    return res.data;
  },

  // POST /payments
  // admin กด confirm หลังดู preview → save ลง DB
  createPayment: async (data) => {
    const res = await paymentApi.post("/payments", data);
    return res.data;
  },

  // PUT /payments/{id}
  updatePayment: async (id, data) => {
    const res = await paymentApi.put(`/payments/${id}`, data);
    return res.data;
  },

  // PATCH /payments/{id}/status
  // เปลี่ยนสถานะอย่างเดียว เช่น { status: "paid", paidAmount: 3850 }
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