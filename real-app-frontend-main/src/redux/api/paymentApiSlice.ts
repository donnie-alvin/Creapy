import { apiSlice } from "./apiSlice";

export const paymentApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    initiateListingFee: builder.mutation({
      query: ({ listingId, phone }) => {
        return {
          url: "payments/listing-fee",
          method: "POST",
          body: { listingId, phone },
        };
      },
    }),
  }),
});

export const { useInitiateListingFeeMutation } = paymentApiSlice;
