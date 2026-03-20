import axios from "axios";

const API_BASE_URL = 'http://localhost:5252';

const contractApi = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json'
    }
});

export const contractService = {
    // GET: ดึงข้อมูลสัญญาเดียวด้วย ID
    getContract: async (id) => {
        const response = await contractApi.get(`/Contracts/${id}`);
        return response.data;
    },

    // GET: ดึงข้อมูลสัญญาทั้งหมด
    getAllContracts: async () => {
        const response = await contractApi.get(`/Contracts`);
        return response.data;
    },

    // POST: สร้างสัญญาใหม่
    postContract: async (contractData) => {
        const response = await contractApi.post(`/Contracts`, contractData);
        return response.data;
    },

    // PUT: แก้ไขข้อมูลสัญญา
    putContract: async (id, contractData) => {
        const response = await contractApi.put(`/Contracts/${id}`, contractData);
        return response.data;
    },

    // DELETE: ลบสัญญา
    deleteContract: async (id) => {
        const response = await contractApi.delete(`/Contracts/${id}`);
        return response.data;
    }
};