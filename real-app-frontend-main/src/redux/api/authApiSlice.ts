import { apiSlice } from "./apiSlice";

export const authApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    signup: builder.mutation({
      query: (data) => {
        return {
          url: "users/signup",
          method: "POST",
          body: data,
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            "Access-Control-Allow-Origin": "*",
          },
        };
      },
    }),
    login: builder.mutation({
      query: (data) => {
        return {
          url: "users/login",
          method: "POST",
          body: data,
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            "Access-Control-Allow-Origin": "*",
          },
        };
      },
    }),
    verifyEmail: builder.query({
      query: (token) => {
        return {
          url: `users/verify-email?token=${encodeURIComponent(token)}`,
          method: "GET",
        };
      },
    }),
    googleLogin: builder.mutation({
      query: (data) => {
        return {
          url: "users/google",
          method: "POST",
          body: data,
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            "Access-Control-Allow-Origin": "*",
          },
        };
      },
    }),
  }),
});

export const {
  useSignupMutation,
  useLoginMutation,
  useVerifyEmailQuery,
  useGoogleLoginMutation,
} = authApiSlice;
