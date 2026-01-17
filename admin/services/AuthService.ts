import ApiService from './ApiService'
import endpointConfig from './endpoint.config'

export interface ApiInitAuthResponse {
    success: boolean;
    session_id: string;
    expiresAt: string;
    message: string;
}

export interface ApiVerifyResponse {
    success: boolean;
    principal?: string;
    message?: string;
    error?: string;
}

export interface ApiMeResponse {
    success: boolean;
    authenticated: boolean;
    principal?: string;
    sessionCreated?: string;
    sessionExpires?: string;
}

export async function apiInitAuth() {
    return ApiService.fetchDataWithAxios<ApiInitAuthResponse>({
        url: endpointConfig.initAuth,
        method: 'post',
        data: {
            expiration_minutes: 5
        }
    })
}

export async function apiVerifyIdentity(sessionId: string) {
    return ApiService.fetchDataWithAxios<ApiVerifyResponse>({
        url: endpointConfig.verifyIdentity,
        method: 'get',
        params: {
            sessionId,
        }
    })
}

export async function apiLogout() {
    return ApiService.fetchDataWithAxios({
        url: endpointConfig.logout,
        method: 'post',
    })
}

export async function apiMe() {
    return ApiService.fetchDataWithAxios<ApiMeResponse>({
        url: endpointConfig.me,
        method: 'get',
    })
}
