import { apiSlice } from "./apiSlice";

export const paymentApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getMyPayments: builder.query({
      query: () => {
        return {
          url: "payments/mine",
          method: "GET",
        };
      },
      providesTags: ["Payment"],
    }),
    initiateListingFee: builder.mutation({
      query: ({ listingId, phone }) => {
        return {
          url: "payments/listing-fee",
          method: "POST",
          body: { listingId, phone },
        };
      },
      invalidatesTags: ["Payment"],
    }),
    initiateTenantPremium: builder.mutation({
      query: ({ phone }) => {
        return {
          url: "payments/tenant-premium",
          method: "POST",
          body: { phone },
        };
      },
      invalidatesTags: ["Payment"],
    }),
  }),
});

export const {
  useGetMyPaymentsQuery,
  useInitiateListingFeeMutation,
  useInitiateTenantPremiumMutation,
} = paymentApiSlice;
