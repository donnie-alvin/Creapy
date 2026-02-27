import { apiSlice } from "./apiSlice";

export const listingApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    createListing: builder.mutation({
      query: (data) => {
        return {
          url: "listings",
          method: "POST",
          body: data,
        };
      },
      invalidatesTags: ["Listing"],
    }),
    getListing: builder.query({
      query: (userId) => {
        return {
          url: `listings/user/${userId}`,
          method: "GET",
        };
      },
      providesTags: ["Listing"],
    }),
    getSingleListing: builder.query({
      query: (listingId) => {
        return {
          url: `listings/listing/${listingId}`,
          method: "GET",
        };
      },
      providesTags: ["Listing"],
    }),
    deleteListing: builder.mutation({
      query: (listingId) => {
        return {
          url: `listings/${listingId}`,
          method: "DELETE",
        };
      },
      invalidatesTags: ["Listing"],
    }),
    updateListing: builder.mutation({
      query: (data) => {
        return {
          url: `listings/${data.id}`,
          method: "PUT",
          body: data.payload,
        };
      },
      invalidatesTags: ["Listing"],
    }),
    searchListings: builder.query({
      query: (searchTerm) => {
        return {
          // Express route is GET /api/v1/listings/get?...
          url: `listings/get?${searchTerm}`,
          method: "GET",
        };
      },
      providesTags: ["Listing"],
    }),
    getHomeHighlighted: builder.query({
      query: (limit = 9) => {
        return {
          url: `listings/home/highlighted?limit=${limit}`,
          method: "GET",
        };
      },
      providesTags: ["Listing"],
    }),
    getHomeGroupedByLocation: builder.query({
      query: (
        params?: { locationsLimit?: number; perLocation?: number }
      ) => {
        const { locationsLimit = 6, perLocation = 6 } = params || {};
        return {
          url: `listings/home/grouped-by-location?locationsLimit=${locationsLimit}&perLocation=${perLocation}`,
          method: "GET",
        };
      },
      providesTags: ["Listing"],
    }),
  }),
});

export const {
  useCreateListingMutation,
  useGetListingQuery,
  useDeleteListingMutation,
  useUpdateListingMutation,
  useGetSingleListingQuery,
  useSearchListingsQuery,
  useGetHomeHighlightedQuery,
  useGetHomeGroupedByLocationQuery,
} = listingApiSlice;
