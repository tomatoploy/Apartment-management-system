import axios from "axios";

const API_BASE_URL = "https://apartment-management-system-zllm.onrender.com";

const parcelApi = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

export const parcelService = {
  getParcels: async () => {
    const response = await parcelApi.get("/Parcels");
    return response.data;
  },

  getParcelById: async (id) => {
    const response = await parcelApi.get(`/Parcels/${id}`);
    return response.data;
  },

  createParcel: async (parcelData) => {
    const response = await parcelApi.post("/Parcels", parcelData);
    return response.data;
  },

  updateParcel: async (id, parcelData) => {
    const response = await parcelApi.put(`/Parcels/${id}`, parcelData);
    return response.data;
  },

  deleteParcel: async (id) => {
    const response = await parcelApi.delete(`/Parcels/${id}`);
    return response.data;
  },
};