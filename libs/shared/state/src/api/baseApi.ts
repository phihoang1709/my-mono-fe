import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { env } from '@my-mono-fe/shared/env';

export const baseApi = createApi({
  reducerPath: 'api',
  baseQuery: fetchBaseQuery({
    baseUrl: env.VITE_API_BASE_URL,
  }),
  tagTypes: ['Post'],
  endpoints: () => ({}),
});
