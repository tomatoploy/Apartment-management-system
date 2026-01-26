import axios from "axios";

const API_BASE_URL = 'http://localhost:5252';

const adminApi = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

export const adminService = {
    getAdmin: async (id) => {
        const response = await adminApi.get(`/Admins/${id}`);
        return response.data;
    },

    loginAdmin: async (adminData) => {
        const response = await adminApi.post("/Admins/login", adminData);
        return response.data;
    },

    createAdmin: async (adminData) => {
        const response = await adminApi.post('/Admins', adminData);
        return response.data;
    },

    updateAdmin: async (id, adminData) => {
        const response = await adminApi.put(`/Admins/${id}`, adminData);
        return response.data;
    },

    deleteData: async (id) => {
        const response = await adminApi.delete(`/Admins/${id}`);
        return response.data;
    }
}