import { useEffect, useMemo } from 'react';
import axios, { type AxiosInstance } from 'axios';
import i18n from '@/i18n';
import useUser from './useUser';

const useAxiosInstance = (baseUrl: string): AxiosInstance => {
  const user = useUser();

  // Ein einziges Axios-Objekt pro baseUrl
  const instance = useMemo(() => {
    return axios.create({ baseURL: baseUrl });
  }, [baseUrl]);

  useEffect(() => {
    // Request-Interceptor: Token & Sprache immer frisch setzen
    const reqId = instance.interceptors.request.use((config) => {
      const token = user.getAccessToken?.();
      config.headers = config.headers ?? {};
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      } else {
        delete config.headers.Authorization;
      }
      const lang = i18n?.language;
      if (lang) {
        config.headers['Accept-Language'] = lang;
      }
      return config;
    });

    // Optional: Response-Interceptor (z.B. 401-Handling)
    // const resId = instance.interceptors.response.use(
    //   (res) => res,
    //   (err) => {
    //     if (err?.response?.status === 401) {
    //       // z.B. Silent-Logout / Redirect
    //     }
    //     return Promise.reject(err);
    //   }
    // );

    return () => {
      instance.interceptors.request.eject(reqId);
      // instance.interceptors.response.eject(resId);
    };
  }, [instance, user, i18n.language]);

  return instance;
};

export default useAxiosInstance;
