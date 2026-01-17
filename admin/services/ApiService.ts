import type { AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios'
import AxiosBase from './AxiosBase'

const ApiService = {
    fetchDataWithAxios<Response = unknown, Request = Record<string, unknown>>(
        param: AxiosRequestConfig<Request>,
    ) {
        return new Promise<Response>((resolve, reject) => {
            AxiosBase(param)
                .then((response: AxiosResponse<Response>) => {
                    resolve(response.data)
                })
                .catch((errors: AxiosError) => {
                    console.log("Error in fetchDataWithAxios", errors)
                    reject(errors)
                })
        })
    },
}

export default ApiService
