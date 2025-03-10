import { RemoveDuplicateToast } from "@/utils/helper";
import axios, { AxiosRequestConfig, AxiosResponse } from "axios";
import { getAuth, signInWithCustomToken } from "firebase/auth";
import { auth } from "@/utils/firebaseConfig";

interface User {
  firebase_token: string;
}

export default class BaseApi {
  private static isInterceptorSet = false;
  private static isHandlingError = false;
  static useAuth: { getToken: any; };

  private static setInterceptor() {
    if (!BaseApi.isInterceptorSet) {
      axios.interceptors.response.use(
        (response: AxiosResponse) => response,
        async (error: any) => {
          if (
            error.response?.status === 401 &&
            (error.response?.data?.message === "Session Expired!" ||
              error.response?.data?.message === "Invalid token - decoding error" ||
              error.response?.data?.message === "Authorization token missing" ||
              error.response?.data?.message === "User not in our system" ||
              error.response?.data?.message === "Unauthorized User Access!")
          ) {
            if (!BaseApi.isHandlingError) {
              BaseApi.isHandlingError = true;

              const newToken = await BaseApi.refreshTokenIfNeeded();
              if (newToken) {
                error.config.headers['Authorization'] = `Bearer ${newToken}`;
                return axios.request(error.config); // Retry the request with the new token
              }

              BaseApi.isHandlingError = false;
              RemoveDuplicateToast(
                error.response?.data?.message,
                "session-expired-toast",
              );
            }
          }
          return Promise.reject(error);
        },
      );

      BaseApi.isInterceptorSet = true;
    }
  }

  private static async refreshTokenIfNeeded(): Promise<string | null> {
    try {
      const auth = getAuth();
      const user = auth.currentUser;
      if (user) {
        const refreshedToken = await user.getIdToken(true); // Force refresh
        console.log("Refreshed Token:", refreshedToken);
        return refreshedToken;
      }
    } catch (error) {
      console.error("Error refreshing token:", error);
    }
    return null;
  }

  static async mergeRequestConfig(
    config?: AxiosRequestConfig,
  ): Promise<AxiosRequestConfig<any>> {
    const baseConfig: AxiosRequestConfig = {
      baseURL: process.env.NEXT_PUBLIC_BACKEND_URL + "/api/",
      headers: {},
    };
    const auth = getAuth();
    const user = auth.currentUser;

    if (user) {
      const token = await user.getIdToken();
      if (token) {
        baseConfig.headers!["Authorization"] = `Bearer ${token}`;
      }
    }
    return { ...baseConfig, ...config };
  }

  static async post(url: string, body: any, config?: AxiosRequestConfig) {
    BaseApi.setInterceptor();
    const finalConfig = await BaseApi.mergeRequestConfig(config); // ✅ Await here
    console.log("POST - calling backend at ", url);
    return axios.post(url, body, finalConfig);
  }

  static async get(url: string, config?: AxiosRequestConfig) {
    BaseApi.setInterceptor();
    const finalConfig = await BaseApi.mergeRequestConfig(config); // ✅ Await here
    console.log("GET - calling backend at ", url);

    return axios.get(url, finalConfig);
  }

  static async patch(url: string, body: any, config?: AxiosRequestConfig) {
    BaseApi.setInterceptor();
    const finalConfig = await BaseApi.mergeRequestConfig(config); // ✅ Await here
    console.log("PATCH - calling backend at ", url);

    return axios.patch(url, body, finalConfig);
  }

  static async put(url: string, body: any, config?: AxiosRequestConfig) {
    BaseApi.setInterceptor();
    const finalConfig = await BaseApi.mergeRequestConfig(config); // ✅ Await here
    console.log("PUT - calling backend at ", url);

    return axios.put(url, body, finalConfig);
  }

  static async delete(url: string, body?: any, config?: AxiosRequestConfig) {
    BaseApi.setInterceptor();
    const finalConfig = await BaseApi.mergeRequestConfig(config); // ✅ Await here
    if (body) finalConfig.data = body;
    console.log("DELETE - calling backend at ", url);

    return axios.delete(url, finalConfig);
  }
}
