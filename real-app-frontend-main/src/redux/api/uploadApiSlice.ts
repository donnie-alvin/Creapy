import { apiSlice } from "./apiSlice";

type GetR2SignedUrlArgs = {
  contentType: string;
  folder: string;
};

export type R2SignedUrlData = {
  uploadUrl: string;
  key: string;
  publicUrl: string;
};

type R2SignedUrlResponse = {
  status: string;
  data: R2SignedUrlData;
};

export const uploadApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getR2SignedUrl: builder.mutation<R2SignedUrlData, GetR2SignedUrlArgs>({
      query: ({ contentType, folder }) => ({
        url: "uploads/r2-sign",
        method: "GET",
        params: { contentType, folder },
      }),
      transformResponse: (response: R2SignedUrlResponse) => response.data,
    }),
  }),
});

export const { useGetR2SignedUrlMutation } = uploadApiSlice;
