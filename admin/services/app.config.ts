import { BASE_URL } from "@/constants/urls"

export type AppConfig = {
    apiPrefix: string
    baseUrl: string
}

const appConfig: AppConfig = {
    apiPrefix: '/api',
    baseUrl: BASE_URL,
}

export default appConfig
