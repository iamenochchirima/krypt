import axios from 'axios';
import appConfig from './app.config';

const AxiosBase = axios.create({
    baseURL: appConfig.baseUrl,
    timeout: 60000,
    headers: {
        'Content-Type': 'application/json',
    },
    withCredentials: true,
});

AxiosBase.interceptors.request.use(
    (config) => {
        return config;
    },
    (error) => {
        console.error('Request error:', error);
        return Promise.reject(error);
    }
);

AxiosBase.interceptors.response.use(
    (response) => {
        return response;
    },
    (error) => {
        const status = error.response?.status;
        console.error('Error response received:', {
            status,
            data: error.response?.data,
            headers: error.response?.headers,
        });

        if (status === 401) {
            console.error('Unauthorized - redirecting to login');
        } else if (status === 500) {
            console.error('Server error');
        }
        return Promise.reject(error);
    }
);

export default AxiosBase;
