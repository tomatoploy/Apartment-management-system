import axios from "axios";

const API_BASE_URL = 'https://apartment-management-system-zllm.onrender.com';

const apartmentApi = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json'
    }
});

export const apartmentService = {
    getApartment: async (id) => {
        const response = await apartmentApi.get(`/Apartments/${id}`);
        return response.data;
    },

    getAllApartment: async () =>{
        const response = await apartmentApi.get(`/Apartments`);
        return response.data;
    },

    postApartment: async (apartmentData) =>{
        const response = await apartmentApi.post(`/Apartments`, apartmentData);
        return response.data;
    },

    putApartment: async (id, apartmentData) =>{
        const response = await apartmentApi.put(`/Apartments/${id}`, apartmentData);
        return response.data;
    },

    deleteApartment: async (id) =>{
        const response = await apartmentApi.delete(`/Apartments/${id}`);
        return response.data;
    }
}