import axios from 'axios';
import { API_BASE } from '../config/apiConfig';


export const loginApi = (username: string, password: string) => {
    console.log("===From authService: Attempting login for user:===", username);
    return axios.post(`${API_BASE.BASE_URL}/auth/login`, { username, password });
};

export const refreshTokenApi = (refreshToken: string) => {
    return axios.post(`${API_BASE.BASE_URL}/auth/refresh`, { refreshToken });
};