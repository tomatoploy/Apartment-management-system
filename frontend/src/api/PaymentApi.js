import axios from "axios";

const API_BASE_URL = "https://apartment-management-system-zllm.onrender.com";

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
  // POST /payments
  createPayment: async (data) => {
    const { status, paidAmount, ...postData } = data;
    const res = await paymentApi.post("/payments", postData); 
    const createdId = res.data?.id;

    if (status && createdId) {
      await paymentApi.patch(`/payments/${createdId}/status`, {
        status,
        ...(paidAmount != null && { paidAmount }),
      });
    }
    return res.data;
  },

  // PUT /payments/{id}
  updatePayment: async (id, data) => {
    const clean = Object.fromEntries(
      Object.entries(data).filter(([, v]) => v !== undefined)
    );
    const res = await paymentApi.put(`/payments/${id}`, clean);
    return res.data;
  },

  // PATCH /payments/{id}/status
  updatePaymentStatus: async (id, status, paidAmount = null) => {
    const res = await paymentApi.patch(`/payments/${id}/status`, {
      status,
      ...(paidAmount !== null && { paidAmount }),
    });
    return res.data;
  },

  sendLineNotify: async (id) => {
    // ยิง API ไปที่ Endpoint ใหม่ที่เราเพิ่งสร้างใน C#
    const res = await paymentApi.post(`/payments/${id}/notify`);
    return res.data;
  },

  // DELETE /payments/{id}
  deletePayment: async (id) => {
    const res = await paymentApi.delete(`/payments/${id}`);
    return res.data;
  },
};

export default paymentService;