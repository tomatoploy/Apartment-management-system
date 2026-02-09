import axios from "axios";

const API_BASE_URL = "http://localhost:5252";

const utilityMeterApi = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

export const utilityMeterService = {
  // GET /UtilityMeters
  getUtilityMeters: async () => {
    const res = await utilityMeterApi.get("/UtilityMeters");
    return res.data;
  },

  // GET /UtilityMeters/{id}
  getUtilityMeterById: async (id) => {
    const res = await utilityMeterApi.get(`/UtilityMeters/${id}`);
    return res.data;
  },

  // GET /UtilityMeters/by-month?year=&month=
  getUtilityMetersByMonth: async (year, month) => {
    const res = await utilityMeterApi.get(
      "/UtilityMeters/by-month",
      { params: { year, month } }
    );
    return res.data;
  },

  // POST /UtilityMeters (single upsert)
  createOrUpdateUtilityMeter: async (data) => {
    const res = await utilityMeterApi.post(
      "/UtilityMeters",
      data
    );
    return res.data;
  },

  // ✅ POST /UtilityMeters/bulk-upsert (ตัวหลัก)
  bulkUpsertUtilityMeters: async (data) => {
    const res = await utilityMeterApi.post(
      "/UtilityMeters/bulk-upsert",
      data
    );
    return res.data;
  },

  // DELETE /UtilityMeters/{id}
  deleteUtilityMeter: async (id) => {
    const res = await utilityMeterApi.delete(
      `/UtilityMeters/${id}`
    );
    return res.data;
  },
};

export default utilityMeterService;