import axios from "axios";

const API_BASE_URL = "http://localhost:5252";

const requestApi = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        "Content-Type": "application/json",
    },
});

export const requestService = {
    getRequests: async () => {
        const response = await requestApi.get("/Requests");
        return response.data;
    },

    getRequestById: async (id) => {
        const response = await requestApi.get(`/Requests/${id}`);
        return response.data;
    },

    createRequest: async (requestData) => {
        const response = await requestApi.post("/Requests", requestData);
        return response.data;
    },

    updateRequest: async (id, requestData) => {
        const response = await requestApi.put(`/Requests/${id}`, requestData);
        return response.data;
    },

    deleteRequest: async (id) => {
        const response = await requestApi.delete(`/Requests/${id}`);
        return response.data;
    },
};