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
    verifyPhone: builder.mutation({
      query: ({ otp, email }) => {
        return {
          url: "users/verify-phone",
          method: "POST",
          body: { otp, email },
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            "Access-Control-Allow-Origin": "*",
          },
        };
      },
    }),
    resendPhoneOtp: builder.mutation({
      query: ({ email }) => {
        return {
          url: "users/resend-phone-otp",
          method: "POST",
          body: { email },
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            "Access-Control-Allow-Origin": "*",
          },
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
  useVerifyPhoneMutation,
  useResendPhoneOtpMutation,
  useGoogleLoginMutation,
} = authApiSlice;
