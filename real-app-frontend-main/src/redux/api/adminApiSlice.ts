import { apiSlice } from "./apiSlice";

interface InactiveListingsParams {
  province?: string;
  city?: string;
  expiredFrom?: string;
  expiredTo?: string;
  uploadedFrom?: string;
  uploadedTo?: string;
  landlord?: string;
  page?: number;
  limit?: number;
}

interface AdminListing {
  _id: string;
  name: string;
  user?: {
    username?: string;
    email?: string;
  };
  location?: {
    province?: string;
    city?: string;
  };
  createdAt?: string;
  paymentDeadline?: string;
}

interface InactiveListingsResponse {
  data: AdminListing[];
  total: number;
}

interface BulkReviveRequest {
  ids: string[];
}

export interface BulkReviveFailure {
  id: string;
  reason: string;
}

interface BulkReviveResponse {
  revived: string[];
  failed: BulkReviveFailure[];
}

export const adminApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getInactiveListings: builder.query<InactiveListingsResponse, InactiveListingsParams>({
      query: (params) => {
        const searchParams = new URLSearchParams();

        Object.entries(params || {}).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== "") {
            searchParams.append(key, String(value));
          }
        });

        const queryString = searchParams.toString();

        return {
          url: `admin/listings/inactive?${queryString}`,
          method: "GET",
        };
      },
      providesTags: ["AdminListing"],
    }),
    bulkReviveListings: builder.mutation<BulkReviveResponse, BulkReviveRequest>({
      query: ({ ids }) => {
        return {
          url: "admin/listings/bulk-revive",
          method: "POST",
          body: { ids },
        };
      },
    }),
  }),
});

export const {
  useGetInactiveListingsQuery,
  useLazyGetInactiveListingsQuery,
  useBulkReviveListingsMutation,
} = adminApiSlice;
